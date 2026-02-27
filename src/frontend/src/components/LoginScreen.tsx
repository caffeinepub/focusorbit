import { useEffect, useRef, useState } from "react";
import { Orbit, Rocket, Shield, BarChart2, Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginScreen() {
  const { login, isLoggingIn, isLoginError, loginError } = useInternetIdentity();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Starfield canvas for login screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const stars: { x: number; y: number; r: number; speed: number; opacity: number; twinkleOffset: number }[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      if (!canvas) return;
      stars.length = 0;
      for (let i = 0; i < 220; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.2,
          speed: Math.random() * 0.12 + 0.03,
          opacity: Math.random() * 0.6 + 0.2,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    let t = 0;
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.012;

      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * 1.5 + s.twinkleOffset);
        ctx.globalAlpha = s.opacity * (0.4 + 0.6 * twinkle);
        ctx.fillStyle = "#e0f4ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = -2;
          s.x = Math.random() * canvas.width;
        }
      }

      // Draw a few nebula wisps
      ctx.globalAlpha = 0.04;
      const grd1 = ctx.createRadialGradient(canvas.width * 0.2, canvas.height * 0.3, 0, canvas.width * 0.2, canvas.height * 0.3, 340);
      grd1.addColorStop(0, "#4fc3f7");
      grd1.addColorStop(1, "transparent");
      ctx.fillStyle = grd1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 0.03;
      const grd2 = ctx.createRadialGradient(canvas.width * 0.75, canvas.height * 0.6, 0, canvas.width * 0.75, canvas.height * 0.6, 280);
      grd2.addColorStop(0, "#b39ddb");
      grd2.addColorStop(1, "transparent");
      ctx.fillStyle = grd2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    resize();
    init();
    draw();

    window.addEventListener("resize", () => { resize(); init(); });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", () => { resize(); init(); });
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: "oklch(0.07 0.018 265)" }}>

      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Radial atmospheric glow at center */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 55%, oklch(0.72 0.18 220 / 0.07) 0%, transparent 70%)",
        }}
      />

      {/* Orbit ring decorations */}
      <div
        className="absolute pointer-events-none"
        role="presentation"
        style={{
          width: 520,
          height: 520,
          borderRadius: "50%",
          border: "1px solid oklch(0.72 0.18 220 / 0.08)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        role="presentation"
        style={{
          width: 700,
          height: 700,
          borderRadius: "50%",
          border: "1px solid oklch(0.72 0.18 220 / 0.05)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Main card */}
      <div
        className={`relative z-10 flex flex-col items-center gap-8 px-8 py-12 max-w-md w-full mx-4 transition-all duration-700
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        style={{
          background: "oklch(0.12 0.025 265 / 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid oklch(0.72 0.18 220 / 0.18)",
          borderRadius: "1.5rem",
          boxShadow:
            "0 0 40px oklch(0.72 0.18 220 / 0.08), 0 0 80px oklch(0.72 0.18 220 / 0.04), inset 0 1px 0 oklch(0.72 0.18 220 / 0.12)",
        }}
      >
        {/* Logo */}
        <div className={`flex flex-col items-center gap-4 transition-all duration-700 delay-100
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0.72 0.18 220 / 0.12)",
              border: "1.5px solid oklch(0.72 0.18 220 / 0.35)",
              boxShadow:
                "0 0 24px oklch(0.72 0.18 220 / 0.35), 0 0 48px oklch(0.72 0.18 220 / 0.15)",
              animation: "glow-pulse 3s ease-in-out infinite",
            }}
          >
            <Orbit className="w-9 h-9" style={{ color: "oklch(0.72 0.18 220)" }} />
            {/* Orbiting dot */}
            <div
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                background: "oklch(0.80 0.16 50)",
                boxShadow: "0 0 8px oklch(0.80 0.16 50 / 0.8)",
                animation: "orbit-dot 4s linear infinite",
                top: "50%",
                left: "50%",
                transformOrigin: "0 0",
              }}
            />
          </div>

          <div className="text-center">
            <h1
              className="font-orbitron font-bold text-3xl tracking-widest"
              style={{ letterSpacing: "0.12em" }}
            >
              <span className="text-foreground">Focus</span>
              <span
                style={{
                  color: "oklch(0.72 0.18 220)",
                  textShadow:
                    "0 0 16px oklch(0.72 0.18 220 / 0.8), 0 0 32px oklch(0.72 0.18 220 / 0.4)",
                }}
              >
                Orbit
              </span>
            </h1>
            <p
              className="mt-2 text-sm font-grotesk tracking-wider"
              style={{ color: "oklch(0.55 0.04 265)" }}
            >
              Your focus. Your orbit. Your identity.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className={`w-full h-px transition-all duration-700 delay-200
            ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.18 220 / 0.25), transparent)" }}
        />

        {/* Feature pills */}
        <div className={`flex flex-wrap justify-center gap-2 transition-all duration-700 delay-300
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {[
            { icon: <Rocket className="w-3 h-3" />, label: "Streak Tracking" },
            { icon: <Shield className="w-3 h-3" />, label: "Freeze Shield" },
            { icon: <BarChart2 className="w-3 h-3" />, label: "Analytics" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-grotesk font-medium"
              style={{
                background: "oklch(0.72 0.18 220 / 0.08)",
                border: "1px solid oklch(0.72 0.18 220 / 0.18)",
                color: "oklch(0.72 0.18 220)",
              }}
            >
              {icon}
              {label}
            </div>
          ))}
        </div>

        {/* Login section */}
        <div className={`w-full flex flex-col items-center gap-4 transition-all duration-700 delay-400
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <button
            type="button"
            onClick={login}
            disabled={isLoggingIn}
            className="relative w-full py-4 rounded-xl font-orbitron font-semibold text-sm tracking-widest transition-all duration-200 disabled:cursor-not-allowed group overflow-hidden"
            style={{
              background: isLoggingIn
                ? "oklch(0.72 0.18 220 / 0.15)"
                : "oklch(0.72 0.18 220 / 0.18)",
              border: "1.5px solid oklch(0.72 0.18 220 / 0.50)",
              color: "oklch(0.88 0.10 220)",
              boxShadow: isLoggingIn
                ? "none"
                : "0 0 20px oklch(0.72 0.18 220 / 0.2), inset 0 1px 0 oklch(0.72 0.18 220 / 0.15)",
            }}
            onMouseEnter={(e) => {
              if (!isLoggingIn) {
                (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.72 0.18 220 / 0.28)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 32px oklch(0.72 0.18 220 / 0.4), inset 0 1px 0 oklch(0.72 0.18 220 / 0.2)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoggingIn) {
                (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.72 0.18 220 / 0.18)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px oklch(0.72 0.18 220 / 0.2), inset 0 1px 0 oklch(0.72 0.18 220 / 0.15)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }
            }}
          >
            {isLoggingIn ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Initiating Launch Sequence...
              </span>
            ) : (
              "LOGIN TO YOUR ORBIT"
            )}
          </button>

          <p
            className="text-center text-xs font-grotesk leading-relaxed"
            style={{ color: "oklch(0.45 0.03 265)" }}
          >
            Login once — access your stats from any device or browser.
            <br />
            <span style={{ color: "oklch(0.40 0.03 265)" }}>
              Uses Internet Computer cryptographic identity.
            </span>
          </p>

          {isLoginError && loginError && (
            <div
              className="w-full px-4 py-3 rounded-lg text-xs font-grotesk text-center"
              style={{
                background: "oklch(0.60 0.20 25 / 0.12)",
                border: "1px solid oklch(0.60 0.20 25 / 0.30)",
                color: "oklch(0.75 0.14 25)",
              }}
            >
              {loginError.message === "User already authenticated"
                ? "Already authenticated. Refreshing..."
                : "Login failed. Please try again."}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className={`absolute bottom-6 left-0 right-0 text-center text-xs font-grotesk transition-all duration-700 delay-500
          ${mounted ? "opacity-100" : "opacity-0"}`}
        style={{ color: "oklch(0.35 0.03 265)" }}
      >
        © 2026. Built with{" "}
        <span style={{ color: "oklch(0.60 0.20 25 / 0.7)" }}>♥</span>{" "}
        using{" "}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "oklch(0.60 0.10 220)" }}
          className="hover:opacity-80 transition-opacity"
        >
          caffeine.ai
        </a>
      </div>

      <style>{`
        @keyframes orbit-dot {
          from { transform: translate(-50%, -50%) rotate(0deg) translateX(36px); }
          to   { transform: translate(-50%, -50%) rotate(360deg) translateX(36px); }
        }
      `}</style>
    </div>
  );
}
