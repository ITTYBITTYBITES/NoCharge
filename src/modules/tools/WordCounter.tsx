import { useMemo, useState } from 'react';
import { getWordCounterMetrics } from './wordCounterCore';

export default function WordCounter() {
  const [text, setText] = useState('');
  const metrics = useMemo(() => getWordCounterMetrics(text), [text]);

  return (
    <div className="interactive-module word-counter">
      <label className="module-field word-counter__input">
        <span>Your text</span>
        <textarea
          aria-label="Text to count"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste or write a few lines…"
          rows={8}
          spellCheck="true"
        />
      </label>
      <div className="word-counter__metrics" aria-label="Text statistics">
        <div><span>Words</span><output aria-label="Word count">{metrics.words}</output></div>
        <div><span>Characters (code points)</span><output aria-label="Character count">{metrics.characters}</output></div>
        <div><span>Characters, no whitespace</span><output aria-label="Character count without spaces">{metrics.charactersNoSpaces}</output></div>
        <div><span>Sentences</span><output aria-label="Sentence count">{metrics.sentences}</output></div>
        <div><span>Reading time</span><output aria-label="Estimated reading time">{metrics.readingMinutes === 0 ? '—' : `${metrics.readingMinutes} min`}</output></div>
      </div>
      <div className="module-actions">
        <button className="button button--secondary" type="button" onClick={() => setText('')} disabled={!text}>Clear text</button>
        <p>Counts update locally as you type. Reading time is a planning estimate at 200 words per minute.</p>
      </div>
      <p className="module-note">This tool does not submit or save your text. Clear the field when your session is done.</p>
    </div>
  );
}
