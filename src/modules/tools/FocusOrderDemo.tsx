import { useState } from 'react';
import './Phase3BTools.css';

const cells = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

export default function FocusOrderDemo() {
  const [status, setStatus] = useState('Tab through the sample controls; Shift+Tab moves in reverse.');
  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">These nine controls are ordinary buttons in row-major document order. Tab follows that order, every button has visible focus, and no script traps the keyboard.</p>
      <div className="phase3b-tool__focus-grid" aria-label="Sample focus sequence">
        {cells.map((cell) => <button className="phase3b-tool__focus-cell" type="button" key={cell} aria-label={`Sample cell ${cell}`} onFocus={() => setStatus(`Focused: ${cell}. Press Tab or Shift+Tab to continue through the document.`)} onClick={() => setStatus(`Activated ${cell}. This teaching button does not change a board or score.`)}>{cell}</button>)}
      </div>
      <p className="phase3b-tool__status" role="status" aria-live="polite">{status}</p>
      <ol>
        <li><strong>Visible focus:</strong> the outline identifies the active control.</li>
        <li><strong>Logical order:</strong> the order in the HTML matches the displayed reading order.</li>
        <li><strong>No trap:</strong> Tab and Shift+Tab can leave the sample after the final or first button.</li>
      </ol>
      <p className="phase3b-tool__note">This example does not inspect another page, certify screen-reader output, measure contrast, or test a dialog's focus handling. A grid using roving focus may use a different but still documented keyboard pattern.</p>
    </div>
  );
}
