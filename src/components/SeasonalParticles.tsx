import { useEffect, useRef, forwardRef } from "react";
import type { Season } from "@/lib/atmosphere";

const PARTICLE_COUNT_DESKTOP = 18;
const PARTICLE_COUNT_MOBILE = 10;

interface SeasonStyle {
  chars: string[];
  colors: string[];
  speed: number;
  sizeRange: [number, number];
  drift: number;
  opacityRange: [number, number];
}

const seasonConfig: Record<Season, SeasonStyle> = {
  spring: {
    chars: ["🌸", "🌷", "💮"],
    colors: ["#ffb7c5", "#ffd6e0", "#ffffff"],
    speed: 0.5,
    sizeRange: [12, 18],
    drift: 0.4,
    opacityRange: [0.3, 0.65],
  },
  summer: {
    chars: ["✦", "✧", "·"],
    colors: ["#ffe066", "#fff5cc", "#ffdd57"],
    speed: 0.25,
    sizeRange: [4, 8],
    drift: 0.15,
    opacityRange: [0.2, 0.5],
  },
  autumn: {
    chars: ["🍂", "🍁", "🍃"],
    colors: ["#e67e22", "#d35400", "#c0813a"],
    speed: 0.6,
    sizeRange: [12, 18],
    drift: 0.8,
    opacityRange: [0.35, 0.7],
  },
  winter: {
    chars: ["❄", "❅", "•"],
    colors: ["#ffffff", "#cce5ff", "#e0f0ff"],
    speed: 0.3,
    sizeRange: [5, 12],
    drift: 0.35,
    opacityRange: [0.25, 0.6],
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
    y: startAbove ? -20 - Math.random() * h * 0.3 : Math.random() * h,
    vx: (Math.random() - 0.5) * cfg.drift,
    vy: cfg.speed * (0.5 + Math.random() * 0.5),
    opacity: cfg.opacityRange[0] + Math.random() * (cfg.opacityRange[1] - cfg.opacityRange[0]),
    size,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 1.5,
    char: cfg.chars[Math.floor(Math.random() * cfg.chars.length)],
    color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
    phaseOffset: Math.random() * Math.PI * 2,
  };
}

const SeasonalParticles = forwardRef<HTMLCanvasElement, { season: Season }>(function SeasonalParticles({ season }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const scrollThrottleRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const cfg = seasonConfig[season];
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2

    let logicalW = canvas.offsetWidth;
    let logicalH = canvas.offsetHeight;

    const resize = () => {
      logicalW = canvas.offsetWidth;
      logicalH = canvas.offsetHeight;
      canvas.width = logicalW * dpr;
      canvas.height = logicalH * dpr;
      canvas.style.width = logicalW + "px";
      canvas.style.height = logicalH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const particles: Particle[] = Array.from({ length: count }, () =>
      createParticle(logicalW, logicalH, cfg, false)
    );

    let tick = 0;
    let skipFrames = 0;

    // Scroll-based throttling: skip every other frame while scrolling fast
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      skipFrames = 2;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => { skipFrames = 0; }, 150);
    };

    const draw = () => {
      if (pausedRef.current) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      tick++;

      // Skip rendering during fast scroll but still update positions
      if (skipFrames > 0 && tick % 2 === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, logicalW, logicalH);

      for (const p of particles) {
        p.x += p.vx + Math.sin(tick * 0.012 + p.phaseOffset) * cfg.drift * 0.25;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        if (p.y > logicalH + 25) {
          Object.assign(p, createParticle(logicalW, logicalH, cfg, true));
        }
        if (p.x < -25) p.x = logicalW + 25;
        if (p.x > logicalW + 25) p.x = -25;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        // No shadow/glow — pure fill for performance
        ctx.fillStyle = p.color;
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.char, 0, 0);

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    const onVisibility = () => { pausedRef.current = document.hidden; };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [season]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1, willChange: "transform" }}
      aria-hidden="true"
    />
  );
});

export default SeasonalParticles;
