const stage = document.getElementById('stage');
const receipt = document.getElementById('receipt');
const printBtn = document.getElementById('printBtn');
const printerText = document.querySelector('.printer-text');
const receiptDate = document.getElementById('receiptDate');

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- Receipt date stamp ---
const today = new Date();
receiptDate.textContent = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

// --- Typewriter heading ---
const HEADING_PREFIX = "Amina's Daily ";
const ROTATING_WORDS = ['Hell :,(', 'Tasks', 'Summary'];
const TYPE_DELAY = 90;
const DELETE_DELAY = 60;
const HOLD_AFTER_TYPE = 1400;
const HOLD_AFTER_DELETE = 300;

const heading = document.querySelector('.intro h1');
const headingText = heading.textContent;
heading.textContent = '';

const caret = document.createElement('span');
caret.className = 'caret';
caret.textContent = '|';
heading.appendChild(caret);

function typeString(str, i, done) {
  if (i >= str.length) return done();
  caret.before(str[i]);
  setTimeout(() => typeString(str, i + 1, done), TYPE_DELAY);
}

function deleteChars(n, done) {
  if (n <= 0) return done();
  const prev = caret.previousSibling;
  if (prev) {
    if (prev.nodeType === Node.TEXT_NODE && prev.data.length > 1) {
      prev.data = prev.data.slice(0, -1);
    } else {
      prev.remove();
    }
  }
  setTimeout(() => deleteChars(n - 1, done), DELETE_DELAY);
}

function loopWord(idx) {
  const word = ROTATING_WORDS[idx % ROTATING_WORDS.length];
  typeString(word, 0, () => {
    setTimeout(() => {
      deleteChars(word.length, () => {
        setTimeout(() => loopWord(idx + 1), HOLD_AFTER_DELETE);
      });
    }, HOLD_AFTER_TYPE);
  });
}

setTimeout(() => {
  typeString(headingText, 0, () => {
    setTimeout(() => {
      const trailing = headingText.length - HEADING_PREFIX.length;
      deleteChars(trailing, () => {
        setTimeout(() => loopWord(0), HOLD_AFTER_DELETE);
      });
    }, HOLD_AFTER_TYPE);
  });
}, 2000);

// --- Printer idle / printing text ---
const eventCount = document.querySelectorAll('.events li').length;
const reactionFrame = eventCount > 3 ? '૮(˶ㅠ︿ㅠ)ა ' : eventCount < 3 ? '( ˶ˆᗜˆ˵ )' : null;
const IDLE_FRAMES = ['₊✩‧₊˚print me₊✩‧₊˚', '₊˚₊✩‧print me₊˚₊✩‧'];
if (reactionFrame) IDLE_FRAMES.push(reactionFrame);
const PRINTING_FRAMES = ['₊ ⊹ . ݁printing₊ ⊹ . ݁˖', '⊹ . ݁₊ printing₊ . ݁˖⊹ '];

let idleFrame = 0;
printerText.textContent = IDLE_FRAMES[0];
const idleInterval = setInterval(() => {
  idleFrame = (idleFrame + 1) % IDLE_FRAMES.length;
  printerText.textContent = IDLE_FRAMES[idleFrame];
}, 600);

// --- Todo sparkle effect lolll ---
const SPARKLE_GLYPHS = ['✦', '✧', '⋆', '✩', '✶'];
const SPARKLE_COLORS = ['#EC6E9E', '#9E6EDA', '#C76EAB', '#FFD978'];
const SPARKLES_PER_BURST = 8;

function spawnSparkles(x, y) {
  for (let i = 0; i < SPARKLES_PER_BURST; i++) {
    const sparkle = document.createElement('span');
    sparkle.className = 'sparkle';
    sparkle.textContent = randomItem(SPARKLE_GLYPHS);
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.color = randomItem(SPARKLE_COLORS);
    sparkle.style.fontSize = `${12 + Math.random() * 12}px`;

    const angle = (i / SPARKLES_PER_BURST) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 32 + Math.random() * 28;
    sparkle.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    sparkle.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);

    document.body.appendChild(sparkle);
    sparkle.addEventListener('animationend', () => sparkle.remove());
  }
}

document.querySelectorAll('.todos .todo').forEach((todo) => {
  todo.addEventListener('click', (e) => {
    const willBeDone = !todo.classList.contains('done');
    todo.classList.toggle('done');
    if (willBeDone) spawnSparkles(e.clientX, e.clientY);
  });
});

// --- Receipt wiggle ---
function wiggleReceipt() {
  receipt.classList.remove('is-wiggle');
  void receipt.offsetWidth;
  receipt.classList.add('is-wiggle');
}

