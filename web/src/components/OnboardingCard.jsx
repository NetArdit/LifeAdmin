import { useState } from 'react';
import { Icon } from './Icon.jsx';

// Direct port of onboardingHtml() + its seed-demo-btn handler from the
// original dashboard.js. `seeding` replaces the original's manual
// btn.disabled/btn.innerHTML mutation with React state — same visible
// button behavior (disabled + spinner label while the request is in
// flight), expressed the React way instead of imperative DOM writes.
export function OnboardingCard({ onSeedDemo }) {
  const [seeding, setSeeding] = useState(false);

  async function handleClick() {
    setSeeding(true);
    await onSeedDemo();
    setSeeding(false);
  }

  return (
    <div className="onboard-card">
      <Icon name="sparkle" cls="icon-lg" />
      <div style={{ flex: 1 }}>
        <strong>Get started with LifeAdmin</strong>
        <p className="text-sm muted" style={{ marginTop: 2 }}>
          Add a real task or bill, create a family, or load sample data to see everything in action.
        </p>
      </div>
      <button className="btn btn-primary" disabled={seeding} onClick={handleClick}>
        {seeding ? (
          <>
            <span className="spinner" /> Adding sample data…
          </>
        ) : (
          'Load demo data'
        )}
      </button>
    </div>
  );
}
