import { useRef, useState } from 'react';
import './Phase3BTools.css';

function boxDimensions(size: number) { return { rows: size === 9 ? 3 : 2, columns: 3 }; }
function candidates(board: number[], size: number, index: number): number[] {
  const row = Math.floor(index / size);
  const column = index % size;
  const { rows: boxRows, columns: boxColumns } = boxDimensions(size);
  const used = new Set<number>();
  for (let offset = 0; offset < size; offset += 1) {
    used.add(board[row * size + offset] ?? 0);
    used.add(board[offset * size + column] ?? 0);
  }
  const boxTop = Math.floor(row / boxRows) * boxRows;
  const boxLeft = Math.floor(column / boxColumns) * boxColumns;
  for (let y = boxTop; y < boxTop + boxRows; y += 1) {
    for (let x = boxLeft; x < boxLeft + boxColumns; x += 1) used.add(board[y * size + x] ?? 0);
  }
  return Array.from({ length: size }, (_, digit) => digit + 1).filter((digit) => !used.has(digit));
}
function hasConflict(board: number[], size: number): boolean {
  for (let index = 0; index < board.length; index += 1) {
    const value = board[index] ?? 0;
    if (!value) continue;
    const row = Math.floor(index / size);
    const column = index % size;
    const { rows: boxRows, columns: boxColumns } = boxDimensions(size);
    for (let other = index + 1; other < board.length; other += 1) {
      if (board[other] !== value) continue;
      const otherRow = Math.floor(other / size);
      const otherColumn = other % size;
      if (row === otherRow || column === otherColumn
        || (Math.floor(row / boxRows) === Math.floor(otherRow / boxRows)
          && Math.floor(column / boxColumns) === Math.floor(otherColumn / boxColumns))) return true;
    }
  }
  return false;
}
function solve(board: number[], size: number): number[] | null {
  const next = board.slice();
  if (hasConflict(next, size)) return null;
  const search = (): boolean => {
    let bestIndex = -1;
    let bestOptions: number[] = [];
    for (let index = 0; index < next.length; index += 1) {
      if (next[index] !== 0) continue;
      const options = candidates(next, size, index);
      if (options.length === 0) return false;
      if (bestIndex === -1 || options.length < bestOptions.length) {
        bestIndex = index;
        bestOptions = options;
      }
    }
    if (bestIndex === -1) return true;
    for (const value of bestOptions) {
      next[bestIndex] = value;
      if (search()) return true;
      next[bestIndex] = 0;
    }
    return false;
  };
  return search() ? next : null;
}

