import { useMemo, useState } from 'react';
import './Phase3BTools.css';

const linear = (length: number) => length + 2 * (length - 1);
const quadratic = (length: number) => Math.round(1.5 * length * length);
const multiplier = (length: number) => 10 * length * length;

export default function WordScoring() {
  const [rawLength, setRawLength] = useState('4');
  const length = Math.max(2, Math.min(10, Math.trunc(Number(rawLength) || 4)));
  const rows = useMemo(() => Array.from({ length: 9 }, (_, index) => {
    const n = index + 2;
    return { n, linear: linear(n), quadratic: quadratic(n), multiplier: multiplier(n) };
  }), []);
  const selected = { linear: linear(length), quadratic: quadratic(length), multiplier: multiplier(length) };
  const maximum = multiplier(10);
  const clamped = Number(rawLength) !== length;

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Compare a linear model and a quadratic model with the separate game’s ten-times-square scoring rule. These are arithmetic demonstrations, not a score submission or a promise about any current V2 game.</p>
      <label className="phase3b-tool__field">Word length (2–10 letters)
        <input aria-label="Word length" type="number" min="2" max="10" step="1" value={rawLength} onChange={(event) => setRawLength(event.target.value)} />
      </label>
      {clamped && <p className="phase3b-tool__note">The displayed calculation clamps or defaults the input to a whole-number length from 2 through 10.</p>}
      <div className="phase3b-tool__range-summary" aria-live="polite">
        <div><span>Linear: n + 2(n − 1)</span><strong>{selected.linear} points</strong><div className="phase3b-tool__meter"><span style={{ width: `${selected.linear / maximum * 100}%` }} /></div></div>
        <div><span>Quadratic: round(1.5n²)</span><strong>{selected.quadratic} points</strong><div className="phase3b-tool__meter"><span style={{ width: `${selected.quadratic / maximum * 100}%` }} /></div></div>
        <div><span>Separate game rule: 10n²</span><strong>{selected.multiplier} points</strong><div className="phase3b-tool__meter"><span style={{ width: `${selected.multiplier / maximum * 100}%` }} /></div></div>
      </div>
      <div className="phase3b-tool__table-wrap" tabIndex={0} aria-label="Scoring formula table for word lengths two through ten">
        <table className="phase3b-tool__table"><thead><tr><th>Letters</th><th>Linear</th><th>Quadratic</th><th>Game rule: 10 × length²</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.n}><th scope="row">{row.n}</th><td>{row.linear}</td><td>{row.quadratic}</td><td>{row.multiplier}</td></tr>)}
        </tbody></table>
      </div>
      <p className="phase3b-tool__note">At length five, the models give 13, 38, and 250 points respectively. The third column is only a clearly labeled comparison formula; the calculator does not check a dictionary, word path, tile set, or game rules.</p>
    </div>
  );
}
