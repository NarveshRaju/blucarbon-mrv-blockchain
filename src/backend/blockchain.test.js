const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Wallet, keccak256 } = require('ethers');
const { mintMessage, validateAuthorization, triggerMinting } = require('./blockchain');
const { issueSession } = require('./validatorSessions');
const owner = Wallet.createRandom();
const recipient = Wallet.createRandom();
const address = Wallet.createRandom().address;
const project = { _id: 'project-one', walletAddress: recipient.address, saplingsPlanted: 12 };

test('only the owner can authorize exact project, recipient, amount and contract', async () => {
  const now = Date.now();
  const signature = await owner.signMessage(mintMessage(project, address, now));
  assert.doesNotThrow(() => validateAuthorization(project, address, now, signature, owner.address, now));
  for (const changed of [{ ...project, _id: 'other' }, { ...project, saplingsPlanted: 13 }, { ...project, walletAddress: owner.address }]) {
    assert.throws(() => validateAuthorization(changed, address, now, signature, owner.address, now));
  }
  assert.throws(() => validateAuthorization(project, recipient.address, now, signature, owner.address, now));
  const forged = await recipient.signMessage(mintMessage(project, address, now));
  assert.throws(() => validateAuthorization(project, address, now, forged, owner.address, now));
});
test('expired, future and malformed timestamps are rejected', () => {
  const now = Date.now();
  for (const timestamp of [now - 300001, now + 300001, String(now), null]) {
    assert.throws(() => validateAuthorization(project, address, timestamp, '0x', owner.address, now), /expired/);
  }
});
function fakeChain(events) {
  return {
    contract: { mintAndRecordApproval: { populateTransaction: async (to, amount, id) => {
      assert.equal(to, recipient.address); assert.equal(amount, 12n * 10n ** 18n); assert.equal(id, project._id);
      return {};
    } } },
    wallet: { populateTransaction: async request => ({ ...request, chainId: 11155111n }), signTransaction: async () => '0x1234' },
    provider: { broadcastTransaction: async () => events.push('broadcast') }
  };
}
test('transaction hash is durably recorded before broadcast', async () => {
  const events = [];
  const hash = await triggerMinting(project, fakeChain(events), async hash => {
    assert.equal(hash, keccak256('0x1234')); events.push('saved');
  });
  assert.equal(hash, keccak256('0x1234'));
  assert.deepEqual(events, ['saved', 'broadcast']);
});
test('database failure prevents broadcasting', async () => {
  const events = [];
  await assert.rejects(triggerMinting(project, fakeChain(events), async () => { throw new Error('database unavailable'); }));
  assert.deepEqual(events, []);
});
test('invalid recipient and quantities are rejected before any transaction', async () => {
  for (const changed of [{ ...project, walletAddress: 'bad' }, ...[0, -1, 1.5, NaN, Infinity].map(saplingsPlanted => ({ ...project, saplingsPlanted }))]) {
    await assert.rejects(triggerMinting(changed, {}, async () => {}));
  }
});

test('mainnet is refused before contract access or transaction signing', async () => {
  const { getBlockchain } = require('./blockchain');
  const keys = ['ALCHEMY_SEPOLIA_RPC_URL', 'CONTRACT_ADDRESS', 'ADMIN_PRIVATE_KEY'];
  const saved = keys.map(key => process.env[key]);
  let destroyed = false;
  try {
    process.env.ALCHEMY_SEPOLIA_RPC_URL = 'https://example.invalid';
    process.env.CONTRACT_ADDRESS = address;
    process.env.ADMIN_PRIVATE_KEY = owner.privateKey;
    await assert.rejects(getBlockchain({ JsonRpcProvider: class {
      async getNetwork() { return { chainId: 1n }; }
      destroy() { destroyed = true; }
    } }), /Only Sepolia/);
    assert.equal(destroyed, true);
  } finally {
    keys.forEach((key, i) => { if (saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i]; });
  }
});

