import { useMemo, useState } from 'react';
import { getToolGameFacts } from './toolCatalogFacts';
import './Phase3BTools.css';

const games = getToolGameFacts();
type Filters = { minutes: string; players: string; input: string; pace: string };
const defaults: Filters = { minutes: 'any', players: 'any', input: 'any', pace: 'any' };

export default function DiscoveryWheel() {
  const [filters, setFilters] = useState<Filters>(defaults);
  const [offset, setOffset] = useState(0);
  const matches = useMemo(() => games.filter((game) => {
    const limit = filters.minutes === 'any' ? Number.POSITIVE_INFINITY : Number(filters.minutes);
    if (game.sessionMax > limit) return false;
    if (filters.players !== 'any' && game.players !== filters.players) return false;
    if (filters.input !== 'any' && !game.inputs.includes(filters.input as 'keyboard' | 'pointer' | 'touch')) return false;
    if (filters.pace !== 'any' && game.pressure !== 'either' && game.pressure !== filters.pace) return false;
    return true;
  }), [filters]);
  const shown = matches.length
    ? Array.from({ length: Math.min(3, matches.length) }, (_, index) => matches[(offset + index) % matches.length]!)
    : [];
  const update = (key: keyof Filters, value: string) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setOffset(0);
  };

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Set a few boundaries, then rotate through a short list from the currently published V2 game catalog. Every selected filter is applied; the tool does not rank games.</p>
      <div className="phase3b-tool__fields">
        <label className="phase3b-tool__field">Session limit
          <select aria-label="Session limit" value={filters.minutes} onChange={(event) => update('minutes', event.target.value)}>
            <option value="any">Any listed range</option><option value="5">Up to 5 minutes</option><option value="10">Up to 10 minutes</option><option value="20">Up to 20 minutes</option>
          </select>
        </label>
        <label className="phase3b-tool__field">Players
          <select aria-label="Players" value={filters.players} onChange={(event) => update('players', event.target.value)}>
            <option value="any">Any</option><option value="solo">Solo</option><option value="pass-and-play">Pass and play</option>
          </select>
        </label>
        <label className="phase3b-tool__field">Input
          <select aria-label="Input" value={filters.input} onChange={(event) => update('input', event.target.value)}>
            <option value="any">Any input</option><option value="keyboard">Keyboard</option><option value="pointer">Mouse</option><option value="touch">Touch</option>
          </select>
        </label>
        <label className="phase3b-tool__field">Pace
          <select aria-label="Pace" value={filters.pace} onChange={(event) => update('pace', event.target.value)}>
            <option value="any">Any pace</option><option value="untimed">No countdown</option><option value="timed">Timed</option>
          </select>
        </label>
      </div>
      <div className="phase3b-tool__actions">
        <button className="button button--primary" type="button" onClick={() => setOffset((value) => value + 1)} disabled={matches.length < 2}>Spin the shortlist</button>
        <button className="button button--secondary" type="button" onClick={() => { setFilters(defaults); setOffset(0); }}>Reset filters</button>
      </div>
      <p className="phase3b-tool__status" role="status" aria-live="polite">{matches.length === 0 ? 'No exact match. Broaden one filter; none of your choices were ignored.' : `${matches.length} match${matches.length === 1 ? '' : 'es'} in the current catalog. Showing up to three; spin to rotate the list.`}</p>
      <div className="phase3b-tool__results">
        {shown.map((game) => (
          <article className="phase3b-tool__card" key={game.slug}>
            <h3><a href={`/arcade/${game.slug}/`}>{game.title}</a></h3>
            <p>{game.category} · {game.sessionMin === game.sessionMax ? `${game.sessionMax} min` : `${game.sessionMin}–${game.sessionMax} min estimate`} · {game.players === 'solo' ? 'Solo' : 'Pass and play'} · {game.pressure}</p>
            <p>{game.summary}</p>
          </article>
        ))}
      </div>
      <p className="phase3b-tool__note">Session ranges are tool-owned planning estimates, not guarantees. The currently published V2 game catalog is small, so a filtered result may contain fewer than three choices.</p>
    </div>
  );
}
