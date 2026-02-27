import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  vx: number;
  vy: number;
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initStars() {
      if (!canvas) return;
      const count = Math.min(200, Math.floor((canvas.width * canvas.height) / 6000));
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random(),
        size: Math.random() * 2 + 0.3,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.04,
      }));
    }

    resize();
    initStars();

    window.addEventListener("resize", () => {
      resize();
      initStars();
    });

    // Occasional nebula blobs
    const nebulae = [
      { x: 0.15, y: 0.3, r: 200, color: "rgba(78,48,120,0.06)" },
      { x: 0.8, y: 0.6, r: 250, color: "rgba(30,80,140,0.07)" },
      { x: 0.5, y: 0.1, r: 180, color: "rgba(60,30,100,0.05)" },
    ];

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.5,
        canvas.height * 0.4,
        0,
        canvas.width * 0.5,
        canvas.height * 0.4,
        canvas.width * 0.8,
      );
      gradient.addColorStop(0, "rgba(15,10,40,0)");
      gradient.addColorStop(1, "rgba(5,5,20,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebula blobs
      nebulae.forEach((n) => {
        const ng = ctx.createRadialGradient(
          canvas.width * n.x,
          canvas.height * n.y,
          0,
          canvas.width * n.x,
          canvas.height * n.y,
          n.r,
        );
        ng.addColorStop(0, n.color);
        ng.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ng;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      timeRef.current += 1;

      starsRef.current.forEach((star) => {
        // Drift
        star.x += star.vx;
        star.y += star.vy;

        // Wrap
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Twinkle
        const twinkle =
          0.5 + 0.5 * Math.sin(timeRef.current * star.twinkleSpeed + star.twinkleOffset);
        const alpha = star.opacity * (0.4 + 0.6 * twinkle);
        const size = star.size * (0.8 + 0.2 * twinkle);

        // Color based on z depth
        let color: string;
        if (star.z > 0.85) {
          color = `rgba(200, 220, 255, ${alpha})`;
        } else if (star.z > 0.6) {
          color = `rgba(180, 200, 255, ${alpha * 0.8})`;
        } else {
          color = `rgba(150, 160, 200, ${alpha * 0.5})`;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Glow on bright stars
        if (star.z > 0.9 && twinkle > 0.7) {
          const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, size * 4);
          glow.addColorStop(0, `rgba(200, 220, 255, ${alpha * 0.4})`);
          glow.addColorStop(1, "rgba(200, 220, 255, 0)");
          ctx.beginPath();
          ctx.arc(star.x, star.y, size * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="starfield-canvas"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.9 }}
    />
  );
}
