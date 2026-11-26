import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { getContentPath } from '../content/sections';
import { getFeaturedEntries } from '../content/registry';
import { searchSite } from '../search';
import { CloseIcon, SearchIcon } from './Icons';

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const results = searchSite(query);
  const suggestions = getFeaturedEntries().slice(0, 4);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuery('');
      dialog.showModal();
      window.requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="search-dialog"
      aria-labelledby="search-title"
      onClose={onClose}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="search-dialog__inner">
        <div className="search-dialog__top">
          <div>
            <p className="eyebrow">Published NoCharge content</p>
            <h2 id="search-title">Search NoCharge</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close search"><CloseIcon /></button>
        </div>
        <label className="search-field">
          <SearchIcon />
          <span className="sr-only">Search games, app experiences, tools, and guides</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search games, tools, guides…"
            autoComplete="off"
            aria-controls="search-dialog-results"
          />
          <kbd>ESC</kbd>
        </label>
        <div id="search-dialog-results" className="search-dialog__results" aria-live="polite">
          {query.trim() ? (
            <>
              <p className="search-dialog__results-label">{results.length} {results.length === 1 ? 'result' : 'results'}</p>
              {results.length > 0 ? (
                <ul className="search-results">
                  {results.map((result) => (
                    <li key={result.id}>
                      <Link to={result.href} onClick={onClose}>{result.title}<span>{result.section} · {result.category}</span></Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="search-empty" role="status">No published content matches “{query.trim()}”. Try a title, category, or tag.</p>}
            </>
          ) : (
            <>
              <p className="search-dialog__results-label">Featured to get you started</p>
              <ul className="search-results">
                {suggestions.map((entry) => (
                  <li key={entry.id}><Link to={getContentPath(entry)} onClick={onClose}>{entry.title}<span>{entry.section} · {entry.category}</span></Link></li>
                ))}
              </ul>
            </>
          )}
        </div>
        <p className="search-dialog__footnote">Search runs in your browser and only indexes published entries.</p>
      </div>
    </dialog>
  );
}
