export function getMintStatus(project) {
  if (project.blockchainState === 'confirmed' && project.blockchainTx) {
    return { label: 'Tokens minted', description: 'The mint transaction is confirmed on Sepolia.', confirmed: true };
  }
  if (project.blockchainState === 'failed' || project.blockchainState === 'reverted') {
    return { label: 'Mint failed', description: 'No successful issuance is recorded. Review the transaction or ask the contract owner to retry.' };
  }
  if (project.blockchainTx) return { label: 'Confirmation pending', description: 'A transaction hash is recorded. Check its network status below; tokens are not yet confirmed.' };
  if (project.blockchainState === 'preparing' || project.blockchainState === 'pending') {
    return { label: 'Mint request in progress', description: 'No transaction hash is available yet. Refresh the status. If this persists, the administrator must review the request.' };
  }
  if (['approved', 'dao_approved'].includes(String(project.status).toLowerCase())) {
    return { label: 'Approved · not minted', description: 'No mint transaction is recorded yet. A signed-in validator can submit or retry issuance through the backend.', ready: true };
  }
  if (project.status === 'credit_issued') return { label: 'Issuance unverified', description: 'This record has no confirmed transaction evidence. Ask the administrator to reconcile it.' };
  return { label: 'Not minted · awaiting approval', description: 'Validator review and final project approval come before minting. Voting does not send a blockchain transaction.' };
}
