import { useState } from 'react';
import './Phase3BTools.css';

export default function StorageInspector() {
  const [keys, setKeys] = useState<string[] | null>(null);
  const [status, setStatus] = useState('Press Scan to enumerate matching key names in this browser profile.');
  const scan = () => {
    try {
      const storage = window.localStorage;
      const found: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith('nocharge:') && key !== 'nocharge:consent') found.push(key);
      }
      found.sort((a, b) => a.localeCompare(b));
      setKeys(found);
      setStatus(`Scan complete: ${found.length} NoCharge key name${found.length === 1 ? '' : 's'} found. Stored values were not read.`);
    } catch {
      setKeys(null);
      setStatus('This browser denied access to local storage. Nothing was changed; check browser site-data permissions if a scan is necessary.');
    }
  };

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">A deliberate scan lists key names beginning with <code>nocharge:</code> on this origin, excluding the exact analytics-consent key. It never calls a value-reading, write, or delete operation.</p>
      <div className="phase3b-tool__actions">
        <button className="button button--primary" type="button" onClick={scan}>Scan this browser</button>
        <button className="button button--secondary" type="button" onClick={() => { setKeys(null); setStatus('Displayed scan results cleared from this page. Browser storage was not changed.'); }} disabled={keys === null}>Clear displayed results</button>
      </div>
      <p className="phase3b-tool__status" role="status" aria-live="polite">{status}</p>
      {keys !== null && <section className="phase3b-tool__results" aria-label="Storage scan results">
        <h3>Matching key names</h3>
        {keys.length === 0
          ? <p className="phase3b-tool__note">No matching key names were found. The scan does not infer that no other browser data exists.</p>
          : <ul>{keys.map((key) => <li className="phase3b-tool__card" key={key}><code>{key}</code><p>Value not accessed. This V2 inspector does not assign a purpose to an unknown key.</p></li>)}</ul>}
      </section>}
      <p className="phase3b-tool__note">The scan cannot see other origins, browser profiles, private sessions, cookies, IndexedDB, or data on another device. Use your browser's site-data controls to remove data; this tool has no delete action.</p>
    </div>
  );
}
