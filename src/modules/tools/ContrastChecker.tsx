import { useMemo, useState } from 'react';
import { calculateContrastRatio, isSixDigitHexColor, meetsContrastThreshold } from './contrastCore';

function ThresholdResult({ ratio, label, required }: { ratio: number; label: string; required: number }) {
  const passes = meetsContrastThreshold(ratio, required);
  return (
    <li className={passes ? 'contrast-checker__pass' : 'contrast-checker__fail'}>
      <span>{label} · {required}:1</span>
      <strong>{passes ? 'Meets threshold' : 'Below threshold'}</strong>
    </li>
  );
}

export default function ContrastChecker() {
  const [foreground, setForeground] = useState('#17324D');
  const [background, setBackground] = useState('#F7F6EF');
  const ratio = useMemo(() => calculateContrastRatio(foreground, background), [foreground, background]);

  const swap = () => {
    setForeground(background);
    setBackground(foreground);
  };

  const foregroundPickerValue = isSixDigitHexColor(foreground) ? foreground : '#000000';
  const backgroundPickerValue = isSixDigitHexColor(background) ? background : '#FFFFFF';
  const invalidInput = ratio === null;

  return (
    <div className="interactive-module contrast-checker">
      <div className="contrast-checker__fields">
        <label className="module-field contrast-checker__field">
          <span>Foreground color</span>
          <span className="contrast-checker__color-control">
            <input
              type="color"
              aria-label="Foreground color picker"
              value={foregroundPickerValue}
              onChange={(event) => setForeground(event.target.value.toUpperCase())}
            />
            <input
              type="text"
              aria-label="Foreground hex"
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={7}
              value={foreground}
              onChange={(event) => setForeground(event.target.value)}
            />
          </span>
        </label>
        <label className="module-field contrast-checker__field">
          <span>Background color</span>
          <span className="contrast-checker__color-control">
            <input
              type="color"
              aria-label="Background color picker"
              value={backgroundPickerValue}
              onChange={(event) => setBackground(event.target.value.toUpperCase())}
            />
            <input
              type="text"
              aria-label="Background hex"
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={7}
              value={background}
              onChange={(event) => setBackground(event.target.value)}
            />
          </span>
        </label>
      </div>
      <div className="contrast-checker__actions">
        <button className="button button--secondary" type="button" onClick={swap}>Swap colors</button>
        <p>Choose a color or enter a hash followed by six hex digits.</p>
      </div>
      {invalidInput ? (
        <p className="module-live-status contrast-checker__status" role="status" aria-live="polite">
          Enter both colors as six-digit hex values, such as #17324D. The ratio is unavailable until both values are valid.
        </p>
      ) : (
        <div className="contrast-checker__result" role="status" aria-live="polite">
          <p className="contrast-checker__ratio">Contrast ratio <strong>{ratio.toFixed(2)}:1</strong></p>
          <ul className="contrast-checker__thresholds" aria-label="WCAG 2.x text contrast thresholds">
            <ThresholdResult ratio={ratio} label="AA normal text" required={4.5} />
            <ThresholdResult ratio={ratio} label="AA large text" required={3} />
            <ThresholdResult ratio={ratio} label="AAA normal text" required={7} />
            <ThresholdResult ratio={ratio} label="AAA large text" required={4.5} />
          </ul>
          <p className="module-note">The result compares these two opaque colors only. It does not audit a page or determine whether text qualifies as large.</p>
        </div>
      )}
    </div>
  );
}