receipt.addEventListener('click', (e) => {
  if (e.target.closest('.todo')) return;
  wiggleReceipt();
});

receipt.addEventListener('animationend', (e) => {
  if (e.animationName === 'receipt-wiggle') receipt.classList.remove('is-wiggle');
});

// --- Print button flow ---
printBtn.addEventListener('click', () => {
  clearInterval(idleInterval);
  stage.classList.add('is-printing');

  let frame = 0;
  printerText.textContent = PRINTING_FRAMES[0];
  const textInterval = setInterval(() => {
    frame = 1 - frame;
    printerText.textContent = PRINTING_FRAMES[frame];
  }, 400);

  receipt.addEventListener('transitionend', function onPrintEnd(e) {
    if (e.propertyName !== 'transform') return;
    receipt.removeEventListener('transitionend', onPrintEnd);
    clearInterval(textInterval);
    stage.classList.add('is-done');

    receipt.addEventListener('transitionend', function onSettle(e2) {
      if (e2.propertyName !== 'transform') return;
      receipt.removeEventListener('transitionend', onSettle);
      wiggleReceipt();
    });
  });
});

// --- Background sparkles ---
const BG_SPARKLE_COUNT = 90;
const bgSparkleContainer = document.querySelector('.bg-sparkles');

for (let i = 0; i < BG_SPARKLE_COUNT; i++) {
  const sparkle = document.createElement('span');
  sparkle.className = 'bg-sparkle';
  const size = 2 + Math.floor(Math.random() * 3);
  sparkle.style.width = `${size}px`;
  sparkle.style.height = `${size}px`;
  sparkle.style.left = `${Math.random() * 100}%`;
  sparkle.style.top = `${Math.random() * 100}%`;
  sparkle.style.setProperty('--dur', `${2 + Math.random() * 3}s`);
  sparkle.style.setProperty('--delay', `${Math.random() * 4}s`);
  bgSparkleContainer.appendChild(sparkle);
}

// --- Drifting decor images ---
const DECOR_IMAGES = [
  { src: 'assets/background-decors/big1.png', size: 45 },
  { src: 'assets/background-decors/big1.png', size: 65 },
  { src: 'assets/background-decors/big1.png', size: 55 },
  { src: 'assets/background-decors/big2.png', size: 40 },
  { src: 'assets/background-decors/big2.png', size: 60 },
  { src: 'assets/background-decors/big2.png', size: 70 },
  { src: 'assets/background-decors/big3.png', size: 50 },
  { src: 'assets/background-decors/big4.png', size: 35 },
  { src: 'assets/background-decors/big4.png', size: 58 },
  { src: 'assets/background-decors/big4.png', size: 66 },
  { src: 'assets/background-decors/big5.png', size: 42 },
  { src: 'assets/background-decors/Layer 5.png', size: 22, wander: true },
  { src: 'assets/background-decors/Layer 5.png', size: 18, wander: true },
  { src: 'assets/background-decors/Layer 6.png', size: 24, wander: true },
  { src: 'assets/background-decors/Layer 6.png', size: 20, wander: true },
  { src: 'assets/background-decors/Layer 7.png', size: 20, wander: true },
  { src: 'assets/background-decors/Layer 7.png', size: 26, wander: true },
  { src: 'assets/background-decors/Layer 9.png', size: 22, wander: true },
  { src: 'assets/background-decors/Layer 9.png', size: 17, wander: true },
  { src: 'assets/background-decors/Layer 10.png', size: 18, wander: true },
  { src: 'assets/background-decors/Layer 10.png', size: 24, wander: true },
  { src: 'assets/background-decors/Layer 12.png', size: 20, wander: true },
  { src: 'assets/background-decors/Layer 12.png', size: 26, wander: true },
  { src: 'assets/background-decors/Layer 13.png', size: 22, wander: true },
  { src: 'assets/background-decors/Layer 13.png', size: 18, wander: true },
  { src: 'assets/background-decors/Layer 14.png', size: 16, wander: true },
  { src: 'assets/background-decors/Layer 14.png', size: 22, wander: true },
  { src: 'assets/background-decors/Layer 15.png', size: 16, wander: true },
  { src: 'assets/background-decors/Layer 15.png', size: 20, wander: true },
  { src: 'assets/background-decors/Layer 16.png', size: 24, wander: true },
  { src: 'assets/background-decors/Layer 16.png', size: 18, wander: true },
  { src: 'assets/background-decors/Layer 17.png', size: 20, wander: true },
  { src: 'assets/background-decors/Layer 17.png', size: 25, wander: true },
  { src: 'assets/background-decors/Layer 18.png', size: 26, wander: true },
  { src: 'assets/background-decors/Layer 18.png', size: 18, wander: true },
];

