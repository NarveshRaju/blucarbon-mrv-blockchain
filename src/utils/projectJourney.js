import { normalizeStatus } from './projectStatus';

export const JOURNEY_STEPS = ['Submit', 'Check & review', 'Issue tokens', 'Complete'];
export function getProjectJourney(project = {}) {
  const status = normalizeStatus(project);
  if (project.blockchainState === 'confirmed' && project.blockchainTx) return { step: 3, label: 'Complete', owner: 'Everyone', next: 'View the issued tokens and confirmed transaction.', action: 'result' };
  if (project.blockchainState === 'reverted') return { step: 2, label: 'Transaction failed', owner: 'Administrator', next: 'Review the failed transaction before retrying. Tokens have not been confirmed.', action: 'receipt' };
  if (project.blockchainTx || ['preparing', 'pending'].includes(project.blockchainState)) return { step: 2, label: 'Issuing tokens', owner: 'System', next: 'Wait for confirmation. This page tracks the transaction; do not submit another request.', action: 'receipt' };
  if (['approved', 'dao_review', 'validator_approved'].includes(status)) return { step: 2, label: 'Ready to issue', owner: 'Validator', next: 'Approve and issue demo tokens. The backend handles the transaction.', action: 'approve' };
  if (status === 'credit_issued') return { step: 2, label: 'Receipt needs checking', owner: 'Administrator', next: 'This older record has no confirmed receipt. Ask the administrator to reconcile it.', action: 'receipt' };
  if (['ai_requires_changes', 'validator_rejected', 'dao_rejected'].includes(status)) return { step: 1, label: 'Changes requested', owner: 'Project owner', next: 'Read the findings, update your evidence or details, and resubmit.', action: 'edit' };
  if (['validator_pending', 'under_verification', 'ai_passed'].includes(status)) return { step: 1, label: 'Ready for review', owner: 'Validator', next: 'Review the evidence and checks below, then approve and issue tokens or request changes.', action: 'approve' };
  if (status === 'ai_in_progress') return { step: 1, label: 'Checks running', owner: 'System', next: 'Wait for the automated checks to finish, then review the findings.', action: 'wait' };
  if (status === 'draft') return { step: 0, label: 'Draft', owner: 'Project owner', next: 'Complete the project details and evidence, then submit.', action: 'edit' };
  return { step: 1, label: 'Ready for checks', owner: 'Project owner or validator', next: 'Run the project checks here. A validator will review the findings next.', action: 'check' };
}
