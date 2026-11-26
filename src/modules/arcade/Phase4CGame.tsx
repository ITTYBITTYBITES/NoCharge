import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';
import {
  allCheckersLegalMoves,
  BEACON_NAMES,
  cardIsRed,
  cardName,
  createInitialPhase4cState,
  getStraightPath,
  morrisNeighbors,
  MORRIS_POINTS,
  phase4cTransition,
  reversiLegalMoves,
} from './phase4c-engines';
import type { Phase4cAction, Phase4cGameId, Phase4cState } from './phase4c-engines';

type PendingBreak = { outcome: 'win' | 'loss' | 'draw'; round: number; breakpoint: 'round-end' | 'game-over' };
const PASS_AND_PLAY_GAMES = new Set<Phase4cGameId>(['checkers', 'dots-and-boxes', 'gomoku', 'nine-mens-morris', 'pass-the-picture', 'reversi']);

function startingTurnMessage(game: Phase4cGameId): string {
  if (game === 'pass-the-picture') return "Artist 1's Turn.";
  if (game === 'checkers') return "Player 1's Turn. Red moves.";
  return "Player 1's Turn.";
}

const TITLES: Record<Phase4cGameId, string> = {
  'beacon-lattice': 'Beacon Lattice', checkers: 'Checkers', 'color-flip': 'Color Flip', 'dots-and-boxes': 'Dots & Boxes',
  freecell: 'FreeCell Solitaire', gomoku: 'Gomoku', klondike: 'Klondike Solitaire', 'memory-match': 'Memory Match',
  minesweeper: 'Minesweeper', 'mini-sudoku': 'Mini Sudoku 6×6', 'nine-mens-morris': "Nine Men's Morris", nonogram: 'Nonogram',
  'pass-the-picture': 'Pass the Picture', reversi: 'Reversi', 'sudoku-9x9': 'Sudoku 9×9', 'tile-garden': 'Tile Garden',
  'word-search': 'Word Search', 'word-tile-rush': 'Word Tile Rush',
};
const CARD_SUITS = ['♠', '♥', '♦', '♣'] as const;
const COLOR_NAMES: Record<string, string> = { coral: 'Coral', teal: 'Teal', gold: 'Gold', violet: 'Violet' };
const COLOR_HEX: Record<string, string> = { coral: '#bd513d', teal: '#18786e', gold: '#ad7413', violet: '#6c4aa2' };
const PICTURE_COLORS = [
  { name: 'Coral', hex: '#c65d46' }, { name: 'Ocean', hex: '#247b86' }, { name: 'Sun', hex: '#b37b17' },
  { name: 'Berry', hex: '#784f91' }, { name: 'Leaf', hex: '#39734e' },
];
const relativeLuminance = (hex: string) => [1, 3, 5]
  .map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
  .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
const contrastRatio = (foreground: string, background: string) => {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter! + 0.05) / (darker! + 0.05);
};
const textColorForFill = (hex: string) => contrastRatio('#111111', hex) >= contrastRatio('#fffefa', hex) ? '#111111' : '#fffefa';

