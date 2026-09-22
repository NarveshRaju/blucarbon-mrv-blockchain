import { JOURNEY_STEPS, getProjectJourney } from '../utils/projectJourney';
export { default } from './JourneyProgress';
export const WORKFLOW_STEPS = JOURNEY_STEPS.map((label, i) => ({ key: String(i), label }));
export const getStepState = (index, project) => {
  const { step } = getProjectJourney(project);
  return step === 3 || index < step ? 'completed' : index === step ? 'current' : 'upcoming';
};
