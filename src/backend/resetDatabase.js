/**
 * BlueChain MRV - Safe Database Reset Utility
 * 
 * Safely clears all application records from MongoDB for fresh testing.
 * Does NOT delete the database or alter schemas.
 * 
 * Usage:
 *   node resetDatabase.js            -> Preview database record counts (Safe / Read-only)
 *   node resetDatabase.js --check    -> Check database collections & doc counts
 *   node resetDatabase.js --confirm  -> Execute deletion of all documents across collections
 */

const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const APP_COLLECTIONS = [
  { name: 'forms_db', description: 'Projects, MRV Baseline, Evidence & AI Verification' },
  { name: 'verified_ngos_db', description: 'NGO DARPAN Identity Verification Registry' },
  { name: 'dao_validators_db', description: 'DAO Validator Login Accounts' },
  { name: 'corporate_accounts_db', description: 'Corporate Company Login Accounts' },
  { name: 'users_db', description: 'User Accounts' },
  { name: 'admin_db', description: 'Admin Accounts' },
  { name: 'companies_db', description: 'Companies & Carbon Credit Balances' },
  { name: 'daos_db', description: 'DAO Organizations' },
  { name: 'project_registrations_db', description: 'DAO Project Registrations' },
  { name: 'carts_db', description: 'Marketplace Carts' },
  { name: 'proposals_db', description: 'Governance Proposals' },
  { name: 'retirements_db', description: 'Carbon Credit Retirements & Certificates' },
  { name: 'user_roles_db', description: 'Wallet Address Role Mappings' }
];

function httpPost(urlPath, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 4000
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(postData);
    req.end();
  });
}

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'GET',
      timeout: 4000
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.end();
  });
}

