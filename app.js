// Dartboard rendered as SVG, using regulation proportions (radii in mm).
// Segment order clockwise from the top (20 at 12 o'clock).
const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const R = {
  bullInner: 6.35,   // 50
  bullOuter: 15.9,   // 25
  tripleInner: 99,
  tripleOuter: 107,
  doubleInner: 162,
  doubleOuter: 170,
  numbers: 195,      // where the number labels sit
  surround: 212,     // outer edge of the board surround
};

const COLORS = {
  black: '#26221f',
  cream: '#ead7b7',
  red: '#d8232a',
  green: '#1f9d55',
  wire: '#cfcfcf',
  surround: '#111',
};

const SVG_NS = 'http://www.w3.org/2000/svg';

// Angle is measured clockwise from 12 o'clock (SVG y-axis points down).
function polar(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return [radius * Math.sin(rad), -radius * Math.cos(rad)];
}

// Path for a ring segment between two radii and two angles (each wedge is 18°,
// well under 180°, so the large-arc flag is always 0).
function annularSector(rInner, rOuter, a1, a2) {
  const [x1, y1] = polar(a1, rOuter);
  const [x2, y2] = polar(a2, rOuter);
  const [x3, y3] = polar(a2, rInner);
  const [x4, y4] = polar(a1, rInner);
  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 0 0 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}

function createSegment(d, fill, label) {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', fill);
  path.setAttribute('stroke', COLORS.wire);
  path.setAttribute('stroke-width', '1');
  path.classList.add('segment');
  path.dataset.label = label;
  return path;
}

function buildBoard(onDart) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `-${R.surround} -${R.surround} ${R.surround * 2} ${R.surround * 2}`);

  // Surround (the dark area outside the scoring region)
  const surround = document.createElementNS(SVG_NS, 'circle');
  surround.setAttribute('r', R.surround);
  surround.setAttribute('fill', COLORS.surround);
  svg.appendChild(surround);

  // Rings of each wedge, from inside out.
  // Even index (20, 18, ...) -> black single + red double/triple
  // Odd index               -> cream single + green double/triple
  const rings = [
    { inner: R.bullOuter, outer: R.tripleInner, label: (n) => `${n}`, color: (even) => (even ? COLORS.black : COLORS.cream) },
    { inner: R.tripleInner, outer: R.tripleOuter, label: (n) => `T${n}`, color: (even) => (even ? COLORS.red : COLORS.green) },
    { inner: R.tripleOuter, outer: R.doubleInner, label: (n) => `${n}`, color: (even) => (even ? COLORS.black : COLORS.cream) },
    { inner: R.doubleInner, outer: R.doubleOuter, label: (n) => `D${n}`, color: (even) => (even ? COLORS.red : COLORS.green) },
  ];

  NUMBERS.forEach((num, i) => {
    const a1 = i * 18 - 9;
    const a2 = i * 18 + 9;
    const even = i % 2 === 0;

    for (const ring of rings) {
      svg.appendChild(
        createSegment(annularSector(ring.inner, ring.outer, a1, a2), ring.color(even), ring.label(num))
      );
    }

    // Number label on the surround
    const [tx, ty] = polar(i * 18, R.numbers);
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', tx);
    text.setAttribute('y', ty);
    text.setAttribute('fill', '#eee');
    text.setAttribute('font-size', '20');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.classList.add('number-label');
    text.textContent = num;
    svg.appendChild(text);
  });

  // Outer bull (25) and inner bull (50)
  const outerBull = document.createElementNS(SVG_NS, 'circle');
  outerBull.setAttribute('r', R.bullOuter);
  outerBull.setAttribute('fill', COLORS.green);
  outerBull.setAttribute('stroke', COLORS.wire);
  outerBull.setAttribute('stroke-width', '1');
  outerBull.classList.add('segment');
  outerBull.dataset.label = '25';
  svg.appendChild(outerBull);

  const innerBull = document.createElementNS(SVG_NS, 'circle');
  innerBull.setAttribute('r', R.bullInner);
  innerBull.setAttribute('fill', COLORS.red);
  innerBull.setAttribute('stroke', COLORS.wire);
  innerBull.setAttribute('stroke-width', '1');
  innerBull.classList.add('segment');
  innerBull.dataset.label = 'BULL';
  svg.appendChild(innerBull);

  // One delegated click handler for all segments
  svg.addEventListener('click', (event) => {
    const segment = event.target.closest('.segment');
    if (segment) {
      onDart(segment.dataset.label);
    }
  });

  return svg;
}

