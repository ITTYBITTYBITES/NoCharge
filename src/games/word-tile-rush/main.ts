import { play, unlockAudio } from '../shared/audio';
import { loadScore, saveScore } from '../shared/storage';
import './styles.css';

const GAME_ID = 'word-tile-rush';
const COLS = 6;
const ROWS = 8;

/** Compact common-word list (3–6 letters) for offline play. */
const WORDS = new Set(
  `
  ace act add age ago aid aim air ale all and ant any ape arc are ark arm art ash ask ate
  bad bag ban bar bat bay bed bee beg bet big bin bit boa bog boo bow box boy bud bug bun bus but buy
  cab can cap car cat cop cow cry cub cup cut
  dad dam day den dew did dig dim dip dog dot dry dub dud due dug duo dye
  ear eat eel egg ego elf elk elm end era eve ewe eye
  fad fan far fat fax fed few fig fin fir fit fix flu fly foe fog for fox fro fry fun fur
  gab gag gap gas gay gel gem get gig gin gnu god got gum gun gut guy gym
  had ham has hat hay hem hen her hew hex hey hid him hip his hit hob hop hot how hub hue hug hum hut
  ice icy ill ink inn ion its ivy
  jab jam jar jaw jay jet jig job jog jot joy jug jut
  keg ken key kid kin kit
  lab lad lag lap law lax lay led leg let lid lie lip lit log lot low lye
  mad man map mat maw may men met mid mix mob mop mow mud mug
  nab nag nap net new nib nil nip nit nod nor not now nun nut
  oaf oak oar oat odd ode off oft ohm oil old one orb ore our out ova owe owl own
  pad pal pan pap par pat paw pay pea peg pen pep per pet pew pie pig pin pit ply pod pop pot pro pry pub pun pup put
  rag ram ran rap rat raw ray red rib rid rig rim rip rob rod roe rot row rub rug rum run rut rye
  sac sad sag sap sat saw sax say sea set sew she shy sin sip sir sis sit six ski sky sly sob sod son sop sow soy spa spy sty sub sum sun sup
  tab tad tag tan tap tar tat tax tea ten the thy tic tie tin tip toe ton too top tot tow toy try tub tug two
  ugh uke ups urn use
  van vat vet vex via vie vow
  wad wag war was wax way web wed wee wet who why wig win wit woe wok won woo wow wry
  yak yam yap yaw yes yet yew you
  zap zig zip zoo
  able acid also area army away baby back ball band bank base bath bear beat been beer bell belt bend best bike bill bird bite blow blue boat body bomb bond bone book boom boot born boss both bowl bulk burn bush busy call calm came camp card care cart case cash cast cave cell chat chip city club coal coat code cold come cook cool cope copy core corn cost crew crop dark data date dawn days dead deal dear debt deep deny desk dial diet dirt disc dish disk does done door dose down draw drew drop drug dual duck duel dust duty each earn ease east edge else even ever evil exit face fact fail fair fall farm fast fate fear feed feel feet fell felt file fill film find fine fire firm fish five flat flow foam fold food foot ford fork form fort four free from fuel full fund gain game gate gave gear gene gift girl give glad glow goal goat goes gold golf gone good grab gray grew grey grow gulf hair half hall hand hang hard harm hate have head hear heat held hell help here hero high hill hire hold hole holy home hope host hour huge hung hunt hurt idea inch into iron item jack jane jean jobs join joke jump jury just keen keep kept kick kill kind king knee knew know lack lady laid lake land lane last late lead left less lie life lift like line link list live load loan lock long look loop lord lose loss lost love luck made maid mail main make male mall many mark mars mass meal mean meat meet menu mere mess mile milk mind mine miss mode mood moon more most move much must name navy near neck need news next nice night nine none nose note okay once only onto open oral over pace pack page paid pain pair pale palm park part pass past path peak pick pile pine pink pipe plan play plot plus poem poet pole poll pool poor port pose post pour pray pull pure push race rail rain rank rare rate read real rear rely rent rest rice rich ride ring rise risk road rock role roll roof room root rose rule rush safe said sail sale salt same sand save seat seed seek seem seen self sell send sent ship shop shot show shut sick side sign silk sing sink site size skin slip slow snap snow soft soil sold some song soon sort soul spot star stay step stop such suit sure take tale talk tall tank tape task team tear tell tend term test text than that them then they thin this thus tide tied till time tiny told toll tone took tool tops tour town tree trip true tube turn twin type unit upon used user vary vast very vice view vote wage wait walk wall want ward warm warn wash wave ways weak wear week well went were west what when whom wide wife wild will wind wine wing wire wise wish with wood word wore work yard yeah year your zero zone
  about above abuse actor acute admit adopt adult after again agent agree ahead alarm album alert alike alive allow alone along alter anger angle angry apart apple apply arena argue arise aside asset audio avoid award aware badly baker bases basic basis beach began begin being below benches bible birth black blame blind block blood board boost booth bound brain brand bread break breed brief bring broad broke brown build built buyer cable calms camps cards carry catch cause chain chair chart chase cheap check chest chief child china chose civil claim class clean clear click clock close cloud coach coast could count court cover craft crash crazy cream crime cross crowd crown daily dance dated dealt death debut delay depth doing doubt dozen draft drama drawn dream dress drill drink drive drove dying eager early earth eight elite empty enemy enjoy enter entry equal error event every exact exist extra faith false fault fiber field fifth fifty fight final first fixed flash fleet floor fluid focus force found frame frank fraud fresh front fruit fully funny giant given glass globe going grace grade grand grant grass great green gross group grown guard guess guest guide happy harry heart heavy hence hill history horse hotel house human ideal image imply index inner input issue jeans joint judge juice knife knock known label large laser later laugh layer learn lease least leave legal level light limit lines links lives local logic loose lower lucky lunch lying magic major maker march match maybe mayor media metal might minor minus mixed model money month moral motor mount mouse mouth movie music needs never newly night noise north noted novel nurse occur ocean offer often order other ought outer owner panel paper party peace peter phase phone photo piano piece pilot pitch place plain plane plant plate point porch pound power press price pride prime print prior prize proof proud prove queen quick quiet quite radio raise range rapid ratio reach ready refer right rival river robert rough round route royal rural scale scene scope score sense serve seven shall shape share sharp sheet shelf shell shift shine shirt shock shoot short shown sides sight since sixth sixty skill slave sleep slide small smart smile smith smoke solid solve sorry sound south space spare speak speed spend spent split spoke sport staff stage stake stand start state steam steel steep stick still stock stone stood store storm story strip stuck study stuff style sugar suite super sweet table taken taste taxes teach teeth thank theme there these thick thing think third those three threw throw tight times tired title today token tooth topic total touch tough tower track trade train treat trend trial tried tries truck truly trust truth twice under undid union unity until upper upset urban usage usual value video virus visit vital voice waste watch water wheel where which while white whole whose woman women world worry worse worst worth would write wrong wrote young youth
  apple bread chair cloud dance earth flame grape house juice knife lemon money night ocean piano queen river stone table under voice water zebra
  `.match(/[a-z]+/g) ?? [],
);

