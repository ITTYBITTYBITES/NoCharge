import { useState } from 'react';

type FormatMode = 'pretty' | 'minified';

function serialize(input: string, mode: FormatMode): string {
  const parsed: unknown = JSON.parse(input);
  return JSON.stringify(parsed, null, mode === 'pretty' ? 2 : 0);
}

export default function JsonWorkbench() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Paste JSON, then choose Format or Minify.');

  const run = (mode: FormatMode) => {
    if (!input.trim()) {
      setOutput('');
      setStatus('Add JSON to the input before formatting.');
      return;
    }
    try {
      setOutput(serialize(input, mode));
      setStatus(mode === 'pretty' ? 'Valid JSON. Formatted with two-space indentation.' : 'Valid JSON. Minified output is ready.');
    } catch (error) {
      setOutput('');
      const detail = error instanceof Error ? error.message : 'The input could not be parsed.';
      setStatus(`Invalid JSON: ${detail}`);
    }
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setStatus('Editor cleared. Paste JSON when you are ready.');
  };

  return (
    <div className="interactive-module json-workbench">
      <label className="module-field">
        <span>JSON input</span>
        <textarea
          aria-label="JSON input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'{\n  "name": "NoCharge",\n  "ready": true\n}'}
          rows={9}
          spellCheck="false"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </label>
      <div className="module-actions json-workbench__actions">
        <button className="button button--primary" type="button" onClick={() => run('pretty')}>Format JSON</button>
        <button className="button button--secondary" type="button" onClick={() => run('minified')}>Minify JSON</button>
        <button className="button button--secondary" type="button" onClick={clear} disabled={!input && !output}>Clear</button>
      </div>
      <p className="module-live-status" role="status" aria-live="polite">{status}</p>
      <div className="json-workbench__output-wrap">
        <h3>Result</h3>
        <pre className="json-workbench__output" aria-label="Formatted JSON output">{output || 'Formatted output will appear here.'}</pre>
      </div>
      <p className="module-note">Parsing and formatting happen in this page. The input is not submitted to a service.</p>
    </div>
  );
}