// --- Checkout game -----------------------------------------------------------

// Favourite checkout routes ('DB' from the table is stored as 'BULL').
const ROUTES = {
  170: [['T20', 'T20', 'BULL']],
  167: [['T20', 'T19', 'BULL']],
  164: [['T20', 'T18', 'BULL']],
  161: [['T20', 'T17', 'BULL']],
  160: [['T20', 'T20', 'D20']],
  158: [['T20', 'T20', 'D19']],
  157: [['T20', 'T19', 'D20']],
  156: [['T20', 'T20', 'D18']],
  155: [['T20', 'T19', 'D19']],
  154: [['T20', 'T18', 'D20']],
  153: [['T20', 'T19', 'D18']],
  152: [['T20', 'T20', 'D16']],
  151: [['T20', 'T17', 'D20']],
  150: [['T20', 'T18', 'D18']],
  149: [['T20', 'T19', 'D16']],
  148: [['T20', 'T20', 'D14']],
  147: [['T20', 'T17', 'D18']],
  146: [['T20', 'T18', 'D16']],
  145: [['T20', 'T19', 'D14']],
  144: [['T20', 'T20', 'D12']],
  143: [['T20', 'T17', 'D16']],
  142: [['T20', 'T14', 'D20']],
  141: [['T20', 'T19', 'D12']],
  140: [['T20', 'T20', 'D10']],
  139: [['T20', 'T13', 'D20']],
  138: [['T20', 'T18', 'D12']],
  137: [['T20', 'T19', 'D10']],
  136: [['T20', 'T20', 'D8']],
  135: [['T20', 'T17', 'D12']],
  134: [['T20', 'T16', 'D13']],
  133: [['T20', 'T19', 'D8']],
  132: [['T20', 'T16', 'D12']],
  131: [['T19', 'T14', 'D16']],
  130: [['T20', 'T20', 'D5']],
  129: [['T19', 'T16', 'D12']],
  128: [['T18', 'T14', 'D16']],
  127: [['T20', 'T17', 'D8']],
  126: [['T19', 'T19', 'D6']],
  125: [['T18', 'T19', 'D7']],
  124: [['T20', 'T14', 'D11']],
  123: [['T19', 'T16', 'D9']],
  122: [['T18', 'T18', 'D7']],
  121: [['T20', 'T11', 'D14']],
  120: [['T20', '20', 'D20']],
  119: [['T19', 'T12', 'D13']],
  118: [['T20', '18', 'D20']],
  117: [['T19', '20', 'D20']],
  116: [['T19', '19', 'D20']],
  115: [['T20', '15', 'D20']],
  114: [['T19', '17', 'D20']],
  113: [['T19', '16', 'D20']],
  112: [['T20', 'T12', 'D8']],
  111: [['T19', '14', 'D20']],
  110: [['T20', 'T10', 'D10']],
  109: [['T20', '9', 'D20']],
  108: [['T20', '16', 'D16'], ['T20', '8', 'D20']],
  107: [['T19', 'T10', 'D10']],
  106: [['T20', 'T10', 'D8']],
  105: [['T20', '13', 'D16']],
  104: [['T19', '15', 'D16']],
  103: [['T19', '6', 'D20'], ['T19', '10', 'D18']],
  102: [['T20', '10', 'D16'], ['T20', '6', 'D18']],
  101: [['T20', '9', 'D16']],
  100: [['T20', 'D20']],
  99: [['T19', '6', 'D18'], ['T19', '10', 'D16']],
  98: [['T20', 'D19']],
  97: [['T19', 'D20']],
  96: [['T20', 'D18']],
  95: [['T19', 'D19']],
  94: [['T18', 'D20']],
  93: [['T19', 'D18']],
  92: [['T20', 'D16']],
  91: [['T17', 'D20']],
  90: [['T20', 'D15']],
  89: [['T19', 'D16']],
  88: [['T20', 'D14']],
  87: [['T17', 'D18']],
  86: [['T18', 'D16']],
  85: [['T15', 'D20']],
  84: [['T20', 'D12']],
  83: [['T17', 'D16']],
  82: [['BULL', 'D16']],
  81: [['T19', 'D12']],
  80: [['T20', 'D10']],
  79: [['T19', 'D11']],
  78: [['T18', 'D12']],
  77: [['T19', 'D10']],
  76: [['T20', 'D8']],
  75: [['T17', 'D12']],
  74: [['T14', 'D16']],
  73: [['T19', 'D8']],
  72: [['T16', 'D12']],
  71: [['T13', 'D16']],
  70: [['T18', 'D8']],
  69: [['T19', 'D6']],
  68: [['T20', 'D4']],
  67: [['T9', 'D20']],
  66: [['T10', 'D18']],
  65: [['T11', 'D16']],
  64: [['T16', 'D8']],
  63: [['T13', 'D12']],
  62: [['T10', 'D16']],
  61: [['T15', 'D8']],
  60: [['20', 'D20']],
  59: [['19', 'D20']],
  58: [['18', 'D20']],
  57: [['17', 'D20']],
  56: [['T16', 'D4']],
  55: [['15', 'D20']],
  54: [['14', 'D20']],
  53: [['13', 'D20']],
  52: [['12', 'D20']],
  51: [['11', 'D20']],
  50: [['10', 'D20']],
  49: [['9', 'D20']],
  48: [['16', 'D16'], ['8', 'D20']],
  47: [['7', 'D20']],
  46: [['6', 'D20'], ['10', 'D18']],
  45: [['13', 'D16']],
  44: [['12', 'D16']],
  43: [['3', 'D20']],
  42: [['10', 'D16'], ['6', 'D18']],
  41: [['9', 'D16']],
};

