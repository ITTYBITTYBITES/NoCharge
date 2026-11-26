import { useMemo, useState } from 'react';
import { getToolGameFacts } from './toolCatalogFacts';
import './Phase3BTools.css';

const games = getToolGameFacts();

export default function SessionPlanner() {
  const [minutes, setMinutes] = useState('10');
  const [players, setPlayers] = useState('any');
  const [input, setInput] = useState('any');
  const parsed = Number(minutes);
  const total = Number.isFinite(parsed) && parsed !== 0 ? Math.round(Math.max(1, Math.min(240, parsed))) : 10;
  const matches = useMemo(() => games.filter((game) => {
    if (players !== 'any' && game.players !== players) return false;
    if (input !== 'any' && !game.inputs.includes(input as 'keyboard' | 'pointer' | 'touch')) return false;
    return true;
  }).sort((a, b) => a.sessionMax - b.sessionMax || a.title.localeCompare(b.title)), [players, input]);

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Minutes shape the approximate run count; player and input choices filter the catalog. The time budget does not remove a longer game from the list, so read each session range beside its estimate.</p>
      <div className="phase3b-tool__fields">
        <label className="phase3b-tool__field">Minutes available
          <input aria-label="Minutes available" type="number" min="1" max="240" step="1" value={minutes} onChange={(event) => setMinutes(event.target.value)} />
        </label>
        <label className="phase3b-tool__field">Players
          <select aria-label="Planner players" value={players} onChange={(event) => setPlayers(event.target.value)}><option value="any">Any</option><option value="solo">Solo</option><option value="pass-and-play">Pass and play</option></select>
        </label>
        <label className="phase3b-tool__field">Input
          <select aria-label="Planner input" value={input} onChange={(event) => setInput(event.target.value)}><option value="any">Any</option><option value="keyboard">Keyboard</option><option value="pointer">Mouse</option><option value="touch">Touch</option></select>
        </label>
      </div>
      <p className="phase3b-tool__status" role="status" aria-live="polite">{matches.length ? `${total} min · ${players === 'any' ? 'any players' : players} · ${input === 'any' ? 'any input' : input} — ${matches.length} candidate game${matches.length === 1 ? '' : 's'}.` : 'No game matches both filters. Broaden one choice; nothing was ignored.'}</p>
      <div className="phase3b-tool__results">
        {matches.slice(0, 12).map((game) => {
          const midpoint = Math.max(1, Math.round((game.sessionMin + game.sessionMax) / 2));
          const runs = Math.max(1, Math.floor(total / midpoint));
          return <article className="phase3b-tool__card" key={game.slug}>
            <h3><a href={`/arcade/${game.slug}/`}>{game.title}</a></h3>
            <p>{game.category} · {game.sessionMin === game.sessionMax ? `${game.sessionMax} min` : `${game.sessionMin}–${game.sessionMax} min estimate`} · about {runs} run{runs === 1 ? '' : 's'} in {total} min</p>
            <p>{game.summary}</p>
          </article>;
        })}
      </div>
      <p className="phase3b-tool__note">For each item, the midpoint of its estimated session range is rounded to a whole minute. The budget is divided by that value, rounded down, then floored at one run. No setup time or personal pace is measured.</p>
    </div>
  );
}