async function main() {
  const isConfirmed = process.argv.includes('--confirm');
  const isCheckOnly = process.argv.includes('--check') || process.argv.includes('--status');
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/forms_db';

  console.log('\n======================================================');
  console.log('   🌿 BLUECHAIN MRV - DATABASE RESET UTILITY');
  console.log('======================================================');

  // 1. Try checking via running backend server first
  let serverOnline = false;
  let serverStats = null;

  try {
    const res = await httpGet('/api/admin/database-status');
    if (res.status === 200 && res.data && res.data.success) {
      serverOnline = true;
      serverStats = res.data;
    }
  } catch {
    serverOnline = false;
  }

  // 2. If server is online, communicate directly with the server's connected database instance
  if (serverOnline) {
    console.log('Connected to running backend server (port 5000).\n');

    if (!isConfirmed) {
      console.log('------------------------------------------------------');
      console.log('  CURRENT DATABASE STATUS & COLLECTION RECORD COUNTS');
      console.log('------------------------------------------------------');

      const colMap = new Map((serverStats.collections || []).map(c => [c.collection, c.count]));
      let totalDocs = 0;

      for (const item of APP_COLLECTIONS) {
        if (colMap.has(item.name)) {
          const count = colMap.get(item.name);
          totalDocs += count;
          console.log(`  • ${item.name.padEnd(26)} : ${count.toString().padStart(4)} docs  (${item.description})`);
        } else {
          console.log(`  • ${item.name.padEnd(26)} : [Collection not yet created]`);
        }
      }

      console.log('------------------------------------------------------');
      console.log(`  Total Active Documents Found : ${totalDocs}`);
      console.log('------------------------------------------------------\n');

      if (isCheckOnly) {
        console.log('Status check complete. No records were modified.');
      } else {
        console.log('⚠️  SAFETY NOTICE: Deletion was NOT performed.');
        console.log('To permanently clear all documents from these collections, run:');
        console.log('👉 node src/backend/resetDatabase.js --confirm\n');
      }
      process.exit(0);
    }

    // Confirmed reset via server
    console.log('⚠️  CONFIRMATION DETECTED (--confirm). Executing safe reset...\n');
    try {
      const resetRes = await httpPost('/api/admin/reset-database', { confirm: true });
      if (resetRes.status === 200 && resetRes.data && resetRes.data.success) {
        console.log('------------------------------------------------------');
        console.log('  RESET SUMMARY - DOCUMENTS DELETED PER COLLECTION');
        console.log('------------------------------------------------------');
        for (const r of resetRes.data.results || []) {
          console.log(`  [✓] ${r.collection.padEnd(26)} : ${r.deleted.toString().padStart(4)} deleted`);
        }
        console.log('------------------------------------------------------');
        console.log(`  Total Documents Deleted      : ${resetRes.data.totalDeleted}`);
        console.log('  Database Structure & Schemas : Preserved (Unchanged)');
        console.log('------------------------------------------------------\n');
        console.log('✅ Database reset successfully completed for fresh testing.\n');
        process.exit(0);
      }
    } catch (err) {
      console.error('Server reset API encountered an error:', err.message);
      process.exit(1);
    }
  }

  // 3. Standalone Direct Mongoose fallback
  console.log(`Connecting directly to MongoDB URI: ${mongoUri}\n`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log('Connected to MongoDB.\n');
  } catch (err) {
    console.error('Direct MongoDB connection error:', err.message);
    console.log('\nNote: If your backend runs embedded In-Memory MongoDB, restarting the backend server (`npm start` or `node server.js`) starts with a completely fresh state.');
    process.exit(1);
  }

  const db = mongoose.connection.db;
  const existingCollectionsList = await db.listCollections().toArray();
  const existingNames = new Set(existingCollectionsList.map(c => c.name));

  if (!isConfirmed) {
    console.log('------------------------------------------------------');
    console.log('  CURRENT DATABASE STATUS & COLLECTION RECORD COUNTS');
    console.log('------------------------------------------------------');

    let totalDocs = 0;
    for (const item of APP_COLLECTIONS) {
      if (existingNames.has(item.name)) {
        const count = await db.collection(item.name).countDocuments();
        totalDocs += count;
        console.log(`  • ${item.name.padEnd(26)} : ${count.toString().padStart(4)} docs  (${item.description})`);
      } else {
        console.log(`  • ${item.name.padEnd(26)} : [Collection not yet created]`);
      }
    }

    console.log('------------------------------------------------------');
    console.log(`  Total Active Documents Found : ${totalDocs}`);
    console.log('------------------------------------------------------\n');

    if (isCheckOnly) {
      console.log('Status check complete. No records were modified.');
    } else {
      console.log('⚠️  SAFETY NOTICE: Deletion was NOT performed.');
      console.log('To permanently clear all documents from these collections, run:');
      console.log('👉 node src/backend/resetDatabase.js --confirm\n');
    }

    await mongoose.connection.close();
    process.exit(0);
  }

  console.log('⚠️  CONFIRMATION DETECTED (--confirm). Executing safe reset...\n');

  let totalDeleted = 0;
  const results = [];

  for (const item of APP_COLLECTIONS) {
    if (existingNames.has(item.name)) {
      const res = await db.collection(item.name).deleteMany({});
      const deletedCount = res.deletedCount || 0;
      totalDeleted += deletedCount;
      results.push({ name: item.name, deleted: deletedCount, status: 'CLEARED' });
    } else {
      results.push({ name: item.name, deleted: 0, status: 'NOT_FOUND' });
    }
  }

  console.log('------------------------------------------------------');
  console.log('  RESET SUMMARY - DOCUMENTS DELETED PER COLLECTION');
  console.log('------------------------------------------------------');
  for (const r of results) {
    const statusIcon = r.status === 'CLEARED' ? '✓' : '-';
    console.log(`  [${statusIcon}] ${r.name.padEnd(26)} : ${r.deleted.toString().padStart(4)} deleted`);
  }
  console.log('------------------------------------------------------');
  console.log(`  Total Documents Deleted      : ${totalDeleted}`);
  console.log('  Database Structure & Schemas : Preserved (Unchanged)');
  console.log('------------------------------------------------------\n');
  console.log('✅ Database reset successfully completed for fresh testing.\n');

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal Error during database reset:', err);
  process.exit(1);
});
