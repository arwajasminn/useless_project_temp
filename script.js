const canvas = document.getElementById("squiggly-slider");
const ctx = canvas.getContext("2d");
const fallSound = document.getElementById("fallSound");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const SLIDER_WIDTH = 900;
let SLIDER_LEFT = (canvas.width - SLIDER_WIDTH) / 2;
let SLIDER_RIGHT = SLIDER_LEFT + SLIDER_WIDTH;

function getWaveY(x) {
  const mod = Math.sin(x * 0.005);
  const amp = 30 + 15 * mod;
  const freq = 0.015 + 0.005 * mod;
  return canvas.height / 2 + amp * Math.sin(x * freq);
}

let ball = {
  x: SLIDER_LEFT,
  y: getWaveY(SLIDER_LEFT),
  radius: 12,
  color: "#00ffcc",
  dragging: false,
  onSine: true,
  locked: false,
  resting: false,
  velocityX: 0,
  velocityY: 0
};

let gravity = 0.5;
let friction = 0.98;
let bounce = 0.7;
let holdTimer = null;
let fallCount = 0;
let particles = [];

function spawnParticles(x, y) {
  particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push({
      x,
      y,
      dx: Math.random() * 3 - 1.5,
      dy: Math.random() * -3 - 1,
      radius: Math.random() * 2 + 1,
      alpha: 1
    });
  }
}

function drawParticles() {
  particles = particles.filter(p => p.alpha > 0);
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`;
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.1;
    p.alpha -= 0.03;
  });
}

function drawVolumeIcon() {
  ctx.fillStyle = "#fff";
  const cx = SLIDER_LEFT - 30;
  const cy = canvas.height / 2;

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 10, cy - 10);
  ctx.lineTo(cx + 10, cy + 10);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx + 14, cy, 5, -Math.PI / 4, Math.PI / 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 14, cy, 10, -Math.PI / 4, Math.PI / 4);
  ctx.stroke();
}

function drawSlider() {
  ctx.beginPath();
  ctx.moveTo(SLIDER_LEFT, getWaveY(SLIDER_LEFT));
  for (let x = SLIDER_LEFT + 1; x <= SLIDER_RIGHT; x++) {
    ctx.lineTo(x, getWaveY(x));
  }
  ctx.strokeStyle = "#ffcc00";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();
}

function drawText() {
  ctx.fillStyle = "#fff";
  ctx.font = "16px monospace";
  ctx.textAlign = "center";

  const volume = Math.min(1, Math.max(0, (ball.x - SLIDER_LEFT) / (SLIDER_RIGHT - SLIDER_LEFT)));
  const real = (volume * 100).toFixed(0);
  const imag = (((canvas.height - ball.y) / canvas.height) * 100).toFixed(0);
  const sign = imag >= 0 ? "+" : "-";

  if (ball.onSine) {
    ctx.fillText(`Volume: ${real}%`, ball.x, ball.y - 15);
  } else {
    ctx.fillText(`Volume: ${real} ${sign} ${Math.abs(imag)}i%`, ball.x, ball.y - 15);
  }
}

function playPopSound() {
  fallSound.currentTime = 0;
  fallSound.play();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  SLIDER_LEFT = (canvas.width - SLIDER_WIDTH) / 2;
  SLIDER_RIGHT = SLIDER_LEFT + SLIDER_WIDTH;

  drawSlider();
  drawVolumeIcon();
  drawParticles();

  const volume = Math.min(1, Math.max(0, (ball.x - SLIDER_LEFT) / (SLIDER_RIGHT - SLIDER_LEFT)));

  if (!ball.dragging) {
    if (ball.onSine) {
      const slope = (getWaveY(ball.x + 1) - getWaveY(ball.x - 1)) / 2;
      ball.velocityX += slope * gravity;
      ball.velocityX *= friction;
      ball.x += ball.velocityX;
      ball.x = Math.max(SLIDER_LEFT, Math.min(SLIDER_RIGHT, ball.x));
      ball.y = getWaveY(ball.x);

      if (volume >= 1 && ball.x >= SLIDER_RIGHT - 1) {
        ball.onSine = false;
        ball.locked = true;
        ball.velocityY = 0;
        fallCount++;
      }
    } else {
      ball.velocityY += gravity;
      ball.velocityY *= friction;
      ball.y += ball.velocityY;
      ball.x += ball.velocityX;
      ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));

      if (ball.y + ball.radius >= canvas.height) {
        ball.y = canvas.height - ball.radius;
        playPopSound();
        spawnParticles(ball.x, ball.y);
        if (Math.abs(ball.velocityY) > 1) {
          ball.velocityY *= -bounce;
        } else {
          ball.velocityY = 0;
          ball.resting = true;
        }
      }
    }
  }

  drawBall();
  drawText();
  requestAnimationFrame(animate);
}
animate();

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const dx = mx - ball.x;
  const dy = my - ball.y;
  if (Math.sqrt(dx * dx + dy * dy) < ball.radius + 5) {
    ball.dragging = true;
    ball.velocityX = 0;
    ball.velocityY = 0;
    ball.resting = false;
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (ball.dragging) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, mx));
    ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, my));

    const sineY = getWaveY(ball.x);
    const nearSine = Math.abs(ball.y - sineY) < ball.radius;

    if (!ball.onSine && nearSine) {
      if (!holdTimer) {
        holdTimer = setTimeout(() => {
          ball.y = getWaveY(ball.x);
          ball.onSine = true;
          ball.locked = false;
          holdTimer = null;
        }, 2000);
      }
    } else if (!nearSine && holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }

    if (ball.onSine && !ball.locked) {
      ball.y = getWaveY(ball.x);
    }
  }
});

["mouseup", "mouseleave"].forEach(event => {
  canvas.addEventListener(event, () => {
    ball.dragging = false;
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  });
});
