import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import './Phase3BTools.css';

type Point = { x: number; y: number };
type Measurement = { left: number; top: number; width: number; height: number };

export default function TouchTargetChecker() {
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [readout, setReadout] = useState('Drag in the drawing area or enter dimensions below.');
  const [manualWidth, setManualWidth] = useState('');
  const [manualHeight, setManualHeight] = useState('');
  const start = useRef<Point | null>(null);
  const localPoint = (event: PointerEvent<HTMLDivElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)), y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)) };
  };
  const apply = (width: number, height: number, left = 10, top = 10) => {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 0 || height < 0 || width > 2000 || height > 2000) {
      setReadout('Enter finite width and height values from 0 to 2,000 CSS pixels.');
      return;
    }
    const w = Math.round(width);
    const h = Math.round(height);
    setMeasurement({ left, top, width: w, height: h });
    const result = w >= 44 && h >= 44
      ? 'Both dimensions reach the 44 CSS-pixel AAA reference.'
      : w >= 24 && h >= 24
        ? 'Both dimensions reach 24 CSS pixels; at least one is below 44.'
        : 'At least one dimension is below 24 CSS pixels.';
    setReadout(`${w} × ${h} CSS px. ${result}`);
  };

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Measure width and height separately in CSS pixels. The visual references are 24 × 24 and 44 × 44; this drawing demo does not measure spacing or inspect another page.</p>
      <div className="phase3b-tool__draw-stage" role="group" aria-label="Drawing area; drag to measure a rectangular target"
        onPointerDown={(event) => { start.current = localPoint(event); event.currentTarget.setPointerCapture(event.pointerId); apply(0, 0, start.current.x, start.current.y); }}
        onPointerMove={(event) => { if (!start.current) return; const point = localPoint(event); apply(Math.abs(point.x - start.current.x), Math.abs(point.y - start.current.y), Math.min(point.x, start.current.x), Math.min(point.y, start.current.y)); }}
        onPointerUp={() => { start.current = null; }}
        onPointerCancel={() => { start.current = null; }}>
        {measurement && <span className="phase3b-tool__draw-rect" style={{ left: measurement.left, top: measurement.top, width: measurement.width, height: measurement.height }} aria-hidden="true" />}
      </div>
      <p className="phase3b-tool__status" role="status" aria-live="polite">{readout}</p>
      <div className="phase3b-tool__fields">
        <label className="phase3b-tool__field">Width in CSS pixels (0–2,000)
          <input aria-label="Manual width in CSS pixels" type="number" min="0" max="2000" step="1" value={manualWidth} onChange={(event) => { setManualWidth(event.target.value); if (event.target.value !== '' && manualHeight !== '') apply(Number(event.target.value), Number(manualHeight)); }} />
        </label>
        <label className="phase3b-tool__field">Height in CSS pixels (0–2,000)
          <input aria-label="Manual height in CSS pixels" type="number" min="0" max="2000" step="1" value={manualHeight} onChange={(event) => { setManualHeight(event.target.value); if (manualWidth !== '' && event.target.value !== '') apply(Number(manualWidth), Number(event.target.value)); }} />
        </label>
      </div>
      <div className="phase3b-tool__range-summary">
        <div><span>Minimum reference</span><strong>24 × 24 px</strong></div>
        <div><span>Larger reference</span><strong>44 × 44 px</strong></div>
      </div>
      <div className="phase3b-tool__actions"><button className="button button--secondary" type="button" onClick={() => { setMeasurement(null); setManualWidth(''); setManualHeight(''); setReadout('Drag in the drawing area or enter dimensions below.'); }}>Clear measurement</button></div>
      <p className="phase3b-tool__note">The displayed values are rounded CSS pixels. Physical size varies with browser zoom and display density; neither area alone nor this demo establishes full WCAG conformance.</p>
    </div>
  );
}
