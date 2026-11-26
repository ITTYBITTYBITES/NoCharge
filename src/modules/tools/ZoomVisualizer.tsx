import { useMemo, useState } from 'react';
import './Phase3BTools.css';

type Zoom = 100 | 200 | 400;
const devices = [
  { label: 'Small phone', width: 320, height: 568 },
  { label: 'Typical phone', width: 390, height: 844 },
  { label: 'Laptop', width: 1280, height: 720 },
  { label: 'Desktop', width: 1440, height: 900 },
  { label: 'Tall desktop', width: 1280, height: 1024 },
];

export default function ZoomVisualizer() {
  const [width, setWidth] = useState('1280');
  const [height, setHeight] = useState('1024');
  const [zoom, setZoom] = useState<Zoom>(200);
  const dimensions = useMemo(() => {
    const w = Number(width);
    const h = Number(height);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 10000 || h > 10000) return null;
    return { width: Math.round(w * 100 / zoom), height: Math.round(h * 100 / zoom) };
  }, [width, height, zoom]);
  const useDevice = (w: number, h: number) => { setWidth(String(w)); setHeight(String(h)); setZoom(100); };
  const reflow = () => { setWidth('1280'); setHeight('1024'); setZoom(400); };

  return (
    <div className="interactive-module phase3b-tool">
      <p className="phase3b-tool__intro">Estimate the layout viewport by dividing each starting dimension by browser page zoom. This is a test setup, not a browser measurement or a pass/fail audit.</p>
      <div className="phase3b-tool__fields">
        <label className="phase3b-tool__field">Viewport width (1–10,000 CSS px)
          <input type="number" min="1" max="10000" step="1" value={width} aria-label="Viewport width" onChange={(event) => setWidth(event.target.value)} />
        </label>
        <label className="phase3b-tool__field">Viewport height (1–10,000 CSS px)
          <input type="number" min="1" max="10000" step="1" value={height} aria-label="Viewport height" onChange={(event) => setHeight(event.target.value)} />
        </label>
        <label className="phase3b-tool__field">Browser page zoom
          <select aria-label="Browser page zoom" value={zoom} onChange={(event) => setZoom(Number(event.target.value) as Zoom)}><option value="100">100%</option><option value="200">200%</option><option value="400">400%</option></select>
        </label>
      </div>
      <div className="phase3b-tool__readout" role="status" aria-live="polite">
        {dimensions ? `Equivalent viewport: ${dimensions.width} × ${dimensions.height} CSS pixels at ${zoom}% zoom.` : 'Enter whole-number viewport dimensions from 1 to 10,000.'}
      </div>
      <div className="phase3b-tool__meter" aria-hidden="true"><span style={{ width: dimensions ? `${100 / zoom * 100}%` : '0%' }} /></div>
      <p className="phase3b-tool__note" aria-hidden="true">The bar illustrates the width fraction remaining in this simplified zoom model; it does not resize the actual page.</p>
      <div className="phase3b-tool__actions">
        {devices.map((device) => <button className="button button--secondary" type="button" key={device.label} onClick={() => useDevice(device.width, device.height)}>{device.label} {device.width}×{device.height}</button>)}
        <button className="button button--primary" type="button" onClick={reflow}>400% reflow reference</button>
      </div>
      <p className="phase3b-tool__note">For the common reflow reference, 1280 × 1024 at 400% estimates 320 × 256 CSS pixels. Resize or zoom the real page next; this calculator cannot detect clipping, overflow, or missing controls.</p>
    </div>
  );
}
