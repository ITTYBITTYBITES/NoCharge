import { useState } from 'react';
import { getContentPath } from '../../content/sections';
import { getPublishedEntries } from '../../content/registry';
import './Phase3BTools.css';

const pool = getPublishedEntries().map((entry) => ({
  id: entry.id,
  title: entry.title,
  section: entry.section,
  summary: entry.summary,
  href: getContentPath(entry),
}));

export default function RandomActivity() {
  const [picked, setPicked] = useState<(typeof pool)[number] | null>(null);
  const pick = () => {
    if (pool.length === 0) return;
    const index = Math.min(pool.length - 1, Math.floor(Math.random() * pool.length));
    setPicked(pool[index] ?? null);
  };

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Choose a random published NoCharge entry: game, experience, tool, or guide. Every eligible registry item receives one equal interval; the larger sections naturally appear more often.</p>
      <div className="phase3b-tool__actions">
        <button className="button button--primary" type="button" onClick={pick} disabled={pool.length === 0}>Pick an activity</button>
        <button className="button button--secondary" type="button" onClick={() => setPicked(null)} disabled={!picked}>Clear pick</button>
      </div>
      <p className="phase3b-tool__status" role="status" aria-live="polite">{picked ? 'Your random pick is ready. Pick again for a fresh draw.' : pool.length ? 'No selection has been made yet. Press the button when you want a pick.' : 'There are no published entries available to draw.'}</p>
      {picked && <article className="phase3b-tool__card" data-random-result>
        <div className="phase3b-tool__pills"><span>{picked.section}</span></div>
        <h3><a href={picked.href}>{picked.title}</a></h3>
        <p>{picked.summary}</p>
      </article>}
      <p className="phase3b-tool__note">The pick is held only in this page's React state. Reloading clears it; no seed, history, repeat-avoidance queue, mood score, or health recommendation is stored.</p>
    </div>
  );
}
