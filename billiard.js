const canvas = document.getElementById("billiardCanvas");
const ctx = canvas.getContext("2d");

const BALL_RADIUS = 15;
const HOLE_RADIUS = 35;
const FRICTION = 0.98;
let aiming = false;
let aimAngle = 0;
let power = 0;

const holes = [
  { x: 0, y: 0 },
  { x: canvas.width / 2, y: 0 },
  { x: canvas.width, y: 0 },
  { x: 0, y: canvas.height },
  { x: canvas.width / 2, y: canvas.height },
  { x: canvas.width, y: canvas.height },
];

function drawLine(x1, y1, x2, y2, color = "white") {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

class Ball {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.inPlay = true;
  }

  draw() {
    if (!this.inPlay) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  move() {
    if (!this.inPlay) return;

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= FRICTION;
    this.vy *= FRICTION;

    if (Math.abs(this.vx) < 0.1) this.vx = 0;
    if (Math.abs(this.vy) < 0.1) this.vy = 0;

    if (this.x - BALL_RADIUS < 0 || this.x + BALL_RADIUS > canvas.width) {
      this.vx = -this.vx;
      this.x = Math.max(
        BALL_RADIUS,
        Math.min(this.x, canvas.width - BALL_RADIUS)
      );
    }
    if (this.y - BALL_RADIUS < 0 || this.y + BALL_RADIUS > canvas.height) {
      this.vy = -this.vy;
      this.y = Math.max(
        BALL_RADIUS,
        Math.min(this.y, canvas.height - BALL_RADIUS)
      );
    }

    holes.forEach((hole) => {
      const dx = this.x - hole.x;
      const dy = this.y - hole.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < HOLE_RADIUS) {
        this.inPlay = false;
        this.vx = 0;
        this.vy = 0;
      }
    });
  }

  checkCollision(other) {
    if (!this.inPlay || !other.inPlay) return;

    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < BALL_RADIUS * 2) {
      const angle = Math.atan2(dy, dx);
      const speed1 = Math.sqrt(this.vx ** 2 + this.vy ** 2);
      const speed2 = Math.sqrt(other.vx ** 2 + other.vy ** 2);

      const direction1 = Math.atan2(this.vy, this.vx);
      const direction2 = Math.atan2(other.vy, other.vx);

      const velocityX1 = speed1 * Math.cos(direction1 - angle);
      const velocityY1 = speed1 * Math.sin(direction1 - angle);
      const velocityX2 = speed2 * Math.cos(direction2 - angle);
      const velocityY2 = speed2 * Math.sin(direction2 - angle);

      const finalVelocityX1 = velocityX2;
      const finalVelocityX2 = velocityX1;

      this.vx =
        Math.cos(angle) * finalVelocityX1 +
        Math.cos(angle + Math.PI / 2) * velocityY1;
      this.vy =
        Math.sin(angle) * finalVelocityX1 +
        Math.sin(angle + Math.PI / 2) * velocityY1;
      other.vx =
        Math.cos(angle) * finalVelocityX2 +
        Math.cos(angle + Math.PI / 2) * velocityY2;
      other.vy =
        Math.sin(angle) * finalVelocityX2 +
        Math.sin(angle + Math.PI / 2) * velocityY2;

      const overlap = BALL_RADIUS * 2 - distance;
      this.x += (overlap / 2) * Math.cos(angle);
      this.y += (overlap / 2) * Math.sin(angle);
      other.x -= (overlap / 2) * Math.cos(angle);
      other.y -= (overlap / 2) * Math.sin(angle);
    }
  }
}

const balls = [];

balls.push(new Ball(200, canvas.height / 2, 0, 0, "white"));

const triangleStartX = canvas.width - 150;
const triangleStartY = canvas.height / 2;
const ballColors = [
  "red",
  "blue",
  "yellow",
  "green",
  "orange",
  "purple",
  "pink",
  "brown",
  "cyan",
  "lime",
];

let index = 0;
for (let row = 0; row < 5; row++) {
  for (let col = 0; col <= row; col++) {
    const x = triangleStartX + row * (BALL_RADIUS * 2 * Math.cos(Math.PI / 6));
    const y = triangleStartY - row * BALL_RADIUS + col * (BALL_RADIUS * 2);
    balls.push(new Ball(x, y, 0, 0, ballColors[index % ballColors.length]));
    index++;
  }
}

canvas.addEventListener("mousemove", (e) => {
  if (aiming) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    aimAngle = Math.atan2(mouseY - balls[0].y, mouseX - balls[0].x);
  }
});

canvas.addEventListener("mousedown", () => {
  aiming = true;
});

canvas.addEventListener("mouseup", () => {
  aiming = false;

  balls[0].vx = Math.cos(aimAngle) * power;
  balls[0].vy = Math.sin(aimAngle) * power;

  power = 0;
});

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  holes.forEach((hole) => {
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, HOLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.closePath();
  });

  balls.forEach((ball) => ball.move());
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      balls[i].checkCollision(balls[j]);
    }
  }
  balls.forEach((ball) => ball.draw());

  if (aiming) {
    const lineLength = 50 + power * 5;
    const lineX = balls[0].x + Math.cos(aimAngle) * lineLength;
    const lineY = balls[0].y + Math.sin(aimAngle) * lineLength;
    drawLine(balls[0].x, balls[0].y, lineX, lineY);
  }

  if (aiming) {
    power = Math.min(20, power + 0.2);
  }

  requestAnimationFrame(update);
}

update();
