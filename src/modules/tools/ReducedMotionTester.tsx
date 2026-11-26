import { useEffect, useState } from 'react';
import './Phase3BTools.css';

type MotionState = 'reduce' | 'no-preference' | 'unsupported';

export default function ReducedMotionTester() {
  const [preference, setPreference] = useState<MotionState>('unsupported');
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setPreference('unsupported');
      return;
    }
    try {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setPreference(query.matches ? 'reduce' : 'no-preference');
      update();
      if (typeof query.addEventListener === 'function') query.addEventListener('change', update);
      else query.addListener(update);
      return () => {
        if (typeof query.removeEventListener === 'function') query.removeEventListener('change', update);
        else query.removeListener(update);
      };
    } catch {
      setPreference('unsupported');
    }
  }, []);
  const message = preference === 'reduce'
    ? 'This browser reports prefers-reduced-motion: reduce.'
    : preference === 'no-preference'
      ? 'This browser does not report a reduced-motion preference.'
      : 'This browser does not expose a readable reduced-motion query.';

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">The tool reads the browser's media query. It cannot change an operating-system setting or decide what motion is suitable for a person.</p>
      <div className="phase3b-tool__readout" role="status" aria-live="polite">{message}</div>
      <div className="phase3b-tool__motion-demo"><span className="phase3b-tool__motion-dot" aria-hidden="true" /><p className="phase3b-tool__intro">This dot pulses when the system allows motion and remains still when the reduce query matches.</p></div>
      <div className="phase3b-tool__card">
        <h3>Interpret the result</h3>
        <p>A non-match is not a safety diagnosis. It may mean no preference was requested or that a browser does not implement this media feature. A match only reports a setting; it does not test another site.</p>
        <p>The demonstration uses CSS to stop its pulse under the matching query. It does not change audio, game rules, stored preferences, or any device setting.</p>
      </div>
    </div>
  );
}
