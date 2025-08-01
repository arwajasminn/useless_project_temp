// JS FILE (script.js) — with real pop sound + golden burst sparkles
// ---------------------------------------------------
const canvas = document.getElementById("squiggly-slider");
const ctx = canvas.getContext("2d");
const fallSound = document.getElementById("fallSound");

canvas.width = 1000;
canvas.height = 400;

const LEFT_PADDING = 60;
const RIGHT_LIMIT = canvas.width - 40;

function getWaveY(x) {
  const mod = Math.sin(x * 0.005);
  const amplitude = 30 + 15 * mod;
  const frequency = 0.015 + 0.005 * mod;
  return 150 + amplitude * Math.sin(x * frequency);
}

let ball = {
  x: LEFT_PADDING,
  y: getWaveY(LEFT_PADDING),
  radius: 10,
  color: "#00ffcc",
  dragging: false,
  onSine: true,
  locked: false,
  velocityX: 0,
  velocityY: 0,
  hasFallen: false,
  resting: false,
};

let holdTimer = null;
const gravity = 0.4;
const friction = 0.99;
const bounce = 0.7;

let particles = [];

function spawnParticles(x, y) {
  particles = [];  // Clear old sparkles to avoid fountain effect
  for (let i = 0; i < 20; i++) {
    particles.push({
      x,
      y,
      radius: Math.random() * 2 + 1,
      alpha: 1,
      dx: Math.random() * 3 - 1.5,
      dy: Math.random() * -3 - 1,
      color: "#FFD700", // Golden color
    });
  }
}

function drawParticles() {
  particles = particles.filter(p => p.alpha > 0);
  for (let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `${p.color}${Math.floor(p.alpha * 255).toString(16).padStart(2, '0')}`;
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.1;
    p.alpha -= 0.03;
  }
}

function drawSliderPath() {
  ctx.beginPath();
  ctx.moveTo(LEFT_PADDING, getWaveY(LEFT_PADDING));
  for (let x = LEFT_PADDING + 1; x <= RIGHT_LIMIT; x++) {
    ctx.lineTo(x, getWaveY(x));
  }
  ctx.strokeStyle = "#ffcc00";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawVolumeIcon() {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(20, 150);
  ctx.lineTo(30, 140);
  ctx.lineTo(30, 160);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(34, 150, 5, -Math.PI / 4, Math.PI / 4);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(34, 150, 10, -Math.PI / 4, Math.PI / 4);
  ctx.stroke();
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();
}

function drawTextAboveBall() {
  ctx.fillStyle = "#fff";
  ctx.font = "16px monospace";
  ctx.textAlign = "center";

  const volume = Math.min(1, Math.max(0, (ball.x - LEFT_PADDING) / (RIGHT_LIMIT - LEFT_PADDING)));
  const textX = Math.max(40, Math.min(ball.x, canvas.width - 40));

  if (ball.onSine) {
    ctx.fillText(`Volume: ${(volume * 100).toFixed(0)}%`, textX, ball.y - ball.radius - 10);
  } else {
    const real = (volume * 100).toFixed(0);
    const imag = (((canvas.height - ball.y) / canvas.height) * 100).toFixed(0);
    const sign = imag >= 0 ? "+" : "-";
    ctx.fillText(`Volume: ${real} ${sign} ${Math.abs(imag)}i%`, textX, ball.y - ball.radius - 10);
  }
}

function playPopSound() {
  fallSound.currentTime = 0;
  fallSound.play();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSliderPath();
  drawVolumeIcon();

  const volume = Math.min(1, Math.max(0, (ball.x - LEFT_PADDING) / (RIGHT_LIMIT - LEFT_PADDING)));

  if (!ball.dragging) {
    if (ball.onSine) {
      const slope = (getWaveY(ball.x + 1) - getWaveY(ball.x - 1)) / 2;
      ball.velocityX += slope * gravity;
      ball.velocityX *= friction;
      ball.velocityX = Math.max(-10, Math.min(10, ball.velocityX));
      ball.x += ball.velocityX;
      ball.x = Math.max(LEFT_PADDING, Math.min(RIGHT_LIMIT, ball.x));
      ball.y = getWaveY(ball.x);

      if (volume >= 1 && ball.x >= RIGHT_LIMIT - 1) {
        ball.onSine = false;
        ball.locked = true;
        ball.velocityY = 0;
      }
    } else {
      ball.velocityY += gravity;
      ball.velocityY *= friction;
      ball.y += ball.velocityY;
      ball.x += ball.velocityX;
      ball.x = Math.max(LEFT_PADDING, Math.min(RIGHT_LIMIT, ball.x));

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

  drawParticles();
  drawBall();
  drawTextAboveBall();
  requestAnimationFrame(animate);
}

animate();

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const dx = mouseX - ball.x;
  const dy = mouseY - ball.y;

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
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    ball.x = Math.max(LEFT_PADDING, Math.min(RIGHT_LIMIT, mouseX));
    ball.y = Math.max(0, Math.min(canvas.height, mouseY));

    const sineY = getWaveY(ball.x);
    const isNearSine = Math.abs(ball.y - sineY) < ball.radius;

    if (!ball.onSine && isNearSine) {
      if (!holdTimer) {
        holdTimer = setTimeout(() => {
          ball.y = getWaveY(ball.x);
          ball.onSine = true;
          ball.locked = false;
          holdTimer = null;
        }, 2000);
      }
    } else if (!isNearSine && holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }

    if (ball.onSine && !ball.locked) {
      ball.y = getWaveY(ball.x);
    }
  }
});

canvas.addEventListener("mouseup", () => {
  ball.dragging = false;
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
});

canvas.addEventListener("mouseleave", () => {
  ball.dragging = false;
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
});
