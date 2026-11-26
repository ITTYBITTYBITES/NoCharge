import { useMemo, useState } from 'react';
import { getToolGameFacts } from './toolCatalogFacts';
import './Phase3BTools.css';

const games = getToolGameFacts();
type Answers = { time: string; players: string; pace: string; input: string; kind: string };
const initial: Answers = { time: 'any', players: 'any', pace: 'any', input: 'any', kind: 'any' };
const kindTerms: Readonly<Record<string, readonly string[]>> = {
  logic: ['Logic', 'Math'], memory: ['Memory'], quick: ['Quick'],
};

export default function GameFinder() {
  const [answers, setAnswers] = useState<Answers>(initial);
  const results = useMemo(() => games.filter((game) => {
    const time = answers.time === 'any' ? Number.POSITIVE_INFINITY : Number(answers.time);
    if (game.sessionMax > time) return false;
    if (answers.players !== 'any' && game.players !== answers.players) return false;
    if (answers.pace !== 'any' && game.pressure !== 'either' && game.pressure !== answers.pace) return false;
    if (answers.input === 'keyboard' && !game.keyboardComplete) return false;
    if (answers.input === 'pointer' && !game.inputs.some((input) => input === 'pointer' || input === 'touch')) return false;
    const terms = kindTerms[answers.kind];
    if (terms && !terms.some((term) => game.genres.some((genre) => genre.toLocaleLowerCase() === term.toLocaleLowerCase()))) return false;
    return true;
  }).sort((a, b) => a.title.localeCompare(b.title)), [answers]);
  const set = (key: keyof Answers, value: string) => setAnswers((previous) => ({ ...previous, [key]: value }));
  const groups: { key: keyof Answers; legend: string; options: [string, string][] }[] = [
    { key: 'time', legend: 'How much time?', options: [['any', 'No limit'], ['5', 'Up to 5 minutes'], ['10', 'Up to 10 minutes'], ['20', 'Up to 20 minutes']] },
    { key: 'players', legend: 'Who is playing?', options: [['any', 'Any'], ['solo', 'Solo'], ['pass-and-play', 'Pass and play']] },
    { key: 'pace', legend: 'Which pace?', options: [['any', 'Any'], ['untimed', 'No countdown'], ['timed', 'Timed']] },
    { key: 'input', legend: 'Preferred input?', options: [['any', 'Any'], ['keyboard', 'Keyboard-complete'], ['pointer', 'Mouse or touch']] },
    { key: 'kind', legend: 'What kind?', options: [['any', 'Anything'], ['logic', 'Logic or numbers'], ['memory', 'Memory'], ['quick', 'Quick round']] },
  ];

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Choose any combination of answers. The tool intersects the selected constraints against the currently published V2 catalog and orders matches by title, not by a recommendation score.</p>
      <div className="phase3b-tool__results">
        {groups.map((group) => (
          <fieldset className="phase3b-tool__card" key={group.key}>
            <legend><strong>{group.legend}</strong></legend>
            <div className="phase3b-tool__actions">
              {group.options.map(([value, label]) => (
                <label className="phase3b-tool__pills" key={value}>
                  <input type="radio" name={`finder-${group.key}`} value={value} checked={answers[group.key] === value} onChange={() => set(group.key, value)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="phase3b-tool__actions"><button className="button button--secondary" type="button" onClick={() => setAnswers(initial)}>Reset answers</button></div>
      <p className="phase3b-tool__status" role="status" aria-live="polite">{results.length ? `${results.length} matching game${results.length === 1 ? '' : 's'} — alphabetical, not a ranking.` : 'No game in the current catalog matches every selected answer. Broaden one choice; no filter was silently skipped.'}</p>
      <div className="phase3b-tool__results">
        {results.map((game) => (
          <article className="phase3b-tool__card" key={game.slug}>
            <h3><a href={`/arcade/${game.slug}/`}>{game.title}</a></h3>
            <p>{game.genres.join(' · ')} · {game.sessionMin === game.sessionMax ? `${game.sessionMax} minute` : `${game.sessionMin}–${game.sessionMax} minute estimate`} · {game.players} · {game.pressure}</p>
            <p>{game.summary}</p>
          </article>
        ))}
      </div>
      <p className="phase3b-tool__note">Keyboard-complete is a picker fact for the entire core loop, not a test of your hardware or assistive technology. The matching metadata sits with this tool and does not alter Arcade entries.</p>
    </div>
  );
}
