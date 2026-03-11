import { useEffect, useRef, forwardRef } from "react";
import type { Season } from "@/lib/atmosphere";

const PARTICLE_COUNT = 18;

const seasonConfig: Record<Season, { emoji: string; speed: number; size: number }> = {
  spring: { emoji: "🌸", speed: 1.2, size: 14 },
  summer: { emoji: "☀️", speed: 0.8, size: 12 },
  autumn: { emoji: "🍂", speed: 1.0, size: 15 },
  winter: { emoji: "❄️", speed: 0.6, size: 13 },
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
}

const SeasonalParticles = memo(({ season }: { season: Season }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = seasonConfig[season];
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h - h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: cfg.speed * (0.5 + Math.random() * 0.8),
      opacity: 0.15 + Math.random() * 0.25,
      size: cfg.size * (0.7 + Math.random() * 0.6),
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cfg.emoji, 0, 0);
        ctx.restore();
      }
      animRef.current = requestAnimationFrame(draw);
    };

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
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

SeasonalParticles.displayName = "SeasonalParticles";
export default SeasonalParticles;