test('HTTP relayer confirms retries without broadcasting a second transaction', async t => {
  const express = require('express');
  const routes = require('./blockchainRoutes');
  const events = [];
  let receipt = null;
  const record = { ...project, status: 'dao_approved' };
  const model = {
    findById: async () => ({ ...record }),
    findOneAndUpdate: async () => {
      if (record.blockchainState || record.status !== 'dao_approved') return null;
      record.blockchainState = 'preparing'; return { ...record };
    },
    updateOne: async (filter, update) => Object.assign(record, update.$set)
  };
  const chain = fakeChain(events);
  Object.assign(chain, { address, owner: owner.address });
  Object.assign(chain.provider, { destroy() {}, getTransactionReceipt: async () => receipt });
  const app = express();
  app.use(express.json());
  app.use('/blockchain', routes(model, { getBlockchain: async () => chain }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const url = `http://127.0.0.1:${server.address().port}/blockchain/projects/project-one`;
  const timestamp = Date.now();
  const signature = await owner.signMessage(mintMessage(project, address, timestamp));
  const mint = sig => fetch(url + '/mint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timestamp, signature: sig }) });
  assert.equal((await mint(await recipient.signMessage(mintMessage(project, address, timestamp)))).status, 400);
  assert.deepEqual(events, []);
  record.status = 'submitted';
  assert.equal((await mint(signature)).status, 409);
  assert.deepEqual(events, []);
  record.status = 'dao_approved';
  assert.equal((await mint(signature)).status, 202);
  assert.equal(record.status, 'dao_approved');
  assert.equal((await mint(signature)).status, 202);
  assert.deepEqual(events, ['broadcast']);
  receipt = { status: 0, to: address, blockNumber: 10 };
  assert.equal((await fetch(url + '/receipt')).status, 409);
  assert.equal(record.status, 'dao_approved');
  receipt = { status: 1, to: address, blockNumber: 11 };
  const confirmed = await (await fetch(url + '/receipt')).json();
  assert.equal(confirmed.confirmed, true);
  assert.equal(record.status, 'credit_issued');
  assert.equal(record.blockchainBlock, 11);
  assert.equal((await mint(signature)).status, 200);
  assert.deepEqual(events, ['broadcast']);
});

test('authenticated validator final approval mints automatically without an owner signature', async t => {
  const express = require('express');
  const routes = require('./blockchainRoutes');
  const events = [];
  const record = { ...project, status: 'submitted' };
  const model = {
    findById: async () => ({ ...record }),
    findOneAndUpdate: async (filter, update) => {
      if (!filter.status.$in.includes(record.status)) return null;
      if (filter.blockchainState.$nin.includes(record.blockchainState)) return null;
      if (filter.blockchainTx && record.blockchainTx) return null;
      Object.assign(record, update.$set);
      return { ...record };
    },
    updateOne: async (filter, update) => Object.assign(record, update.$set)
  };
  const chain = fakeChain(events);
  Object.assign(chain, { address, owner: owner.address });
  Object.assign(chain.provider, { destroy() {}, getTransactionReceipt: async () => null });
  const app = express(); app.use(express.json());
  app.use('/blockchain', routes(model, { getBlockchain: async () => chain }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const url = `http://127.0.0.1:${server.address().port}/blockchain/projects/project-one`;
  const send = (path, token) => fetch(url + path, { method: 'POST', headers: {
    'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {})
  }, body: JSON.stringify({ role: 'validator' }) });
  assert.equal((await send('/approve')).status, 401);
  assert.equal((await send('/approve', 'forged')).status, 401);
  assert.equal((await send('/mint')).status, 401);
  assert.equal(record.status, 'submitted');
  const token = issueSession('test-validator');
  assert.equal((await send('/approve', token)).status, 409);
  record.status = 'validator_pending';
  assert.equal((await send('/approve', token)).status, 202);
  assert.equal(record.status, 'approved');
  assert.equal(record.blockchainState, 'pending');
  assert.equal(record.mintedTokens, 12);
  assert.deepEqual(events, ['broadcast']);
  assert.equal((await send('/approve', token)).status, 202);
  assert.deepEqual(events, ['broadcast']);
});
