import { useEffect, useRef, useCallback } from "react";
import { useTimer } from "../context/TimerContext";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface RocketState {
  x: number;
  y: number;
  vy: number;
  alpha: number;
}

const BLUE_PALETTE = ["#4fc3f7", "#00bcd4", "#0288d1", "#ffffff", "#b3e5fc", "#81d4fa", "#00e5ff"];

function randomColor(): string {
  return BLUE_PALETTE[Math.floor(Math.random() * BLUE_PALETTE.length)];
}

function randomBetween(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

function drawRocket(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Rocket body
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.bezierCurveTo(x + 8, y - 14, x + 8, y + 4, x + 6, y + 10);
  ctx.lineTo(x - 6, y + 10);
  ctx.bezierCurveTo(x - 8, y + 4, x - 8, y - 14, x, y - 22);
  ctx.fillStyle = "#e0f7fa";
  ctx.fill();

  // Window
  ctx.beginPath();
  ctx.arc(x, y - 6, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#4fc3f7";
  ctx.fill();
  ctx.strokeStyle = "#0288d1";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Left fin
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 8);
  ctx.lineTo(x - 14, y + 16);
  ctx.lineTo(x - 6, y + 12);
  ctx.closePath();
  ctx.fillStyle = "#0288d1";
  ctx.fill();

  // Right fin
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 8);
  ctx.lineTo(x + 14, y + 16);
  ctx.lineTo(x + 6, y + 12);
  ctx.closePath();
  ctx.fillStyle = "#0288d1";
  ctx.fill();

  // Exhaust nozzle
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 10);
  ctx.lineTo(x + 5, y + 10);
  ctx.lineTo(x + 3, y + 16);
  ctx.lineTo(x - 3, y + 16);
  ctx.closePath();
  ctx.fillStyle = "#546e7a";
  ctx.fill();

  ctx.restore();
}

function drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number, alpha: number, t: number): void {
  ctx.save();
  ctx.globalAlpha = alpha * 0.9;

  const flameH = 20 + intensity * 30 + Math.sin(t * 12) * 5;
  const gradient = ctx.createLinearGradient(x, y, x, y + flameH);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.2, "rgba(79,195,247,0.9)");
  gradient.addColorStop(0.6, "rgba(2,136,209,0.6)");
  gradient.addColorStop(1, "rgba(0,188,212,0)");

  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  const wobble = Math.sin(t * 8) * 3;
  ctx.bezierCurveTo(x - 6 + wobble, y + flameH * 0.4, x - 4, y + flameH * 0.8, x, y + flameH);
  ctx.bezierCurveTo(x + 4, y + flameH * 0.8, x + 6 - wobble, y + flameH * 0.4, x + 4, y);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.restore();
}

function drawShockwave(ctx: CanvasRenderingContext2D, cx: number, cy: number, progress: number): void {
  const radius = progress * Math.min(cx, cy) * 1.8;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 0.7 * (1 - progress));
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#4fc3f7";
  ctx.lineWidth = 2 + (1 - progress) * 3;
  ctx.stroke();
  ctx.restore();
}

export function RocketAnimation() {
  const { lastCompletedSessionNumber } = useTimer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const sessionNumberRef = useRef<number | null>(null);

  const runAnimation = useCallback((sessionNum: number) => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctxEl = canvasEl.getContext("2d");
    if (!ctxEl) return;

    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;

    // Capture non-null refs for use inside frame callback
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctxEl;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const duration = 3000; // ms

    // Intensity config based on session number
    const intensity = Math.min(sessionNum, 4);
    const particleCount = intensity === 1 ? 15 : intensity === 2 ? 30 : intensity === 3 ? 50 : 80;
    const maxSpeed = intensity === 1 ? 100 : intensity === 2 ? 200 : intensity === 3 ? 300 : 400;
    const maxRadius = intensity === 1 ? 3 : intensity === 2 ? 4 : intensity === 3 ? 5 : 6;
    const showRocket = sessionNum >= 2;
    const showShockwave = sessionNum >= 4;

    // Create particles
    const particles: Particle[] = [];
    const spawnCount = particleCount;
    for (let i = 0; i < spawnCount; i++) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(maxSpeed * 0.3, maxSpeed) / 1000; // px per ms
      const life = randomBetween(1500, duration);
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - speed * 0.5, // bias upward
        radius: randomBetween(maxRadius * 0.4, maxRadius),
        alpha: 1,
        color: randomColor(),
        life: 0,
        maxLife: life,
      });
    }

    // Rocket state
    const rocket: RocketState = {
      x: cx,
      y: canvas.height + 40,
      vy: showRocket ? -(canvas.height * 1.4) / duration : 0, // px per ms, travel full height+
      alpha: 1,
    };

    startTimeRef.current = performance.now();

    function frame(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const dt = 16; // approx ms per frame

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Shockwave ring for max intensity
      if (showShockwave && elapsed < 1000) {
        drawShockwave(ctx, cx, cy, elapsed / 1000);
      }

      // Update + draw particles
      for (const p of particles) {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.00015 * dt; // slight gravity
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.alpha <= 0) continue;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        // Glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      // Draw rocket
      if (showRocket) {
        rocket.y += rocket.vy * dt;
        // Fade out near top
        rocket.alpha = rocket.y < canvas.height * 0.3
          ? Math.max(0, rocket.y / (canvas.height * 0.3))
          : 1;

        if (rocket.alpha > 0 && rocket.y > -50) {
          const t = elapsed / 1000;
          drawFlame(ctx, rocket.x, rocket.y + 16, (intensity - 1) / 3, rocket.alpha, t);
          drawRocket(ctx, rocket.x, rocket.y, rocket.alpha);
        }
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (lastCompletedSessionNumber !== null && lastCompletedSessionNumber !== sessionNumberRef.current) {
      sessionNumberRef.current = lastCompletedSessionNumber;
      runAnimation(lastCompletedSessionNumber);
    }
  }, [lastCompletedSessionNumber, runAnimation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 100,
      }}
    />
  );
}
