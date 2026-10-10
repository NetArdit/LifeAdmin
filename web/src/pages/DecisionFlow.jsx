import { DecisionList } from '../components/decisionflow/DecisionList.jsx';
import { DecisionDetail } from '../components/decisionflow/DecisionDetail.jsx';

// React port of public/js/pages/decisionflow.js's mount(). List vs. detail
// is decided by ctx.params[0] (the app's router already threads hash
// segments through as ctx.params — see public/js/app.js's route()), same
// as the original's `const id = ctx.params && ctx.params[0]`. Navigating
// between them goes through location.hash (DecisionRow, "All decisions"
// link, the new-decision modal), which the app router turns into a full
// unmount/remount of this page — not an internal view toggle — so there's
// no extra routing concept to build here beyond reading the one param.
export function DecisionFlow({ ctx }) {
  const id = ctx.params && ctx.params[0];
  if (id) return <DecisionDetail ctx={ctx} id={Number(id)} />;
  return <DecisionList ctx={ctx} />;
}
