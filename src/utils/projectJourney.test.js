import { getProjectJourney } from './projectJourney';
test('submission leads to checks, then review and issue on one page', () => {
  expect(getProjectJourney({status:'submitted'}).action).toBe('check');
  for (const status of ['ai_passed','validator_pending','dao_review','approved']) {
    expect(getProjectJourney({status}).action).toBe('approve');
  }
});
test('only confirmed receipt evidence completes the journey', () => {
  expect(getProjectJourney({status:'approved', price:100, totalTokens:20}).step).toBe(2);
  expect(getProjectJourney({status:'credit_issued'}).step).toBe(2);
  expect(getProjectJourney({blockchainTx:'0x123',blockchainState:'pending'}).step).toBe(2);
  expect(getProjectJourney({blockchainTx:'0x123',blockchainState:'confirmed'}).step).toBe(3);
});
test('revisions and transaction failures provide a distinct recovery step', () => {
  expect(getProjectJourney({status:'validator_rejected'}).action).toBe('edit');
  expect(getProjectJourney({status:'ai_requires_changes'}).owner).toBe('Project owner');
  expect(getProjectJourney({blockchainTx:'0x123',blockchainState:'reverted'}).owner).toBe('Administrator');
});
