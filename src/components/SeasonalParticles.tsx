import { useEffect, useRef, forwardRef } from "react";
import type { Season } from "@/lib/atmosphere";

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

const PARTICLE_COUNT_DESKTOP = 28;
const PARTICLE_COUNT_MOBILE = 14;

interface SeasonStyle {
  chars: string[];
  colors: string[];
  speed: number;
  sizeRange: [number, number];
  drift: number;
  opacityRange: [number, number];
  glow: boolean;
}

const seasonConfig: Record<Season, SeasonStyle> = {
  spring: {
    chars: ["🌸", "🌷", "💮", "✿"],
    colors: ["#ffb7c5", "#ffd6e0", "#ffffff", "#f8a4c0"],
    speed: 0.7,
    sizeRange: [14, 22],
    drift: 0.6,
    opacityRange: [0.35, 0.75],
    glow: false,
  },
  summer: {
    chars: ["✦", "✧", "·", "◦"],
    colors: ["#ffe066", "#fff5cc", "#ffdd57", "#ffffff"],
    speed: 0.3,
    sizeRange: [4, 10],
    drift: 0.2,
    opacityRange: [0.25, 0.6],
    glow: true,
  },
  autumn: {
    chars: ["🍂", "🍁", "🍃"],
    colors: ["#e67e22", "#d35400", "#a0522d", "#c0813a"],
    speed: 0.8,
    sizeRange: [14, 22],
    drift: 1.2,
    opacityRange: [0.4, 0.8],
    glow: false,
  },
  winter: {
    chars: ["❄", "❅", "❆", "•"],
    colors: ["#ffffff", "#cce5ff", "#e0f0ff", "#b0d4f1"],
    speed: 0.4,
    sizeRange: [6, 16],
    drift: 0.5,
    opacityRange: [0.3, 0.7],
    glow: true,
  },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  char: string;
  color: string;
  phaseOffset: number;
}

function createParticle(w: number, h: number, cfg: SeasonStyle, startAbove = true): Particle {
  const size = cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]);
  return {
    x: Math.random() * w,
    y: startAbove ? -20 - Math.random() * h * 0.5 : Math.random() * h,
    vx: (Math.random() - 0.5) * cfg.drift,
    vy: cfg.speed * (0.5 + Math.random() * 0.7),
    opacity: cfg.opacityRange[0] + Math.random() * (cfg.opacityRange[1] - cfg.opacityRange[0]),
    size,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 2,
    char: cfg.chars[Math.floor(Math.random() * cfg.chars.length)],
    color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
    phaseOffset: Math.random() * Math.PI * 2,
  };
}

const SeasonalParticles = forwardRef<HTMLCanvasElement, { season: Season }>(function SeasonalParticles({ season }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = seasonConfig[season];
    const count = isMobile() ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;

    let w = (canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1));
    let h = (canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1));
    canvas.style.width = canvas.offsetWidth + "px";
    canvas.style.height = canvas.offsetHeight + "px";
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    const logicalW = canvas.offsetWidth;
    const logicalH = canvas.offsetHeight;

    const particles: Particle[] = Array.from({ length: count }, () =>
      createParticle(logicalW, logicalH, cfg, false)
    );

    let tick = 0;

    const draw = () => {
      if (pausedRef.current) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      tick++;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      // Already scaled via ctx.scale

      for (const p of particles) {
        // Sinusoidal horizontal drift for organic motion
        p.x += p.vx + Math.sin(tick * 0.015 + p.phaseOffset) * cfg.drift * 0.3;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        if (p.y > logicalH + 30) {
          Object.assign(p, createParticle(logicalW, logicalH, cfg, true));
        }
        if (p.x < -30) p.x = logicalW + 30;
        if (p.x > logicalW + 30) p.x = -30;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (cfg.glow) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = p.size * 1.5;
        }

        // Use fillText for emoji chars, fillRect/arc for geometric chars
        if (p.char.length > 1 || p.char.codePointAt(0)! > 0x2fff) {
          // Emoji
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.char, 0, 0);
        } else {
          // Geometric / text char (summer sparkles, winter dots)
          ctx.fillStyle = p.color;
          ctx.font = `${p.size}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.char, 0, 0);
        }

        ctx.restore();
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(draw);
    };

    const onResize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.width = canvas.offsetWidth * dpr;
      h = canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const onVisibility = () => {
      pausedRef.current = document.hidden;
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [season]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
});

export default SeasonalParticles;
