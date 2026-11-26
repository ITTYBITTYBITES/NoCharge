import { useEffect, useReducer } from 'react';
import { coosJointCafeVignette } from '../../assets/experienceIdentityRegistry';

const INITIAL_BEANS = 6;
const BEANS_PER_CUP = 3;

interface CoffeeShiftState {
  beans: number;
  cupsReady: number;
  cupsServed: number;
  starBeans: number;
  stationLevel: number;
  baristaLevel: number;
  paused: boolean;
  status: string;
}

type CoffeeShiftAction =
  | { type: 'tick' }
  | { type: 'brew' }
  | { type: 'serve' }
  | { type: 'upgrade-station' }
  | { type: 'hire-barista' }
  | { type: 'toggle-pause' }
  | { type: 'reset' };

const INITIAL_STATE: CoffeeShiftState = {
  beans: INITIAL_BEANS,
  cupsReady: 0,
  cupsServed: 0,
  starBeans: 0,
  stationLevel: 1,
  baristaLevel: 0,
  paused: false,
  status: 'Your local café shift is open. Brew a cup, serve a guest, and reinvest the Star Beans.',
};

function stationUpgradeCost(level: number): number {
  return 10 + (level - 1) * 14;
}

function baristaHireCost(level: number): number {
  return 20 + level * 14;
}

function starBeansPerSale(level: number): number {
  return 4 + (level - 1) * 2;
}

function coffeeShiftReducer(state: CoffeeShiftState, action: CoffeeShiftAction): CoffeeShiftState {
  switch (action.type) {
    case 'tick': {
      if (state.paused) return state;
      let cupsReady = state.cupsReady;
      let cupsServed = state.cupsServed;
      let starBeans = state.starBeans;
      for (let guest = 0; guest < state.baristaLevel && cupsReady > 0; guest += 1) {
        cupsReady -= 1;
        cupsServed += 1;
        starBeans += starBeansPerSale(state.stationLevel);
      }
      return {
        ...state,
        beans: state.beans + state.stationLevel,
        cupsReady,
        cupsServed,
        starBeans,
        status: cupsServed > state.cupsServed ? 'A barista served a queued cup; the Star Bean total has been updated.' : state.status,
      };
    }
    case 'brew':
      if (state.paused || state.beans < BEANS_PER_CUP) return state;
      return {
        ...state,
        beans: state.beans - BEANS_PER_CUP,
        cupsReady: state.cupsReady + 1,
        status: 'One fresh cup is ready at the counter.',
      };
    case 'serve':
      if (state.paused || state.cupsReady < 1) return state;
      return {
        ...state,
        cupsReady: state.cupsReady - 1,
        cupsServed: state.cupsServed + 1,
        starBeans: state.starBeans + starBeansPerSale(state.stationLevel),
        status: `Guest served for ${starBeansPerSale(state.stationLevel)} Star Beans. You can keep the shift moving or reinvest.`,
      };
    case 'upgrade-station': {
      const cost = stationUpgradeCost(state.stationLevel);
      if (state.paused || state.starBeans < cost) return state;
      return {
        ...state,
        starBeans: state.starBeans - cost,
        stationLevel: state.stationLevel + 1,
        status: `Espresso station upgraded. It now adds ${state.stationLevel + 1} beans each second and improves sale value.`,
      };
    }
    case 'hire-barista': {
      const cost = baristaHireCost(state.baristaLevel);
      if (state.paused || state.starBeans < cost) return state;
      return {
        ...state,
        starBeans: state.starBeans - cost,
        baristaLevel: state.baristaLevel + 1,
        status: `Barista ${state.baristaLevel + 1} is on shift and will serve queued cups automatically.`,
      };
    }
    case 'toggle-pause':
      return {
        ...state,
        paused: !state.paused,
        status: state.paused ? 'The café shift has resumed.' : 'The café shift is paused; counters and queued cups are held.',
      };
    case 'reset':
      return { ...INITIAL_STATE, status: 'New shift ready. The counter has returned to its starting setup.' };
    default:
      return state;
  }
}

