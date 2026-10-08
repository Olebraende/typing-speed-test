const COLORS = ['#177dff', '#4dd67b', '#d64d5b', '#f4dc73'];

const PARTICLES_PER_CANNON = 90;
const GRAVITY = 520; // px/s²
const DRAG_PER_FRAME = 0.98; // at 60fps; also caps the fall speed
const FADE_MS = 1000;
const RAIN_DURATION_MS = 2600;
const RAIN_PER_SECOND = 55;

const random = (min, max) => min + Math.random() * (max - min);

function createParticle(originX, originY, vx, vy, life) {
  return {
    x: originX,
    y: originY,
    vx,
    vy,
    width: random(6, 11),
    height: random(10, 18),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: random(0, Math.PI * 2),
    spin: random(-9, 9),
    flip: random(0, Math.PI * 2),
    flipSpeed: random(5, 14),
    life,
    age: 0,
  };
}

function createBurstParticle(originX, originY, direction) {
  const angle = -Math.PI / 2 + direction * random(0.15, 0.8);
  const speed = random(1000, 1900);
  return createParticle(
    originX,
    originY,
    Math.cos(angle) * speed,
    Math.sin(angle) * speed,
    random(3200, 5000),
  );
}

function createRainParticle(width) {
  return createParticle(random(0, width), -20, random(-60, 60), random(80, 240), random(4200, 6000));
}

/**
 * Fires two confetti cannons from the lower corners and cleans up after
 * itself. Returns a function that cancels the animation early.
 */
export function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);

  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;

  const context = canvas.getContext('2d');
  context.scale(ratio, ratio);

  const originY = height * 0.85;
  let particles = [
    ...Array.from({ length: PARTICLES_PER_CANNON }, () => createBurstParticle(-10, originY, 1)),
    ...Array.from({ length: PARTICLES_PER_CANNON }, () => createBurstParticle(width + 10, originY, -1)),
  ];

  let frameId = 0;
  const startedAt = performance.now();
  let previous = startedAt;
  let rainDebt = 0;

  const stop = () => {
    cancelAnimationFrame(frameId);
    canvas.remove();
  };

  const frame = (now) => {
    const delta = Math.min(now - previous, 50);
    const seconds = delta / 1000;
    previous = now;

    context.clearRect(0, 0, width, height);
    if (now - startedAt < RAIN_DURATION_MS) {
      rainDebt += RAIN_PER_SECOND * seconds;
      for (; rainDebt >= 1; rainDebt--) particles.push(createRainParticle(width));
    }

    particles = particles.filter((p) => p.age < p.life && p.y < height + 40);

    for (const p of particles) {
      p.age += delta;
      p.vx *= DRAG_PER_FRAME ** (delta / 16.67);
      p.vy = p.vy * DRAG_PER_FRAME ** (delta / 16.67) + GRAVITY * seconds;
      p.x += p.vx * seconds;
      p.y += p.vy * seconds;
      p.rotation += p.spin * seconds;
      p.flip += p.flipSpeed * seconds;

      const remaining = p.life - p.age;
      context.globalAlpha = Math.min(1, remaining / FADE_MS);
      context.fillStyle = p.color;
      context.save();
      context.translate(p.x, p.y);
      context.rotate(p.rotation);
      // Scaling one axis by a sine fakes the paper flipping in 3D.
      context.scale(1, Math.cos(p.flip));
      context.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      context.restore();
    }

    if (particles.length === 0 && now - startedAt >= RAIN_DURATION_MS) {
      stop();
      return;
    }
    frameId = requestAnimationFrame(frame);
  };

  frameId = requestAnimationFrame(frame);
  return stop;
}