export default function SudokuHelper() {
  const [size, setSize] = useState(9);
  const [board, setBoard] = useState<number[]>(() => Array.from({ length: 81 }, () => 0));
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState('Select a cell to see the candidates allowed by its row, column, and box.');
  const [revealed, setRevealed] = useState(false);
  const cells = useRef<Array<HTMLInputElement | null>>([]);
  const currentValue = board[selected] ?? 0;
  const options = currentValue ? [] : candidates(board, size, selected);
  const conflict = hasConflict(board, size);

  const reset = (nextSize = size) => {
    setSize(nextSize);
    setBoard(Array.from({ length: nextSize * nextSize }, () => 0));
    setSelected(0);
    setRevealed(false);
    setStatus('Grid cleared. Enter only the clues you want the helper to consider.');
  };
  const updateCell = (index: number, raw: string) => {
    if (raw === '' || raw === '0') {
      setBoard((previous) => previous.map((value, cell) => cell === index ? 0 : value));
      setRevealed(false);
      setStatus('Cell cleared.');
      return;
    }
    if (!/^[1-9]$/u.test(raw) || Number(raw) > size) {
      setStatus(`Enter a digit from 1 to ${size}, or press Backspace to clear the cell.`);
      return;
    }
    setBoard((previous) => previous.map((value, cell) => cell === index ? Number(raw) : value));
    setRevealed(false);
    setStatus(`Entered ${raw} in the selected cell.`);
  };
  const moveFocus = (index: number, key: string) => {
    const row = Math.floor(index / size);
    const column = index % size;
    let target = index;
    if (key === 'ArrowRight') target = row * size + (column + 1) % size;
    if (key === 'ArrowLeft') target = row * size + (column + size - 1) % size;
    if (key === 'ArrowDown') target = ((row + 1) % size) * size + column;
    if (key === 'ArrowUp') target = ((row + size - 1) % size) * size + column;
    setSelected(target);
    cells.current[target]?.focus();
  };
  const reveal = () => {
    if (conflict) {
      setStatus('The entered clues repeat a digit in a row, column, or box. Correct the conflict before requesting a solution.');
      return;
    }
    const solution = solve(board, size);
    if (!solution) {
      setStatus('No completion satisfies these clues. Review the entries; the helper has not changed the puzzle.');
      return;
    }
    setBoard(solution);
    setRevealed(true);
    setStatus('One complete solution is shown. This search does not count or prove the number of possible solutions.');
  };

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Enter a 6×6 or 9×9 grid, select an empty cell, and inspect its candidates. The optional Reveal action is an explicit spoiler that searches for one completion consistent with your entries.</p>
      <div className="phase3b-tool__actions">
        <label className="phase3b-tool__field">Grid size
          <select aria-label="Sudoku grid size" value={size} onChange={(event) => reset(Number(event.target.value))}><option value="6">6×6 (2×3 boxes)</option><option value="9">9×9 (3×3 boxes)</option></select>
        </label>
        <button className="button button--secondary" type="button" onClick={() => reset()}>Clear grid</button>
        <button className="button button--secondary" type="button" aria-pressed={revealed} onClick={reveal}>Reveal one solution (spoiler)</button>
      </div>
      <div className="phase3b-tool__board" role="group" aria-label={`${size} by ${size} Sudoku entry grid`} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {board.map((value, index) => {
          const row = Math.floor(index / size);
          const column = index % size;
          const { rows: boxRows, columns: boxColumns } = boxDimensions(size);
          const className = `phase3b-tool__cell${selected === index ? ' phase3b-tool__cell--selected' : ''}${column % boxColumns === 0 ? ' phase3b-tool__cell--box-left' : ''}${row % boxRows === 0 ? ' phase3b-tool__cell--box-top' : ''}`;
          return <input key={`${size}-${index}`} ref={(element) => { cells.current[index] = element; }} className={className} type="text" inputMode="numeric" maxLength={1} autoComplete="off" aria-label={`Row ${row + 1}, column ${column + 1}${value ? `, ${value}` : ', empty'}`} value={value ? String(value) : ''} onFocus={() => setSelected(index)} onChange={(event) => updateCell(index, event.target.value)} onKeyDown={(event) => {
            if (event.key.startsWith('Arrow')) { event.preventDefault(); moveFocus(index, event.key); }
            if (event.key === 'Backspace' || event.key === 'Delete') updateCell(index, '');
          }} />;
        })}
      </div>
      <p className="phase3b-tool__status" role="status" aria-live="polite">{conflict ? 'Conflict detected: at least two entered digits violate the row, column, or box rule.' : currentValue ? `Selected cell already contains ${currentValue}. Clear it to see candidates.` : options.length ? `Candidates for row ${Math.floor(selected / size) + 1}, column ${(selected % size) + 1}: ${options.join(', ')}.` : `No candidates remain for row ${Math.floor(selected / size) + 1}, column ${(selected % size) + 1}.`} {status}</p>
      <div className="phase3b-tool__actions"><button className="button button--secondary" type="button" onClick={() => { setBoard((previous) => previous.map((value, index) => index === selected ? 0 : value)); setRevealed(false); setStatus('Selected cell cleared.'); }}>Clear selected cell</button></div>
      <p className="phase3b-tool__note">6×6 boxes are two rows by three columns; 9×9 boxes are three by three. Arrow keys move between cells and wrap at each edge. Entries stay in the current page and are discarded when you clear, change size, or reload.</p>
    </div>
  );
}
