const express = require('express');
const { requireValidator } = require('./validatorSessions');
const { getBlockchain, mintMessage, validateAuthorization, triggerMinting, explorer } = require('./blockchain');

module.exports = function blockchainRoutes(Form, dependencies = {}) {
  const connect = dependencies.getBlockchain || getBlockchain;
  const router = express.Router();
  let busy = false; // Run one relayer process; serialize wallet nonces across projects.
  router.get('/projects/:id/receipt', async (req, res) => {
    let chain;
    try {
      const project = await Form.findById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });
      if (!project.blockchainTx) return res.json({ confirmed: false, pending: false });
      chain = await connect();
      const receipt = await chain.provider.getTransactionReceipt(project.blockchainTx);
      if (!receipt) return res.json({ pending: true, transactionHash: project.blockchainTx });
      if (receipt.status !== 1 || receipt.to?.toLowerCase() !== chain.address.toLowerCase()) {
        if (receipt.status !== 1) await Form.updateOne({ _id: project._id }, { $set: { blockchainState: 'reverted' } });
        return res.status(409).json({ error: 'Transaction failed or contract configuration changed. Administrator review required.' });
      }
      await Form.updateOne({ _id: project._id }, { $set: { status: 'credit_issued', blockchainState: 'confirmed', blockchainBlock: receipt.blockNumber } });
      res.json({ confirmed: true, transactionHash: project.blockchainTx, link: explorer(project.blockchainTx) });
    } catch (err) { res.status(503).json({ error: err.message }); }
    finally { chain?.provider.destroy(); }
  });
  router.get('/config', async (req, res) => {
    let chain;
    try {
      chain = await connect();
      const balance = /^0x[0-9a-fA-F]{40}$/.test(req.query.account || '')
        ? await chain.contract.balanceOf(req.query.account) : 0n;
      res.json({ chainId: 11155111, network: 'Sepolia', testnet: true,
        contractAddress: chain.address, owner: chain.owner,
        totalSupply: String(await chain.contract.totalSupply()), balance: String(balance) });
    } catch (err) { res.status(503).json({ error: err.message }); }
    finally { chain?.provider.destroy(); }
  });
  router.get('/projects/:id/authorization', async (req, res) => {
    let chain;
    try {
      const project = await Form.findById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });
      chain = await connect();
      const timestamp = Date.now();
      res.json({ timestamp, message: mintMessage(project, chain.address, timestamp) });
    } catch (err) { res.status(400).json({ error: err.message }); }
    finally { chain?.provider.destroy(); }
  });
  async function mintHandler(req, res) {
    if (busy) return res.status(409).json({ error: 'Relayer is busy. Please retry shortly.' });
    busy = true;
    let chain, locked = false, prepared = false;
    try {
      let project = await Form.findById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });
      if (req.finalApproval && !project.blockchainTx) {
        project = await Form.findOneAndUpdate({ _id: project._id,
          status: { $in: ['validator_pending', 'under_verification', 'ai_passed', 'dao_review', 'validator_approved', 'Approved', 'approved', 'dao_approved'] },
          blockchainState: { $nin: ['preparing', 'pending', 'confirmed'] }
        }, { $set: { status: 'approved', updatedAt: new Date() } }, { new: true });
        if (!project) return res.status(409).json({ error: 'Project must complete validator review before final approval.' });
      }
      chain = await connect();
      if (!req.validatorSession) validateAuthorization(project, chain.address, req.body.timestamp, req.body.signature, chain.owner);
      if (project.blockchainTx) {
        const receipt = await chain.provider.getTransactionReceipt(project.blockchainTx);
        if (!receipt) return res.status(202).json({ pending: true, transactionHash: project.blockchainTx, link: explorer(project.blockchainTx) });
        if (receipt.status !== 1 || receipt.to?.toLowerCase() !== chain.address.toLowerCase()) throw new Error('Transaction failed or contract configuration changed. Administrator review required.');
        await Form.updateOne({ _id: project._id }, { $set: { status: 'credit_issued', blockchainState: 'confirmed', blockchainBlock: receipt.blockNumber } });
        return res.json({ confirmed: true, transactionHash: project.blockchainTx, link: explorer(project.blockchainTx) });
      }
      project = await Form.findOneAndUpdate({ _id: project._id,
        status: { $in: ['Approved', 'approved', 'dao_approved'] },
        blockchainState: { $nin: ['preparing', 'pending', 'confirmed'] },
        blockchainTx: { $in: [null, ''] }
      }, { $set: { blockchainState: 'preparing' } }, { new: true });
      if (!project) return res.status(409).json({ error: 'Project needs DAO approval or already has a mint in progress.' });
      locked = true;
      // Recheck signed fields after taking the database lock.
      if (!req.validatorSession) validateAuthorization(project, chain.address, req.body.timestamp, req.body.signature, chain.owner);
      const hash = await triggerMinting(project, chain, async transactionHash => {
        prepared = true; // A write timeout has an unknown outcome; never release its lock automatically.
        await Form.updateOne({ _id: project._id }, { $set: { blockchainTx: transactionHash, blockchainState: 'pending', mintedTokens: project.saplingsPlanted } });
      });
      res.status(202).json({ pending: true, transactionHash: hash, link: explorer(hash) });
    } catch (err) {
      if (locked && !prepared) await Form.updateOne({ _id: req.params.id }, { $set: { blockchainState: 'failed' } });
      res.status(400).json({ error: prepared ? 'Transaction recorded. Check its confirmation before retrying; it will not be minted twice.' : err.message });
    } finally { busy = false; chain?.provider.destroy(); }
  }
  router.approveAndMint = (req, res) => { req.finalApproval = true; return mintHandler(req, res); };
  router.post('/projects/:id/approve', requireValidator, router.approveAndMint);
  // Validator sessions are the normal demo flow. Signed owner requests remain compatible.
  router.post('/projects/:id/mint', (req, res, next) => {
    if (req.headers.authorization) return requireValidator(req, res, next);
    if (req.body.signature) return next();
    return res.status(401).json({ error: 'Sign in as a validator to issue demo tokens.' });
  }, mintHandler);
  return router;
};
