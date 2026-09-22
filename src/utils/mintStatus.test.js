import { getMintStatus } from './mintStatus';

test('approval alone never implies tokens were minted', () => {
  expect(getMintStatus({ status: 'approved' })).toMatchObject({ ready: true, label: 'Approved · not minted' });
  expect(getMintStatus({ status: 'approved' }).confirmed).toBeUndefined();
});
test('a saved hash is pending until receipt confirmation', () => {
  expect(getMintStatus({ status: 'approved', blockchainTx: '0x123' }).label).toBe('Confirmation pending');
  expect(getMintStatus({ blockchainTx: '0x123', blockchainState: 'confirmed' }).confirmed).toBe(true);
});
test('legacy issuance and reverted transactions do not claim successful minting', () => {
  expect(getMintStatus({ status: 'credit_issued' }).label).toBe('Issuance unverified');
  expect(getMintStatus({ blockchainTx: '0x123', blockchainState: 'reverted' }).confirmed).toBeUndefined();
});