export default function CoffeeIdlePreview() {
  const [state, dispatch] = useReducer(coffeeShiftReducer, INITIAL_STATE);
  const upgradeCost = stationUpgradeCost(state.stationLevel);
  const nextBaristaCost = baristaHireCost(state.baristaLevel);
  const saleValue = starBeansPerSale(state.stationLevel);

  useEffect(() => {
    if (state.paused) return undefined;
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => window.clearInterval(timer);
  }, [state.paused]);

  return (
    <div className="interactive-module product-demo coffee-idle-demo" data-demo="coffee-idle" data-coffee-station-level={state.stationLevel} data-coffee-barista-level={state.baristaLevel} data-coffee-paused={state.paused}>
      <div className="product-demo__heading">
        <div>
          <p className="eyebrow">A local NoCharge café shift</p>
          <h2>Open the counter</h2>
          <p>Brew a cup, serve the next guest, and grow a small café economy. Your shift stays on this page.</p>
        </div>
        <span className="product-demo__badge">Made for this page · sample rules</span>
      </div>

      <figure className="coffee-idle-demo__art" data-asset-id={coosJointCafeVignette.manifestAssetId} data-art-scope="coosjoint" data-render-mode="inline-svg">
        <div className="coffee-idle-demo__artwork" aria-hidden="true" dangerouslySetInnerHTML={{ __html: coosJointCafeVignette.svgMarkup }} />
        <figcaption>Original café-counter illustration created for NoCharge; its colors follow the page theme.</figcaption>
      </figure>

      <div className="module-scoreboard coffee-idle-demo__scoreboard" aria-label="Café shift totals">
        <div><span>Beans</span><output data-coffee-beans>{state.beans}</output></div>
        <div><span>Ready cups</span><output data-coffee-ready>{state.cupsReady}</output></div>
        <div><span>Served</span><output data-coffee-served>{state.cupsServed}</output></div>
        <div><span>Star Beans</span><output data-coffee-stars>{state.starBeans}</output></div>
      </div>

      <div className="coffee-idle-demo__stations" aria-label="Café station and staff progression">
        <section className="product-demo__meter" aria-label={`Espresso station level ${state.stationLevel}`}>
          <span>Espresso station · level {state.stationLevel}</span>
          <strong data-coffee-station-rate>{state.stationLevel} {state.stationLevel === 1 ? 'bean' : 'beans'} per second · {saleValue} per sale</strong>
        </section>
        <section className="product-demo__meter" aria-label={`Barista team level ${state.baristaLevel}`}>
          <span>Barista team · level {state.baristaLevel}</span>
          <strong>{state.baristaLevel === 0 ? 'Manual service' : `${state.baristaLevel} queued ${state.baristaLevel === 1 ? 'cup' : 'cups'} per second`}</strong>
        </section>
      </div>

      <div className="module-actions product-demo__actions coffee-idle-demo__actions">
        <button className="button button--primary" type="button" disabled={state.paused || state.beans < BEANS_PER_CUP} onClick={() => dispatch({ type: 'brew' })}>Brew a cup · 3 beans</button>
        <button className="button button--secondary" type="button" disabled={state.paused || state.cupsReady === 0} onClick={() => dispatch({ type: 'serve' })}>Serve next guest · +{saleValue}</button>
        <button className="button button--secondary" type="button" disabled={state.paused || state.starBeans < upgradeCost} onClick={() => dispatch({ type: 'upgrade-station' })}>Upgrade station · {upgradeCost} Star Beans</button>
        <button className="button button--secondary" type="button" disabled={state.paused || state.starBeans < nextBaristaCost} onClick={() => dispatch({ type: 'hire-barista' })}>Hire barista · {nextBaristaCost} Star Beans</button>
        <button className="button button--secondary" type="button" aria-pressed={state.paused} onClick={() => dispatch({ type: 'toggle-pause' })}>{state.paused ? 'Resume demo' : 'Pause demo'}</button>
        <button className="button button--secondary" type="button" onClick={() => dispatch({ type: 'reset' })}>Reset demo</button>
      </div>
      <p className="module-live-status" role="status" aria-live="polite" data-coffee-status>{state.status}</p>
      <p className="module-note">Sample economy only: no purchases, account, browser storage, app download, or remote game is involved. An outbound destination opens only if you select its link below.</p>
    </div>
  );
}