const LETTER_POOL = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOONNNNNNRRRRRRTTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ';

type Cell = { letter: string | null; selected: boolean };

export function mountWordTileRush(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="wtr">
      <div class="wtr__hud">
        <div class="wtr__stats">
          <span>Score <strong data-wtr="score">0</strong></span>
          <span>Best <strong data-wtr="best">0</strong></span>
        </div>
        <div class="wtr__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-wtr="clear">Clear</button>
          <button type="button" class="btn btn--ghost btn--sm" data-wtr="restart">New</button>
        </div>
      </div>
      <div class="wtr__word" data-wtr="word" aria-live="polite"></div>
      <p class="wtr__hint">Drag across adjacent tiles to spell a word (3+ letters).</p>
      <div class="wtr__board-wrap">
        <div class="wtr__board" data-wtr="board" role="grid" aria-label="Letter grid"></div>
      </div>
      <div class="wtr__overlay" data-wtr="overlay" role="status">
        <h2>Grid full</h2>
        <p data-wtr="result"></p>
        <button type="button" class="btn" data-wtr="again">Play again</button>
      </div>
    </div>
  `;

  const boardEl = root.querySelector<HTMLElement>('[data-wtr="board"]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-wtr="score"]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-wtr="best"]')!;
  const wordEl = root.querySelector<HTMLElement>('[data-wtr="word"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-wtr="overlay"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-wtr="result"]')!;
  const clearBtn = root.querySelector<HTMLButtonElement>('[data-wtr="clear"]')!;
  const restartBtn = root.querySelector<HTMLButtonElement>('[data-wtr="restart"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-wtr="again"]')!;

  let grid: Cell[][] = [];
  let path: { r: number; c: number }[] = [];
  let dragging = false;
  let score = 0;
  let best = loadScore(GAME_ID);
  let dropTimer = 0;
  let alive = true;
  const cellEls: HTMLElement[][] = [];

  bestEl.textContent = String(best);

  function idx(r: number, c: number) {
    return r * COLS + c;
  }

  function randomLetter() {
    return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)]!;
  }

  function setScore(n: number) {
    score = n;
    scoreEl.textContent = String(score);
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-pop');
  }

  function renderCells() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r]![c]!;
        const el = cellEls[r]![c]!;
        el.textContent = cell.letter ?? '';
        el.classList.toggle('is-empty', !cell.letter);
        el.classList.toggle('is-selected', cell.selected);
        el.classList.remove('is-invalid');
      }
    }
    wordEl.textContent = path.map((p) => grid[p.r]![p.c]!.letter).join('');
  }

  function buildDom() {
    boardEl.innerHTML = '';
    cellEls.length = 0;
    for (let r = 0; r < ROWS; r++) {
      const row: HTMLElement[] = [];
      for (let c = 0; c < COLS; c++) {
        const el = document.createElement('div');
        el.className = 'wtr__cell is-empty';
        el.setAttribute('role', 'gridcell');
        el.dataset.r = String(r);
        el.dataset.c = String(c);
        boardEl.appendChild(el);
        row.push(el);
      }
      cellEls.push(row);
    }
  }

  function resetGrid() {
    grid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ letter: null, selected: false })),
    );
    path = [];
    dragging = false;
    setScore(0);
    overlay.classList.remove('is-open');
    boardEl.style.display = '';
    alive = true;
    // Seed a few bottom rows
    for (let r = ROWS - 3; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (Math.random() < 0.7) grid[r]![c]!.letter = randomLetter();
      }
    }
    renderCells();
  }

  function clearSelection() {
    for (const p of path) {
      const cell = grid[p.r]?.[p.c];
      if (cell) cell.selected = false;
    }
    path = [];
    renderCells();
  }

  function isAdjacent(a: { r: number; c: number }, b: { r: number; c: number }) {
    return Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1 && !(a.r === b.r && a.c === b.c);
  }

  function cellFromPoint(x: number, y: number) {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el || !el.classList.contains('wtr__cell')) return null;
    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);
    if (!Number.isFinite(r) || !Number.isFinite(c)) return null;
    if (!grid[r]?.[c]?.letter) return null;
    return { r, c };
  }

  function addToPath(pos: { r: number; c: number }) {
    if (!alive) return;
    const last = path[path.length - 1];
    if (last && last.r === pos.r && last.c === pos.c) return;
    // Allow backtrack one step
    if (path.length >= 2) {
      const prev = path[path.length - 2]!;
      if (prev.r === pos.r && prev.c === pos.c) {
        const removed = path.pop()!;
        grid[removed.r]![removed.c]!.selected = false;
        renderCells();
        return;
      }
    }
    if (path.some((p) => p.r === pos.r && p.c === pos.c)) return;
    if (last && !isAdjacent(last, pos)) return;
    path.push(pos);
    grid[pos.r]![pos.c]!.selected = true;
    void play('blip');
    renderCells();
  }

  function submitWord() {
    const word = path.map((p) => grid[p.r]![p.c]!.letter).join('').toLowerCase();
    if (word.length < 3) {
      clearSelection();
      return;
    }
    if (!WORDS.has(word)) {
      for (const p of path) {
        cellEls[p.r]![p.c]!.classList.add('is-invalid');
      }
      setTimeout(() => clearSelection(), 280);
      return;
    }

    // Remove letters and collapse columns
    for (const p of path) {
      grid[p.r]![p.c]!.letter = null;
      grid[p.r]![p.c]!.selected = false;
    }
    path = [];
    for (let c = 0; c < COLS; c++) {
      const letters: string[] = [];
      for (let r = 0; r < ROWS; r++) {
        const L = grid[r]![c]!.letter;
        if (L) letters.push(L);
        grid[r]![c]!.letter = null;
        grid[r]![c]!.selected = false;
      }
      let r = ROWS - 1;
      for (let i = letters.length - 1; i >= 0; i--) {
        grid[r]![c]!.letter = letters[i]!;
        r--;
      }
    }
    const gained = word.length * word.length * 10;
    setScore(score + gained);
    best = saveScore(GAME_ID, score);
    bestEl.textContent = String(best);
    void play('pop');
    renderCells();
  }

  function dropRow() {
    if (!alive) return;
    // If top row has any letter, game over
    if (grid[0]!.some((c) => c.letter)) {
      endGame();
      return;
    }
    // Shift up
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS; c++) {
        grid[r]![c]!.letter = grid[r + 1]![c]!.letter;
        grid[r]![c]!.selected = false;
      }
    }
    // New bottom row
    for (let c = 0; c < COLS; c++) {
      grid[ROWS - 1]![c]!.letter = Math.random() < 0.85 ? randomLetter() : null;
      grid[ROWS - 1]![c]!.selected = false;
    }
    path = [];
    renderCells();
  }

  function endGame() {
    alive = false;
    clearInterval(dropTimer);
    best = saveScore(GAME_ID, score);
    bestEl.textContent = String(best);
    resultEl.textContent = `Score ${score}. Best ${best}.`;
    overlay.classList.add('is-open');
    boardEl.style.display = 'none';
    void play('win');
  }

  function startLoop() {
    clearInterval(dropTimer);
    dropTimer = window.setInterval(dropRow, 2800);
  }

  function onPointerDown(e: PointerEvent) {
    if (!alive) return;
    unlockAudio();
    dragging = true;
    boardEl.setPointerCapture(e.pointerId);
    const pos = cellFromPoint(e.clientX, e.clientY);
    if (pos) {
      clearSelection();
      addToPath(pos);
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || !alive) return;
    const pos = cellFromPoint(e.clientX, e.clientY);
    if (pos) addToPath(pos);
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    submitWord();
  }

  buildDom();
  resetGrid();
  startLoop();

  boardEl.addEventListener('pointerdown', onPointerDown);
  boardEl.addEventListener('pointermove', onPointerMove);
  boardEl.addEventListener('pointerup', onPointerUp);
  boardEl.addEventListener('pointercancel', onPointerUp);
  clearBtn.addEventListener('click', () => {
    unlockAudio();
    clearSelection();
  });
  const restart = () => {
    unlockAudio();
    resetGrid();
    startLoop();
  };
  restartBtn.addEventListener('click', restart);
  againBtn.addEventListener('click', restart);

  return () => {
    alive = false;
    clearInterval(dropTimer);
    root.innerHTML = '';
  };
}

const mountEl = document.querySelector<HTMLElement>('[data-game-root="word-tile-rush"]');
if (mountEl) mountWordTileRush(mountEl);