export function Phase4CGame({ game }: { game: Phase4cGameId }) {
  const [model, setModel] = useState<Phase4cState>(() => createInitialPhase4cState(game));
  const [beaconAnchor, setBeaconAnchor] = useState(0);
  const [checkersTarget, setCheckersTarget] = useState(40);
  const [dotsOrientation, setDotsOrientation] = useState<'h' | 'v'>('h');
  const [dotsRow, setDotsRow] = useState(0);
  const [dotsColumn, setDotsColumn] = useState(0);
  const [reversiTarget, setReversiTarget] = useState(19);
  const [gardenTarget, setGardenTarget] = useState(0);
  const [wordSearchTarget, setWordSearchTarget] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState(`${TITLES[game]} is ready. Start when you are ready to play.`);
  const [pendingBreak, setPendingBreak] = useState<PendingBreak | null>(null);
  const [mismatchToken, setMismatchToken] = useState(0);
  const [draftPoints, setDraftPoints] = useState<Array<{ x: number; y: number }> | null>(null);
  const pausedRef = useRef(false);
  const reportedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const drawingPointsRef = useRef<Array<{ x: number; y: number }> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setModel(createInitialPhase4cState(game));
    setBeaconAnchor(0);
    setCheckersTarget(40);
    setDotsOrientation('h');
    setDotsRow(0);
    setDotsColumn(0);
    setReversiTarget(19);
    setGardenTarget(0);
    setWordSearchTarget(0);
    setStarted(false);
    setPaused(false);
    pausedRef.current = false;
    reportedRef.current = false;
    setPendingBreak(null);
    setDraftPoints(null);
    drawingPointsRef.current = null;
    setMessage(`${TITLES[game]} is ready. Start when you are ready to play.`);
  }, [game]);
  const init = useCallback(() => reset(), [reset]);
  const start = useCallback(() => {
    setStarted(true);
    setMessage(PASS_AND_PLAY_GAMES.has(game) ? startingTurnMessage(game) : `${TITLES[game]} started. Use the labeled board and controls to play.`);
  }, [game]);
  const pause = useCallback(() => { pausedRef.current = true; setPaused(true); }, []);
  const resume = useCallback(() => { pausedRef.current = false; setPaused(false); }, []);
  const destroy = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    drawingPointsRef.current = null;
    setDraftPoints(null);
  }, []);
  const runtime = useArcadeGameRuntime({ init, start, pause, resume, destroy });

  const act = useCallback((action: Phase4cAction) => {
    const setupAction = action.type === 'mode' || action.type === 'size';
    if (pausedRef.current || model.complete || (!started && !setupAction)) return;
    const result = phase4cTransition(game, model, action);
    if (result.state !== model) setModel(result.state);
    if (result.message) setMessage(result.message);
    if (action.type === 'flip' && result.state.mismatch) setMismatchToken((token) => token + 1);
    if (result.breakpoint && result.outcome) {
      setPendingBreak({ outcome: result.outcome, round: Number(model.round ?? 1), breakpoint: result.breakpoint });
    }
  }, [game, model, started]);
  const actRef = useRef(act);
  actRef.current = act;

  useEffect(() => {
    if (!pendingBreak || reportedRef.current) return;
    reportedRef.current = true;
    const completed = pendingBreak;
    setPendingBreak(null);
    if (completed.breakpoint === 'round-end') void runtime.onRoundEnd({ outcome: completed.outcome, round: completed.round });
    else void runtime.onGameOver({ outcome: completed.outcome, round: completed.round });
  }, [pendingBreak, runtime]);

  useEffect(() => {
    if (game !== 'memory-match' || !model.mismatch || paused || model.complete) return undefined;
    const timer = window.setTimeout(() => {
      setModel((current) => current.mismatch ? { ...current, revealed: [], mismatch: false } : current);
      setMessage('Mismatched cards are face down again. Choose a new pair.');
    }, 850);
    return () => window.clearTimeout(timer);
  }, [game, mismatchToken, model.mismatch, model.complete, paused]);

  useEffect(() => {
    if (game !== 'word-tile-rush' || !started || !model.startedClock || paused || model.complete) return undefined;
    const timer = window.setInterval(() => {
      const result = phase4cTransition(game, model, { type: 'tick' });
      setModel(result.state);
      if (result.message) setMessage(result.message);
      if (result.breakpoint && result.outcome) setPendingBreak({ outcome: result.outcome, round: 1, breakpoint: result.breakpoint });
    }, 1_000);
    timerRef.current = timer;
    return () => { window.clearInterval(timer); if (timerRef.current === timer) timerRef.current = null; };
  }, [game, model, started, paused]);

  const beginOrRestart = () => {
    if (model.complete || started) reset();
    setStarted(true);
    reportedRef.current = false;
    runtime.begin();
  };
  const locked = paused || model.complete;
  const disabled = locked || !started;
  const simpleButton = (label: string, onClick: () => void, extra: { disabled?: boolean; pressed?: boolean; className?: string; title?: string; setup?: boolean } = {}) => (
    <button className={`button button--secondary ${extra.className ?? ''}`} type="button" aria-pressed={extra.pressed} title={extra.title} disabled={locked || (!started && !extra.setup) || extra.disabled} onClick={onClick}>{label}</button>
  );
  const actionButton = (label: string, action: Phase4cAction, extra: { disabled?: boolean; className?: string; pressed?: boolean; title?: string; setup?: boolean } = {}) => simpleButton(label, () => act(action), extra);
  const gameState = paused ? 'paused' : model.complete ? 'game-over' : started ? 'playing' : 'idle';

  const renderBoard = () => {
    switch (game) {
      case 'beacon-lattice': {
        const board = model.board as number[];
        return <>
          <p className="phase4c-hint">Choose one of five five-cell beacons, rotate it if useful, then place its anchor on an uncovered square.</p>
          <div className="phase4c-scoreline"><strong>Selected shape: {BEACON_NAMES[model.selected]} · rotation {model.rotation * 90}°</strong><span>{model.inventory.length} beacons remain</span></div>
          <div className="phase4c-piece-row" role="group" aria-label="Beacon inventory">
            {model.inventory.map((piece: number) => actionButton(`Beacon ${piece + 1} · ${BEACON_NAMES[piece]} shape`, { type: 'select-piece', piece }, { pressed: model.selected === piece, disabled: disabled || model.complete }))}
            {simpleButton('Rotate beacon', () => act({ type: 'rotate' }), { disabled })}
            {simpleButton('Undo placement', () => act({ type: 'undo' }), { disabled: disabled || model.moves === 0 })}
          </div>
          <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Beacon Lattice anchor coordinates">
            <label>Anchor row<select aria-label="Beacon anchor row" value={Math.floor(beaconAnchor / 5) + 1} disabled={disabled} onChange={(event) => setBeaconAnchor((Number(event.target.value) - 1) * 5 + beaconAnchor % 5)}>{Array.from({ length: 5 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <label>Anchor column<select aria-label="Beacon anchor column" value={beaconAnchor % 5 + 1} disabled={disabled} onChange={(event) => setBeaconAnchor(Math.floor(beaconAnchor / 5) * 5 + Number(event.target.value) - 1)}>{Array.from({ length: 5 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <button className="button button--primary" type="button" disabled={disabled || model.inventory.length === 0} onClick={() => act({ type: 'place', cell: beaconAnchor })}>Place selected beacon at anchor</button>
          </div>
          <div className="phase4c-grid phase4c-grid--5" role="grid" aria-label="Beacon Lattice five by five coverage board">
            {board.map((owner, index) => <button className={`phase4c-cell phase4c-cell--beacon${owner >= 0 ? ` is-beacon-${owner}` : ''}`} key={index} type="button" aria-label={`Row ${Math.floor(index / 5) + 1}, column ${index % 5 + 1}, ${owner < 0 ? 'uncovered' : `covered by beacon ${owner + 1}`}`} disabled={disabled || owner >= 0 || model.inventory.length === 0} onClick={() => act({ type: 'place', cell: index })}>{owner >= 0 ? `B${owner + 1}` : '·'}</button>)}
          </div>
        </>;
      }
      case 'checkers': {
        const legal = allCheckersLegalMoves(model.board, model.turn, model.forced);
        const destinations = new Set(legal.filter((move) => move.from === model.selected).map((move) => move.to));
        const selectable = new Set(legal.map((move) => move.from));
        return <>
          <p className="phase4c-hint">Red men move toward row one; black men move toward row eight. A jump is compulsory when any capture is available.</p>
          <div className="phase4c-scoreline"><span>Red captures: {12 - model.board.filter((piece: string | null) => piece && piece.toLowerCase() === 'b').length}</span><span>Black captures: {12 - model.board.filter((piece: string | null) => piece && piece.toLowerCase() === 'r').length}</span><strong>{model.complete ? 'Game complete' : `Player ${model.turn === 'r' ? '1 · Red' : '2 · Black'} to move`}</strong></div>
          <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Checkers square selection">
            <label>Row<select aria-label="Checkers row" value={Math.floor(checkersTarget / 8) + 1} disabled={disabled} onChange={(event) => setCheckersTarget((Number(event.target.value) - 1) * 8 + checkersTarget % 8)}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <label>Column<select aria-label="Checkers column" value={checkersTarget % 8 + 1} disabled={disabled} onChange={(event) => setCheckersTarget(Math.floor(checkersTarget / 8) * 8 + Number(event.target.value) - 1)}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <button className="button button--primary" type="button" disabled={disabled} onClick={() => act({ type: 'square', index: checkersTarget })}>Use selected square</button>
          </div>
          <div className="phase4c-grid phase4c-grid--8 checkers-board" role="grid" aria-label="English draughts eight by eight board">
            {model.board.map((piece: string | null, index: number) => <button key={index} className={`phase4c-cell phase4c-cell--checkers${(Math.floor(index / 8) + index % 8) % 2 ? ' is-dark-square' : ''}${model.selected === index ? ' is-selected' : ''}${destinations.has(index) ? ' is-legal' : ''}`} type="button" aria-label={`Row ${Math.floor(index / 8) + 1}, column ${index % 8 + 1}, ${piece ? `${piece === piece.toUpperCase() ? 'king' : 'man'} ${piece.toLowerCase() === 'r' ? 'red' : 'black'}` : 'empty'}`} disabled={disabled || (model.forced >= 0 && model.selected >= 0 && model.selected !== index && !destinations.has(index))} onClick={() => act({ type: 'square', index })}>{piece ? <span className={`checkers-piece is-${piece.toLowerCase()}${piece === piece.toUpperCase() ? ' is-king' : ''}`}>{piece === piece.toUpperCase() ? '♛' : '●'}</span> : selectable.has(index) ? '◦' : destinations.has(index) ? '•' : ''}</button>)}
          </div>
        </>;
      }
      case 'color-flip': {
        const currentTarget = model.target[model.turn];
        return <>
          <div className="phase4c-piece-row" role="group" aria-label="Color Flip mode">
            {actionButton('Trail session', { type: 'mode', mode: 'trail' }, { pressed: model.mode === 'trail', setup: true })}
            {actionButton('Color cycle', { type: 'mode', mode: 'cycle' }, { pressed: model.mode === 'cycle', setup: true })}
            <label className="phase4c-check"><input type="checkbox" checked={model.rotating} disabled={locked} onChange={(event) => setModel((current) => ({ ...current, rotating: event.target.checked }))} /> Rotate palette</label>
          </div>
          <div className="phase4c-scoreline"><strong>Target {model.turn + 1} of {model.target.length}</strong><span>Next color: <b>{COLOR_NAMES[currentTarget]}</b></span><span>Matches: {model.score}</span></div>
          <div className="phase4c-palette" role="group" aria-label="Choose active color">
            {model.colors.map((color: string) => <button key={color} className="button button--secondary phase4c-color-button" type="button" aria-pressed={model.activeColor === color} title={`Select ${COLOR_NAMES[color]}`} disabled={disabled} style={{ backgroundColor: COLOR_HEX[color], color: textColorForFill(COLOR_HEX[color]!) }} onClick={() => act({ type: 'color', color })}>{COLOR_NAMES[color]}</button>)}
            {actionButton('Cycle color', { type: 'rotate' })}
            {actionButton('Lock color and continue', { type: 'step' }, { className: 'button--primary' })}
          </div>
          <div className="phase4c-color-board" aria-label="Color Flip target trail">
            {model.target.map((color: string, index: number) => <span className={index === model.turn ? 'is-current' : index < model.turn ? 'is-complete' : ''} key={`${color}-${index}`} style={{ backgroundColor: COLOR_HEX[color], color: color === 'gold' ? '#111' : '#fff' }} aria-label={`Target ${index + 1}: ${COLOR_NAMES[color]}`}>{index < model.turn ? '✓' : index + 1}</span>)}
          </div>
        </>;
      }
      case 'dots-and-boxes': {
        return <>
          <p className="phase4c-hint">Draw one undrawn edge. Closing a box earns a point and another turn; otherwise the next player can draw immediately.</p>
          <div className="phase4c-scoreline"><span>Player 1 boxes: {model.boxes.filter((owner: number) => owner === 1).length}</span><span>Player 2 boxes: {model.boxes.filter((owner: number) => owner === 2).length}</span><strong>Player {model.turn}</strong></div>
          <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Dots and Boxes edge selection">
            <label>Edge orientation<select aria-label="Edge orientation" value={dotsOrientation} disabled={disabled} onChange={(event) => { setDotsOrientation(event.target.value as 'h' | 'v'); setDotsRow(0); setDotsColumn(0); }}><option value="h">Horizontal</option><option value="v">Vertical</option></select></label>
            <label>Edge row<select aria-label="Dots and Boxes row" value={dotsRow + 1} disabled={disabled} onChange={(event) => setDotsRow(Number(event.target.value) - 1)}>{Array.from({ length: dotsOrientation === 'h' ? 5 : 4 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <label>Edge column<select aria-label="Dots and Boxes column" value={dotsColumn + 1} disabled={disabled} onChange={(event) => setDotsColumn(Number(event.target.value) - 1)}>{Array.from({ length: dotsOrientation === 'h' ? 4 : 5 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <button className="button button--primary" type="button" disabled={disabled} onClick={() => act({ type: 'edge', orientation: dotsOrientation, row: dotsRow, column: dotsColumn })}>Draw selected edge</button>
          </div>
          <div className="phase4c-boxes" role="group" aria-label="Dots and Boxes horizontal edges; each line button draws one edge">
            <h3>Horizontal edges</h3><div className="phase4c-edge-grid">
              {model.horizontal.map((drawn: boolean, index: number) => <button key={`h${index}`} className={`phase4c-edge${drawn ? ' is-drawn' : ''}`} type="button" aria-label={`Draw horizontal edge row ${Math.floor(index / 4) + 1}, column ${index % 4 + 1}`} disabled={disabled || drawn} onClick={() => act({ type: 'edge', orientation: 'h', row: Math.floor(index / 4), column: index % 4 })}>{drawn ? '━━━━' : '┄┄┄┄'}</button>)}
            </div>
            <h3>Vertical edges</h3><div className="phase4c-edge-grid">
              {model.vertical.map((drawn: boolean, index: number) => <button key={`v${index}`} className={`phase4c-edge${drawn ? ' is-drawn' : ''}`} type="button" aria-label={`Draw vertical edge row ${Math.floor(index / 5) + 1}, column ${index % 5 + 1}`} disabled={disabled || drawn} onClick={() => act({ type: 'edge', orientation: 'v', row: Math.floor(index / 5), column: index % 5 })}>{drawn ? '┃' : '┆'}</button>)}
            </div>
          </div>
          <div className="phase4c-box-owner-grid" role="grid" aria-label="Claimed boxes">
            {model.boxes.map((owner: number, index: number) => <span key={index} aria-label={`Box ${index + 1}, ${owner ? `Player ${owner}` : 'unclaimed'}`} className={owner ? `is-player-${owner}` : ''}>{owner ? `P${owner}` : '□'}</span>)}
          </div>
        </>;
      }
      case 'freecell': {
        const selected = model.selection;
        return <>
          <p className="phase4c-hint">Build each suit from Ace to King. Tableau runs descend in alternating colors; empty cells and columns increase the movable run capacity.</p>
          <div className="phase4c-pile-row" role="group" aria-label="Free cells and foundations">
            {model.free.map((card: any, index: number) => <button key={`free${index}`} className={`phase4c-pile-slot${selected?.pile === 'free' && selected.index === index ? ' is-selected' : ''}`} type="button" aria-label={`Free cell ${index + 1}, ${card ? cardName(card) : 'empty'}`} disabled={disabled} onClick={() => card ? act({ type: 'select', source: { pile: 'free', index }, label: cardName(card) }) : selected ? act({ type: 'move-free', index }) : undefined}>{card ? cardName(card) : `Free ${index + 1}`}</button>)}
            {CARD_SUITS.map((suit) => <button key={suit} className="phase4c-pile-slot" type="button" aria-label={`${suit} foundation, ${model.foundations[suit]} of 13`} disabled={disabled} onClick={() => act({ type: 'move-foundation', suit })}>{suit} {model.foundations[suit] || 'A'}</button>)}
          </div>
          <div className="phase4c-tableau phase4c-tableau--8" role="group" aria-label="Eight FreeCell tableau columns">
            {model.tableau.map((pile: any[], column: number) => <div className="phase4c-card-column" key={column} aria-label={`Tableau column ${column + 1}`}>
              <strong>Column {column + 1}</strong>
              {pile.map((card, cardIndex) => <button key={`${column}-${cardIndex}`} className={`phase4c-card${cardIsRed(card) ? ' is-red-card' : ''}${selected?.pile === 'tableau' && selected.index === column && selected.cardIndex === cardIndex ? ' is-selected' : ''}`} type="button" aria-label={`Select ${cardName(card)} in column ${column + 1}`} disabled={disabled} onClick={() => act({ type: 'select', source: { pile: 'tableau', index: column, cardIndex }, label: `${cardName(card)} in column ${column + 1}` })}>{cardName(card)}</button>)}
              {simpleButton(`Move here ${column + 1}`, () => act({ type: 'move-tableau', index: column }), { disabled: disabled || !selected, className: 'phase4c-destination' })}
            </div>)}
          </div>
        </>;
      }
      case 'gomoku': {
        return <>
          <p className="phase4c-hint">Place five or more stones in a continuous horizontal, vertical, or diagonal line. The highlighted intersection is the keyboard cursor.</p>
          <div className="phase4c-scoreline"><strong>Player {model.turn} · {model.moves} stones placed</strong><span>Target: 5 in a row</span></div>
          <div className="phase4c-grid phase4c-grid--15 gomoku-board" role="grid" aria-label="Gomoku 15 by 15 board">
            {model.board.map((piece: string | null, index: number) => <button key={index} className={`phase4c-gomoku-cell${model.selected === index ? ' is-selected' : ''}${piece ? ` is-${piece.toLowerCase()}` : ''}`} type="button" aria-label={`Row ${Math.floor(index / 15) + 1}, column ${index % 15 + 1}, ${piece ? `Player ${piece}` : 'empty'}`} disabled={disabled || Boolean(piece)} onClick={() => act({ type: 'place', index })} onFocus={() => act({ type: 'cursor', index })}>{piece ?? (model.selected === index ? '+' : '')}</button>)}
          </div>
          <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Gomoku coordinates">
            <label>Row<select value={Math.floor(model.selected / 15) + 1} onChange={(event) => act({ type: 'cursor', index: (Number(event.target.value) - 1) * 15 + model.selected % 15 })}>{Array.from({ length: 15 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <label>Column<select value={model.selected % 15 + 1} onChange={(event) => act({ type: 'cursor', index: Math.floor(model.selected / 15) * 15 + Number(event.target.value) - 1 })}>{Array.from({ length: 15 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <button className="button button--primary" type="button" disabled={disabled || model.board[model.selected] !== null} onClick={() => act({ type: 'place', index: model.selected })}>Place at selected intersection</button>
          </div>
        </>;
      }
      case 'klondike': {
        return <>
          <p className="phase4c-hint">Move exposed cards to build descending alternating-color tableau runs. Foundations grow upward by suit from Ace through King.</p>
          <div className="phase4c-pile-row" role="group" aria-label="Stock, waste, and foundations">
            <button className="phase4c-pile-slot" type="button" aria-label={`Stock, ${model.stock.length} cards remaining`} disabled={disabled} onClick={() => act({ type: 'draw' })}>{model.stock.length ? `Stock · ${model.stock.length}` : 'Recycle waste'}</button>
            <button className={`phase4c-pile-slot${model.selection?.pile === 'waste' ? ' is-selected' : ''}`} type="button" aria-label={`Waste ${model.waste.length ? cardName(model.waste.at(-1)) : 'empty'}`} disabled={disabled || !model.waste.length} onClick={() => act({ type: 'select-waste' })}>{model.waste.length ? cardName(model.waste.at(-1)) : 'Waste'}</button>
            {CARD_SUITS.map((suit) => <button className="phase4c-pile-slot" key={suit} type="button" aria-label={`${suit} foundation ${model.foundations[suit].length} cards`} disabled={disabled} onClick={() => act({ type: 'move-foundation', suit })}>{suit} {model.foundations[suit].length || 'A'}</button>)}
            <label className="phase4c-select-label">Draw<select aria-label="Draw mode" value={model.drawMode} disabled={disabled} onChange={(event) => act({ type: 'draw-mode', value: Number(event.target.value) })}><option value="1">1 card</option><option value="3">3 cards</option></select></label>
          </div>
          <div className="phase4c-tableau phase4c-tableau--7" role="group" aria-label="Seven Klondike tableau columns">
            {model.tableau.map((pile: any[], column: number) => <div className="phase4c-card-column" key={column} aria-label={`Tableau column ${column + 1}`}>
              <strong>Column {column + 1}</strong>
              {pile.map((card, cardIndex) => <button key={`${column}-${cardIndex}`} className={`phase4c-card${card.faceUp ? cardIsRed(card) ? ' is-red-card' : '' : ' is-face-down'}${model.selection?.pile === 'tableau' && model.selection.index === column && model.selection.cardIndex === cardIndex ? ' is-selected' : ''}`} type="button" aria-label={card.faceUp ? `Select ${cardName(card)}, column ${column + 1}` : `Face-down card, column ${column + 1}`} disabled={disabled} onClick={() => card.faceUp ? act({ type: 'select-tableau', column, cardIndex }) : act({ type: 'flip', column, cardIndex })}>{card.faceUp ? cardName(card) : '▧'}</button>)}
              {simpleButton(`Move here ${column + 1}`, () => act({ type: 'move-tableau', column }), { disabled: disabled || !model.selection, className: 'phase4c-destination' })}
            </div>)}
          </div>
        </>;
      }
      case 'memory-match': {
        return <>
          <p className="phase4c-hint">Reveal two different cards per turn. A pair stays visible; a mismatch turns back after a short viewing pause.</p>
          <div className="phase4c-scoreline"><span>Pairs: {model.matched.filter(Boolean).length / 2} / 8</span><strong>Turns: {model.moves}</strong></div>
          <div className="phase4c-grid phase4c-grid--4" role="grid" aria-label="Memory Match four by four card board">
            {model.deck.map((symbol: string, index: number) => {
              const faceUp = model.matched[index] || model.revealed.includes(index);
              return <button key={index} className={`phase4c-memory-card${faceUp ? ' is-face-up' : ''}${model.matched[index] ? ' is-matched' : ''}`} type="button" aria-label={`Card ${index + 1}, ${model.matched[index] ? 'matched' : faceUp ? symbol : 'covered'}`} aria-pressed={faceUp} disabled={disabled || model.mismatch || model.matched[index]} onClick={() => act({ type: 'flip', index })}>{faceUp ? symbol : '?'}</button>;
            })}
          </div>
        </>;
      }
      case 'minesweeper': {
        return <>
          <p className="phase4c-hint">Reveal safe squares and use adjacent numbers to reason about mine locations. The first square is always safe; flags are optional notes.</p>
          <div className="phase4c-scoreline"><span>Flags: {model.flags} / {model.mines}</span><span>Safe squares: {model.opened} / {model.rows * model.columns - model.mines}</span><span>Mode: {model.flagMode ? 'Flag' : 'Reveal'}</span></div>
          <div className="phase4c-action-row">{simpleButton(model.flagMode ? 'Switch to reveal' : 'Switch to flag', () => setModel((current) => ({ ...current, flagMode: !current.flagMode })), { disabled })}</div>
          <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Minesweeper coordinates">
            <label>Row<select value={Math.floor(model.selected / 9) + 1} disabled={disabled} onChange={(event) => act({ type: 'select', index: (Number(event.target.value) - 1) * 9 + model.selected % 9 })}>{Array.from({ length: 9 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <label>Column<select value={model.selected % 9 + 1} disabled={disabled} onChange={(event) => act({ type: 'select', index: Math.floor(model.selected / 9) * 9 + Number(event.target.value) - 1 })}>{Array.from({ length: 9 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <button className="button button--primary" type="button" disabled={disabled} onClick={() => act({ type: model.flagMode ? 'flag' : 'reveal', index: model.selected })}>{model.flagMode ? 'Flag selected square' : 'Reveal selected square'}</button>
          </div>
          <div className="phase4c-grid phase4c-grid--9 minesweeper-board" role="grid" aria-label="Minesweeper nine by nine board">
            {model.cells.map((cell: any, index: number) => <button key={index} className={`phase4c-mine-cell${model.selected === index ? ' is-selected' : ''}${cell.open ? ' is-open' : ''}${cell.flag ? ' is-flagged' : ''}${cell.mine && cell.open ? ' is-mine' : ''}`} type="button" aria-label={`Row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}, ${cell.flag ? 'flagged' : cell.open ? cell.mine ? 'mine' : cell.count ? `${cell.count} neighboring mines` : 'clear' : 'covered'}`} aria-pressed={model.selected === index} disabled={disabled || cell.open} onContextMenu={(event) => { event.preventDefault(); act({ type: 'flag', index }); }} onClick={() => model.flagMode ? act({ type: 'flag', index }) : act({ type: 'reveal', index })}>{cell.flag ? '⚑' : cell.open ? cell.mine ? '✹' : cell.count || '' : ''}</button>)}
          </div>
        </>;
      }
      case 'mini-sudoku':
      case 'sudoku-9x9': {
        const size = model.size as number;
        const values = Array.from({ length: size }, (_, index) => index + 1);
        const fixed = model.initial as number[];
        return <>
          <p className="phase4c-hint">Select an empty cell, then enter a digit that does not repeat in its row, column, or box. Givens remain locked.</p>
          <div className="phase4c-scoreline"><span>Grid {size} × {size}</span><span>Current cell: {Math.floor(model.selected / size) + 1}, {model.selected % size + 1}</span><span>Checks: {model.mistakes}</span></div>
          {size === 9 && <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Sudoku coordinates">
            <label>Row<select value={Math.floor(model.selected / size) + 1} disabled={disabled} onChange={(event) => act({ type: 'select', index: (Number(event.target.value) - 1) * size + model.selected % size })}>{values.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Column<select value={model.selected % size + 1} disabled={disabled} onChange={(event) => act({ type: 'select', index: Math.floor(model.selected / size) * size + Number(event.target.value) - 1 })}>{values.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>}
          <div className={`phase4c-grid phase4c-grid--${size} sudoku-board`} role="grid" aria-label={`${size} by ${size} Sudoku grid`}>
            {model.board.map((value: number, index: number) => <button key={index} className={`phase4c-sudoku-cell${fixed[index] ? ' is-given' : ''}${model.selected === index ? ' is-selected' : ''}${value && !fixed[index] && value !== model.solution[index] ? ' is-warning' : ''}`} type="button" aria-label={`Row ${Math.floor(index / size) + 1}, column ${index % size + 1}, ${value || 'empty'}${fixed[index] ? ', given' : ''}`} aria-pressed={model.selected === index} onClick={() => act({ type: 'select', index })}>{value || ''}</button>)}
          </div>
          <div className="phase4c-number-pad" role="group" aria-label={`Enter a digit from one to ${size}`}>
            {values.map((value) => actionButton(String(value), { type: 'digit', value }, { disabled: disabled || fixed[model.selected] !== 0, pressed: model.board[model.selected] === value }))}
            {actionButton('Clear cell', { type: 'digit', value: 0 }, { disabled: disabled || fixed[model.selected] !== 0 })}
          </div>
        </>;
      }
      case 'nine-mens-morris': {
        return <>
          <p className="phase4c-hint">Place nine stones, then move along a line. Make a mill of three to remove an opposing stone; with three stones you may fly.</p>
          <div className="phase4c-scoreline"><span>Player 1 reserve: {model.reserve[0]}</span><strong>Player {model.turn} · {model.reserve[model.turn - 1] ? 'place' : model.removeMode ? 'remove' : 'move'}</strong><span>Player 2 reserve: {model.reserve[1]}</span></div>
          <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Morris point selection">
            <label>Point<select value={model.cursor + 1} disabled={disabled} onChange={(event) => act({ type: 'cursor', index: Number(event.target.value) - 1 })}>{MORRIS_POINTS.map(([column, row], index) => <option key={index} value={index + 1}>Point {index + 1} · row {row + 1}, column {column + 1}</option>)}</select></label>
            <button className="button button--primary" type="button" disabled={disabled} onClick={() => act({ type: 'point', index: model.cursor })}>Use selected point {model.cursor + 1}</button>
          </div>
          <div className="phase4c-morris-board" role="group" aria-label="Nine Men's Morris board with 24 connected points">
            <svg aria-hidden="true" viewBox="0 0 600 600" className="phase4c-morris-lines">
              <path d="M0 0H600V600H0Z M100 100H500V500H100Z M200 200H400V400H200Z M300 0V200 M0 300H200 M400 300H600 M300 400V600" />
            </svg>
            {MORRIS_POINTS.map(([column, row], index) => <button key={index} style={{ left: `${column * 100 / 6}%`, top: `${row * 100 / 6}%` } as CSSProperties} className={`phase4c-morris-point${model.selected === index ? ' is-selected' : ''}${model.cursor === index ? ' is-cursor' : ''}${model.board[index] ? ` is-player-${model.board[index]}` : ''}`} type="button" aria-label={`Point ${index + 1}, ${model.board[index] ? `Player ${model.board[index]}` : 'empty'}${morrisNeighbors(index).map((neighbor) => model.board[neighbor] === 0 ? ', connected empty point' : '').join('')}`} aria-pressed={model.cursor === index} disabled={disabled} onClick={() => act({ type: 'point', index })}>{model.board[index] ? model.board[index] === 1 ? '●' : '○' : '·'}</button>)}
          </div>
          {model.removeMode && <p className="phase4c-hint">Mill formed. Select an unprotected opponent stone to remove.</p>}
        </>;
      }
      case 'nonogram': {
        const size = model.size as number;
        return <>
          <p className="phase4c-hint">Use the row and column run clues to fill the picture. Unknown squares may stay blank; only extra filled squares prevent a solve.</p>
          <div className="phase4c-piece-row" role="group" aria-label="Nonogram puzzle size">
            {actionButton('5 by 5', { type: 'size', size: 5 }, { pressed: size === 5, setup: true })}
            {actionButton('10 by 10', { type: 'size', size: 10 }, { pressed: size === 10, setup: true })}
          </div>
          {size === 10 && <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Nonogram cell selection">
            <label>Row<select value={Math.floor(model.selected / size) + 1} disabled={disabled} onChange={(event) => act({ type: 'select', index: (Number(event.target.value) - 1) * size + model.selected % size })}>{Array.from({ length: size }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <label>Column<select value={model.selected % size + 1} disabled={disabled} onChange={(event) => act({ type: 'select', index: Math.floor(model.selected / size) * size + Number(event.target.value) - 1 })}>{Array.from({ length: size }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <button className="button button--primary" type="button" disabled={disabled} onClick={() => act({ type: 'toggle', index: model.selected })}>Mark selected cell</button>
          </div>}
          <div className="phase4c-nonogram-wrap">
            <div className="phase4c-nonogram-clues" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }} aria-label="Column clues">{model.columnClues.map((clue: number[], index: number) => <span key={index} aria-label={`Column ${index + 1}: ${clue.join(', ') || 'no filled cells'}`}>{clue.join(' ') || '·'}</span>)}</div>
            <div className={`phase4c-grid phase4c-grid--${size} nonogram-board`} role="grid" aria-label={`${size} by ${size} Nonogram cells`}>
              {model.marks.map((mark: number, index: number) => <button key={index} className={`phase4c-nonogram-cell mark-${mark}${model.selected === index ? ' is-selected' : ''}`} type="button" aria-label={`Row ${Math.floor(index / size) + 1} clue ${model.rowClues[Math.floor(index / size)].join(', ')}, column ${index % size + 1} clue ${model.columnClues[index % size].join(', ')}, ${mark === 1 ? 'filled' : mark === 2 ? 'marked empty' : 'unknown'}`} aria-pressed={model.selected === index} disabled={disabled} onClick={() => act({ type: 'toggle', index })}>{mark === 1 ? '■' : mark === 2 ? '×' : ''}</button>)}
            </div>
            <div className="phase4c-nonogram-row-clues" aria-label="Row clues">{model.rowClues.map((clue: number[], index: number) => <span key={index}>R{index + 1}: {clue.join(' ') || '·'}</span>)}</div>
          </div>
        </>;
      }
      case 'pass-the-picture': {
        const addPoint = (event: PointerEvent<SVGSVGElement>) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const point = { x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)), y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)) };
          const points = drawingPointsRef.current ? [...drawingPointsRef.current, point] : [point];
          drawingPointsRef.current = points;
          setDraftPoints(points);
        };
        const endStroke = (event?: PointerEvent<SVGSVGElement>) => {
          if (event?.type === 'pointerup') addPoint(event);
          const points = drawingPointsRef.current;
          if (points && points.length) act({ type: 'stroke', points });
          drawingPointsRef.current = null;
          setDraftPoints(null);
        };
        return <>
          <p className="phase4c-hint">Artists take turns adding one line or shape to a shared picture. A tap-friendly stamp row works when freehand drawing is inconvenient.</p>
          <div className="phase4c-scoreline"><span>Passes: {model.passes} / {model.maxPasses}</span><span>Stroke color: {PICTURE_COLORS.find((color) => color.hex === model.color)?.name ?? 'Custom'}</span><strong>{model.complete ? 'Drawing complete' : `Artist ${model.passes + 1}'s turn`}</strong></div>
          <div className="phase4c-piece-row" role="group" aria-label="Choose drawing color">{PICTURE_COLORS.map((color) => <button key={color.name} className="button button--secondary" type="button" aria-pressed={model.color === color.hex} disabled={disabled} style={{ backgroundColor: color.hex, color: textColorForFill(color.hex) }} onClick={() => act({ type: 'color', color: color.hex, name: color.name })}>{color.name}</button>)}</div>
          <svg className="phase4c-drawing-surface" viewBox="0 0 100 100" role="img" aria-label="Shared drawing surface. Draw with touch, pen, or mouse, or add a line with the keyboard button." onPointerDown={(event) => { if (disabled) return; event.currentTarget.setPointerCapture(event.pointerId); addPoint(event); }} onPointerMove={(event) => { if (event.buttons && !disabled) addPoint(event); }} onPointerUp={endStroke} onPointerCancel={endStroke}>
            <rect width="100" height="100" fill="var(--surface-inset)" />
            {model.strokes.map((stroke: any, index: number) => <polyline key={index} points={stroke.points.map((point: any) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />)}
            {draftPoints && <polyline points={draftPoints.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={model.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
          <div className="phase4c-action-row">
            <button className="button button--secondary" type="button" disabled={disabled} onClick={() => act({ type: 'stroke', points: [{ x: 15, y: 72 }, { x: 38, y: 35 }, { x: 60, y: 66 }, { x: 84, y: 25 }] })}>Add a sample line</button>
            {simpleButton('Undo last stroke', () => act({ type: 'undo' }), { disabled: disabled || model.strokes.length === 0 })}
            {simpleButton('Finish drawing', () => act({ type: 'finish' }), { disabled })}
            <a className="button button--secondary" download="nocharge-shared-drawing.svg" href={`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${model.strokes.map((stroke: any) => `<polyline points="${stroke.points.map((point: any) => `${point.x},${point.y}`).join(' ')}" fill="none" stroke="${stroke.color}" stroke-width="2.4" stroke-linecap="round"/>`).join('')}</svg>`)}`}>Download SVG</a>
          </div>
        </>;
      }
      case 'reversi': {
        const legal = new Set(reversiLegalMoves(model.board, model.turn));
        return <>
          <p className="phase4c-hint">Place a disc to bracket one or more opponent lines. Every bracketed line flips; the game ends when neither player can move.</p>
          <div className="phase4c-scoreline"><span>Player 1 discs: {model.board.filter((cell: number) => cell === 1).length}</span><strong>Player {model.turn} · {legal.size} legal moves</strong><span>Player 2 discs: {model.board.filter((cell: number) => cell === 2).length}</span></div>
          <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Reversi square selection">
            <label>Row<select aria-label="Reversi row" value={Math.floor(reversiTarget / 8) + 1} disabled={disabled} onChange={(event) => setReversiTarget((Number(event.target.value) - 1) * 8 + reversiTarget % 8)}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <label>Column<select aria-label="Reversi column" value={reversiTarget % 8 + 1} disabled={disabled} onChange={(event) => setReversiTarget(Math.floor(reversiTarget / 8) * 8 + Number(event.target.value) - 1)}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <button className="button button--primary" type="button" disabled={disabled} onClick={() => act({ type: 'cell', index: reversiTarget })}>Place at selected square</button>
          </div>
          <div className="phase4c-grid phase4c-grid--8 reversi-board" role="grid" aria-label="Reversi eight by eight board">
            {model.board.map((disc: number, index: number) => <button key={index} className={`phase4c-cell phase4c-cell--reversi${legal.has(index) ? ' is-legal' : ''}`} type="button" aria-label={`Row ${Math.floor(index / 8) + 1}, column ${index % 8 + 1}, ${disc ? `Player ${disc} disc` : legal.has(index) ? 'legal move' : 'empty'}`} disabled={disabled || (disc !== 0 || !legal.has(index))} onClick={() => act({ type: 'cell', index })}>{disc ? disc === 1 ? '●' : '○' : legal.has(index) ? '·' : ''}</button>)}
          </div>
        </>;
      }
      case 'tile-garden': {
        return <>
          <p className="phase4c-hint">Plant the shown seed in an empty bed. A matching two-by-two group merges upward; grow a tier-five Flower in the center.</p>
          <div className="phase4c-scoreline"><span>Moves: {model.moves}</span><strong>Next seed: tier {model.nextSeed}</strong><span>Mode: Center Flower</span></div>
          <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Tile Garden bed selection">
            <label>Row<select aria-label="Garden row" value={Math.floor(gardenTarget / 8) + 1} disabled={disabled} onChange={(event) => setGardenTarget((Number(event.target.value) - 1) * 8 + gardenTarget % 8)}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <label>Column<select aria-label="Garden column" value={gardenTarget % 8 + 1} disabled={disabled} onChange={(event) => setGardenTarget(Math.floor(gardenTarget / 8) * 8 + Number(event.target.value) - 1)}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <button className="button button--primary" type="button" disabled={disabled || model.board[gardenTarget] !== 0} onClick={() => act({ type: 'plant', index: gardenTarget })}>Plant at selected bed</button>
          </div>
          <div className="phase4c-grid phase4c-grid--8 tile-garden-board" role="grid" aria-label="Tile Garden eight by eight planting beds">
            {model.board.map((tile: number, index: number) => <button key={index} className={`phase4c-cell phase4c-garden-cell tier-${Math.min(tile, 5)}`} type="button" aria-label={`Row ${Math.floor(index / 8) + 1}, column ${index % 8 + 1}, ${tile ? `tier ${tile}` : 'empty bed'}`} disabled={disabled || tile !== 0} onClick={() => act({ type: 'plant', index })}>{tile ? tile >= 5 ? '✿' : tile : '+'}</button>)}
          </div>
        </>;
      }
      case 'word-search': {
        const selected = model.selection as number[];
        const selectedPath = selected.length === 2 ? getStraightPath(selected[0]!, selected[1]!, 8) : selected;
        const foundPaths = (model.placements as number[][]).filter((_, index) => model.found.includes(model.words[index])).flat();
        return <>
          <p className="phase4c-hint">Choose the first and last letter of a straight word. Lines may run horizontally, vertically, or diagonally in either direction.</p>
          <div className="phase4c-scoreline"><span>Found: {model.found.length} / {model.words.length}</span><span>Tap two endpoints to select one word.</span></div>
          <div className="phase4c-word-list" role="list" aria-label="Words to find">{model.words.map((word: string) => <span role="listitem" className={model.found.includes(word) ? 'is-found' : ''} key={word}>{model.found.includes(word) ? '✓ ' : ''}{word}</span>)}</div>
          <div className="phase4c-coordinate-controls" role="group" aria-label="Touch-friendly Word Search endpoint selection">
            <label>Row<select aria-label="Word Search row" value={Math.floor(wordSearchTarget / 8) + 1} disabled={disabled} onChange={(event) => setWordSearchTarget((Number(event.target.value) - 1) * 8 + wordSearchTarget % 8)}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <label>Column<select aria-label="Word Search column" value={wordSearchTarget % 8 + 1} disabled={disabled} onChange={(event) => setWordSearchTarget(Math.floor(wordSearchTarget / 8) * 8 + Number(event.target.value) - 1)}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <button className="button button--primary" type="button" disabled={disabled} onClick={() => act({ type: 'cell', index: wordSearchTarget })}>Select endpoint</button>
          </div>
          <div className="phase4c-grid phase4c-grid--8 word-search-board" role="grid" aria-label="Word Search eight by eight letter board">
            {model.grid.map((letter: string, index: number) => <button key={index} className={`phase4c-cell phase4c-word-cell${selectedPath.includes(index) ? ' is-selected' : ''}${foundPaths.includes(index) ? ' is-found' : ''}`} type="button" aria-label={`Row ${Math.floor(index / 8) + 1}, column ${index % 8 + 1}, letter ${letter}${selectedPath.includes(index) ? ', selected' : ''}`} disabled={disabled} onClick={() => act({ type: 'cell', index })}>{letter}</button>)}
          </div>
        </>;
      }
      case 'word-tile-rush': {
        return <>
          <p className="phase4c-hint">Trace neighboring letters without reusing a tile. Submit a listed word to score; every accepted word pushes the grid upward.</p>
          <div className="phase4c-scoreline"><span>Score: {model.score}</span><strong>Time: {model.seconds}s</strong><span>Path: {model.path.map((index: number) => model.grid[index]).join('') || 'none'}</span></div>
          <div className="phase4c-grid phase4c-grid--6x8 rush-board" role="grid" aria-label="Word Tile Rush six by eight rising letter grid">
            {model.grid.map((letter: string, index: number) => <button key={index} className={`phase4c-cell phase4c-rush-cell${model.path.includes(index) ? ' is-selected' : ''}${!letter ? ' is-empty' : ''}`} type="button" aria-label={`Row ${Math.floor(index / 6) + 1}, column ${index % 6 + 1}, ${letter || 'empty'}${model.path.includes(index) ? ', in current path' : ''}`} disabled={disabled || !letter} onClick={() => act({ type: 'tile', index })}>{letter || '·'}</button>)}
          </div>
          <div className="phase4c-action-row">{actionButton('Submit word', { type: 'submit-word' }, { className: 'button--primary', disabled: model.path.length < 3 })}{actionButton('Clear path', { type: 'clear-path' }, { disabled: !model.path.length })}</div>
          <p className="phase4c-hint">The local word set includes: STAR, RAIN, TRAIN, MOON, NOTE, CLOUD, GARDEN, PLANT, FLOWER, EARTH, WATER, LEARN, GAME, WORD, TILE, RIVER, and LIGHT.</p>
        </>;
      }
    }
  };

  return (
    <div className={`interactive-module game-module phase4c-game phase4c-${game}${PASS_AND_PLAY_GAMES.has(game) ? ' arcade-pass-and-play' : ''}`} data-game-id={game} data-game-state={gameState}>
      <div className="module-scoreboard" aria-label={`${TITLES[game]} status`}>
        <div><span>Game</span><output>{TITLES[game]}</output></div>
        <div><span>State</span><output>{paused ? 'Paused' : model.complete ? 'Complete' : started ? 'Playing' : 'Ready'}</output></div>
        <div><span>Progress</span><output>{model.moves ?? model.score ?? model.passes ?? 0}</output></div>
      </div>
      <p className="module-live-status" role="status" aria-live="polite">{paused ? 'Paused. Your current board is preserved.' : message}</p>
      <div className="phase4c-game-controls">
        <button className="button button--primary" type="button" onClick={beginOrRestart} disabled={paused || started && !model.complete}>{started && !model.complete ? 'Game started' : model.complete ? 'Play again' : 'Start game'}</button>
        <button className="button button--secondary" type="button" onClick={reset} disabled={paused}>Reset to seeded start</button>
      </div>
      <div className="phase4c-game-surface" aria-label={`${TITLES[game]} game controls`}>
        {renderBoard()}
      </div>
      <p className="phase4c-runtime-note">This game runs locally in your browser. A completed puzzle or terminal result is the only natural H5 boundary; the adapter remains inactive.</p>
    </div>
  );
}
