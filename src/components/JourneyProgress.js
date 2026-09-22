import React from 'react';
import { JOURNEY_STEPS, getProjectJourney } from '../utils/projectJourney';
import './Journey.css';

export default function JourneyProgress({ project, compact = false, className = '' }) {
  const journey = getProjectJourney(typeof project === 'string' ? { status: project } : project);
  return <div className={'journey-progress ' + className}>
    {!compact && <p><strong>{journey.label}</strong> · Next: {journey.next}</p>}
    <ol aria-label="Project progress">
      {JOURNEY_STEPS.map((label, i) => <li key={label} className={i < journey.step || journey.step === 3 ? 'done' : i === journey.step ? 'current' : ''} aria-current={i === journey.step ? 'step' : undefined}>
        <span>{i < journey.step || journey.step === 3 ? '✓' : i + 1}</span>{label}
      </li>)}
    </ol>
  </div>;
}
