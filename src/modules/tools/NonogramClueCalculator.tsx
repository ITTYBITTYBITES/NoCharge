import { useState } from 'react';
import './Phase3BTools.css';

type Calculation = { error?: string; lines: string[]; forced: string; minimum: number; length: number };

function analyze(lengthText: string, clueText: string): Calculation {
  const length = Number(lengthText);
  if (!Number.isInteger(length) || length < 1 || length > 25) return { error: 'Enter a whole-number line length from 1 to 25.', lines: [], forced: '', minimum: 0, length: 0 };
  const trimmed = clueText.trim();
  const runs = trimmed === '' ? [] : trimmed.split(',').map((part) => Number(part.trim()));
  if (runs.some((run) => !Number.isInteger(run) || run < 1)) return { error: 'Use positive whole-number runs separated by commas, such as 2,1. Leave the clue blank for an entirely empty line.', lines: [], forced: '', minimum: 0, length };
  const minimum = runs.reduce((sum, run) => sum + run, 0) + Math.max(0, runs.length - 1);
  if (minimum > length) return { error: `No arrangement: the runs need at least ${minimum} cells, but the line has ${length}.`, lines: [], forced: '', minimum, length };
  if (runs.length === 0) return { lines: ['.'.repeat(length)], forced: '.'.repeat(length), minimum: 0, length };

  const lines: string[] = [];
  const place = (index: number, earliest: number, cells: string[]) => {
    if (index === runs.length) {
      lines.push(cells.join(''));
      return;
    }
    const run = runs[index]!;
    const remainingRuns = runs.slice(index + 1).reduce((sum, value) => sum + value, 0);
    const gapsAfter = runs.length - index - 1;
    const latestStart = length - run - remainingRuns - gapsAfter;
    for (let start = earliest; start <= latestStart; start += 1) {
      const next = cells.slice();
      for (let cell = start; cell < start + run; cell += 1) next[cell] = 'X';
      place(index + 1, start + run + 1, next);
    }
  };
  place(0, 0, Array.from({ length }, () => '.'));
  const forced = Array.from({ length }, (_, index) => {
    const first = lines[0]?.[index];
    return lines.every((line) => line[index] === first) ? first ?? '?' : '?';
  }).join('');
  return { lines, forced, minimum, length };
}

export default function NonogramClueCalculator() {
  const [length, setLength] = useState('10');
  const [clues, setClues] = useState('2,1');
  const [result, setResult] = useState<Calculation>(() => analyze('10', '2,1'));
  const run = () => setResult(analyze(length, clues));

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Enter one line length and its ordered filled-run clues. The calculator enumerates valid placements, compares the complete set for forced cells, and never claims to solve a whole grid.</p>
      <div className="phase3b-tool__fields">
        <label className="phase3b-tool__field">Line length (cells)
          <input aria-label="Line length" type="number" min="1" max="25" step="1" value={length} onChange={(event) => setLength(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') run(); }} />
        </label>
        <label className="phase3b-tool__field">Runs, comma-separated
          <input aria-label="Clue runs" type="text" inputMode="numeric" value={clues} onChange={(event) => setClues(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') run(); }} />
        </label>
      </div>
      <div className="phase3b-tool__actions"><button className="button button--primary" type="button" onClick={run}>Enumerate arrangements</button></div>
      <div className="phase3b-tool__results" aria-live="polite">
        {result.error ? <p className="phase3b-tool__status">{result.error}</p> : <>
          <p className="phase3b-tool__status">{result.lines.length} arrangement{result.lines.length === 1 ? '' : 's'}{result.lines.length > 200 ? ' (showing the first 200)' : ''}. Minimum span: {result.minimum} of {result.length} cells.</p>
          <p className="phase3b-tool__readout"><strong>Forced cells:</strong> <code>{result.forced.split('').join(' ')}</code> <span> · X = filled, . = empty, ? = not fixed across every arrangement.</span></p>
          <div className="phase3b-tool__pills" aria-label="Possible line arrangements">{result.lines.slice(0, 200).map((line, index) => <code key={`${index}-${line}`}>{line}</code>)}</div>
        </>}
      </div>
      <p className="phase3b-tool__note">A blank clue means the line contains no filled runs. A trailing comma, zero, negative value, decimal, or non-number is rejected. Forced-cell deductions use every generated arrangement, not only the displayed prefix.</p>
    </div>
  );
}
