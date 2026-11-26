import { useState } from 'react';
import './Phase3BTools.css';

type Variant = 'klondike' | 'freecell' | 'spider';
const rules: { id: Variant; name: string; decks: string; tableau: string; stock: string; foundations: string; planning: string; status: string }[] = [
  { id: 'klondike', name: 'Klondike', decks: 'One 52-card deck', tableau: 'Seven columns; only the top card starts face-up', stock: 'Stock turns one or three cards to the waste, depending on the chosen draw rule', foundations: 'Four suit piles built Ace upward', planning: 'Manage hidden information and decide when to expose a covered card', status: 'A general rules reference, not a playable V2 game' },
  { id: 'freecell', name: 'FreeCell', decks: 'One 52-card deck', tableau: 'Eight columns with every card face-up', stock: 'No stock pile; four temporary free cells are common', foundations: 'Four suit piles built Ace upward', planning: 'Use free cells and empty columns as temporary workspace', status: 'A general rules reference, not a playable V2 game' },
  { id: 'spider', name: 'Spider', decks: 'Two decks, 104 cards total', tableau: 'Ten columns with a mix of covered and exposed cards', stock: 'Common versions deal one stock card to each column', foundations: 'Remove complete King-to-Ace runs, usually within one suit', planning: 'Build descending runs and preserve room to uncover hidden cards', status: 'Common reference rules only; this is not a V2 release promise' },
];

export default function SolitaireComparator() {
  const [focus, setFocus] = useState<'all' | Variant>('all');
  const visible = focus === 'all' ? rules : rules.filter((rule) => rule.id === focus);
  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Compare common rule structures rather than game quality. Select one column to inspect it alone or keep all three visible. Spider is included as a rules reference, not as a playable V2 game.</p>
      <label className="phase3b-tool__field">Focus comparison
        <select aria-label="Solitaire variant focus" value={focus} onChange={(event) => setFocus(event.target.value as 'all' | Variant)}>
          <option value="all">Show all three</option><option value="klondike">Klondike</option><option value="freecell">FreeCell</option><option value="spider">Spider reference</option>
        </select>
      </label>
      <p className="phase3b-tool__status" role="status" aria-live="polite">{focus === 'all' ? 'Showing all three reference columns.' : `Showing the ${focus} rules reference.`}</p>
      <div className="phase3b-tool__table-wrap" tabIndex={0} aria-label="Scrollable solitaire rule comparison">
        <table className="phase3b-tool__table"><thead><tr><th>Rule feature</th>{visible.map((rule) => <th key={rule.id}>{rule.name}</th>)}</tr></thead>
          <tbody>{([
            ['Decks', 'decks'], ['Tableau', 'tableau'], ['Stock and temporary space', 'stock'], ['Goal', 'foundations'], ['Main planning question', 'planning'], ['Scope', 'status'],
          ] as const).map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{visible.map((rule) => <td key={rule.id}>{rule[key]}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <article className="phase3b-tool__card">
        <h3>FreeCell transfer capacity</h3>
        <p>Under the common supermove rule, a sequence may move at most (empty free cells + 1) × 2 to the power of spare empty columns. With one free cell and one spare column, that is (1 + 1) × 2 = four cards. Rule variants differ, so this is a reference calculation rather than a universal implementation promise.</p>
      </article>
      <p className="phase3b-tool__note">This comparison does not inspect a deal, certify solvability, recommend a move, rank difficulty, or read game storage. Each family has published variants; consult the rules for the exact implementation you are playing.</p>
    </div>
  );
}