const KICK_SPEED = 45;
const BOUNCE_DURATION = 0.35;
const BOUNCE_AMPLITUDE = 0.22;
const MAX_FRAME_DT = 0.05;

const viewportWidth = () => window.innerWidth;
const viewportHeight = () => window.innerHeight;

const decorContainer = document.querySelector('.bg-decors');
const decors = [];

DECOR_IMAGES.forEach((config) => {
  const el = document.createElement('img');
  el.src = config.src;
  el.alt = '';
  el.className = 'bg-decor';
  el.draggable = false;
  el.style.width = `${config.size}px`;
  el.style.height = `${config.size}px`;
  decorContainer.appendChild(el);

  const speed = 12 + Math.random() * 14;
  const angle = Math.random() * Math.PI * 2;
  const decor = {
    el,
    x: Math.random() * Math.max(0, viewportWidth() - config.size),
    y: Math.random() * Math.max(0, viewportHeight() - config.size),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: config.size / 2,
    size: config.size,
    wander: !!config.wander,
    bounceTime: 0,
  };
  decors.push(decor);

  el.addEventListener('click', (e) => {
    const cx = decor.x + decor.r;
    const cy = decor.y + decor.r;
    let dx = cx - e.clientX;
    let dy = cy - e.clientY;
    let len = Math.hypot(dx, dy);
    if (len < 0.001) {
      const a = Math.random() * Math.PI * 2;
      dx = Math.cos(a);
      dy = Math.sin(a);
      len = 1;
    }
    decor.vx = (dx / len) * KICK_SPEED;
    decor.vy = (dy / len) * KICK_SPEED;
    decor.bounceTime = BOUNCE_DURATION;
  });
});

function stepMotion(decor, dt, w, h) {
  decor.x += decor.vx * dt;
  decor.y += decor.vy * dt;

  if (decor.wander) {
    if (decor.x > w) decor.x = -decor.size;
    else if (decor.x + decor.size < 0) decor.x = w;
    if (decor.y > h) decor.y = -decor.size;
    else if (decor.y + decor.size < 0) decor.y = h;
    return;
  }

  if (decor.x < 0) { decor.x = 0; decor.vx = -decor.vx; }
  else if (decor.x + decor.size > w) { decor.x = w - decor.size; decor.vx = -decor.vx; }
  if (decor.y < 0) { decor.y = 0; decor.vy = -decor.vy; }
  else if (decor.y + decor.size > h) { decor.y = h - decor.size; decor.vy = -decor.vy; }
}

function resolveCollision(a, b) {
  const dx = (b.x + b.r) - (a.x + a.r);
  const dy = (b.y + b.r) - (a.y + a.r);
  const minD = a.r + b.r;
  const distSq = dx * dx + dy * dy;
  if (distSq >= minD * minD || distSq <= 0.0001) return;

  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = (minD - dist) / 2;
  a.x -= nx * overlap; a.y -= ny * overlap;
  b.x += nx * overlap; b.y += ny * overlap;

  const dot = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (dot < 0) {
    a.vx += dot * nx; a.vy += dot * ny;
    b.vx -= dot * nx; b.vy -= dot * ny;
  }
}

function renderDecor(decor, dt) {
  let scale = 1;
  if (decor.bounceTime > 0) {
    decor.bounceTime = Math.max(0, decor.bounceTime - dt);
    const t = 1 - decor.bounceTime / BOUNCE_DURATION;
    scale = 1 + BOUNCE_AMPLITUDE * Math.sin(t * Math.PI);
  }
  decor.el.style.transform = `translate(${decor.x}px, ${decor.y}px) scale(${scale})`;
}

let decorLastTime = performance.now();
function tickDecors(now) {
  const dt = Math.min(MAX_FRAME_DT, (now - decorLastTime) / 1000);
  decorLastTime = now;
  const w = viewportWidth();
  const h = viewportHeight();

  for (const decor of decors) stepMotion(decor, dt, w, h);

  for (let i = 0; i < decors.length; i++) {
    const a = decors[i];
    if (!a.wander) {
      for (let j = i + 1; j < decors.length; j++) {
        const b = decors[j];
        if (!b.wander) resolveCollision(a, b);
      }
    }
    renderDecor(a, dt);
  }

  requestAnimationFrame(tickDecors);
}

requestAnimationFrame((t) => {
  decorLastTime = t;
  tickDecors(t);
});