const TARGETS = Object.keys(ROUTES).map(Number);
const FLASH_MS = 800;

let target = 0;
let darts = [];
let locked = false; // ignore clicks while the board is flashing

const boardContainer = document.getElementById('board-container');
const targetEl = document.getElementById('target');
const dartsEl = document.getElementById('darts');
const statusEl = document.getElementById('status');
const routeEl = document.getElementById('route');

function dartValue(label) {
  if (label === 'BULL') return 50;
  if (label === '25') return 25;
  if (label.startsWith('T')) return 3 * Number(label.slice(1));
  if (label.startsWith('D')) return 2 * Number(label.slice(1));
  return Number(label);
}

function isDouble(label) {
  return label === 'BULL' || label.startsWith('D');
}

function randomTarget() {
  return TARGETS[Math.floor(Math.random() * TARGETS.length)];
}

function render() {
  targetEl.textContent = target;
  dartsEl.textContent = darts.length ? darts.join('  ·  ') : '—';
}

function isFavouriteRoute(darts, score) {
  return ROUTES[score].some(
    (route) => route.length === darts.length && route.every((dart, i) => dart === darts[i])
  );
}

// Show the favourite route(s) for the current target ('BULL' shown as 'DB')
function showRoute() {
  const text = ROUTES[target]
    .map((route) => route.map((dart) => (dart === 'BULL' ? 'DB' : dart)).join(' '))
    .join('  or  ');
  routeEl.textContent = `Route: ${text}`;
}

function flash(color, after) {
  locked = true;
  boardContainer.classList.add(`flash-${color}`);
  setTimeout(() => {
    boardContainer.classList.remove(`flash-${color}`);
    after();
    locked = false;
  }, FLASH_MS);
}

function handleDart(label) {
  if (locked) return;
  console.log(label);
  statusEl.textContent = '';
  darts.push(label);
  render();

  const used = darts.reduce((sum, l) => sum + dartValue(l), 0);
  const remaining = target - used;

  if (remaining === 0 && isDouble(label)) {
    if (isFavouriteRoute(darts, target)) {
      // Correct favourite route: next target
      statusEl.textContent = 'Checked out!';
      flash('green', () => {
        darts = [];
        target = randomTarget();
        statusEl.textContent = '';
        routeEl.textContent = '';
        render();
      });
    } else {
      // Valid checkout, but not the favourite route: same target, show the route
      statusEl.textContent = 'Valid, but not your route!';
      showRoute();
      flash('yellow', () => {
        darts = [];
        render();
      });
    }
    return;
  }

  // Fail: bust (overshot, landed on 1, or 0 without a double) or out of darts
  if (remaining < 2 || darts.length === 3) {
    statusEl.textContent = remaining < 2 ? 'Bust!' : 'Out of darts!';
    flash('red', () => {
      darts = [];
      render();
    });
  }
}

boardContainer.appendChild(buildBoard(handleDart));
target = randomTarget();
render();
