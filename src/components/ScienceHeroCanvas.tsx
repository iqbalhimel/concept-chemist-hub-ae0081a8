import { useEffect, useRef } from "react";
import { getTimeOfDay, timeColors, type TimeOfDay } from "@/lib/atmosphere";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DESKTOP_COUNT = 18;
const MOBILE_COUNT = 6;

interface ScienceElement {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "atom" | "molecule" | "dna" | "formula" | "bond" | "cell";
  size: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  phase: number;
  label?: string;
  orbitRadius?: number;
  electrons?: number;
  depth: number; // 0=far/blurred, 1=mid, 2=near/sharp
}

const FORMULAS = ["E=mc²", "π", "λ", "∑", "H₂O", "CO₂", "NaCl", "ΔG", "∫", "∇"];
const CHEM_LABELS = ["H₂O", "CO₂", "NaCl", "C₆H₆", "O₂", "N₂"];

function rand(a: number, b: number) { return a + Math.random() * (b - a); }

function createElement(w: number, h: number, index: number): ScienceElement {
  const types: ScienceElement["type"][] = ["atom", "molecule", "dna", "formula", "bond", "cell"];
  const type = types[Math.floor(Math.random() * types.length)];
  const depth = index % 3;

  // Distribute across zones
  let x: number, y: number;
  const zone = index % 5;
  switch (zone) {
    case 0: x = rand(0, w * 0.3); y = rand(0, h * 0.35); break;
    case 1: x = rand(w * 0.7, w); y = rand(0, h * 0.35); break;
    case 2: x = rand(w * 0.3, w * 0.7); y = rand(h * 0.25, h * 0.6); break;
    case 3: x = rand(w * 0.3, w * 0.7); y = rand(h * 0.25, h * 0.6); break;
    default: x = rand(0, w); y = rand(h * 0.55, h); break;
  }

  const ds = depth === 0 ? 0.7 : depth === 1 ? 1 : 1.3;
  const base: ScienceElement = {
    x, y,
    vx: rand(-0.22, 0.22), vy: rand(-0.18, 0.18),
    type, size: rand(22, 48) * ds, rotation: rand(0, 360),
    rotSpeed: rand(-0.5, 0.5),
    opacity: depth === 0 ? rand(0.18, 0.3) : depth === 1 ? rand(0.3, 0.5) : rand(0.45, 0.65),
    phase: rand(0, Math.PI * 2), depth,
  };
  if (type === "atom") { base.orbitRadius = rand(18, 36); base.electrons = Math.floor(rand(2, 4)); base.size = rand(28, 50) * ds; }
  if (type === "formula") { base.label = FORMULAS[Math.floor(Math.random() * FORMULAS.length)]; base.size = rand(14, 20) * ds; }
  if (type === "molecule") { base.label = CHEM_LABELS[Math.floor(Math.random() * CHEM_LABELS.length)]; base.size = rand(28, 44) * ds; }
  if (type === "dna") { base.size = rand(36, 55) * ds; }
  if (type === "cell") { base.size = rand(22, 38) * ds; }
  return base;
}

function drawAtom(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, colors: typeof timeColors.morning) {
  const { x, y, orbitRadius = 24, electrons = 3, rotation, size } = el;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Glow
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.6);
  grad.addColorStop(0, colors.glow.replace("0.5)", "0.12)").replace("0.6)", "0.12)"));
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(-size, -size, size * 2, size * 2);

  // Nucleus
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = colors.primary;
  ctx.fill();

  for (let i = 0; i < electrons; i++) {
    const angle = (Math.PI * 2 * i) / electrons;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRadius, orbitRadius * 0.35, 0, 0, Math.PI * 2);
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    const eAngle = tick * 0.02 + el.phase + i * 2;
    const ex = Math.cos(eAngle) * orbitRadius;
    const ey = Math.sin(eAngle) * orbitRadius * 0.35;
    ctx.beginPath();
    ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = colors.glow;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawMolecule(ctx: CanvasRenderingContext2D, el: ScienceElement, colors: typeof timeColors.morning) {
  const { x, y, size, rotation } = el;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  const r = size * 0.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1;
  ctx.stroke();

  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 3, 0, Math.PI * 2);
    ctx.fillStyle = colors.primary;
    ctx.fill();
  }

  if (el.label) {
    ctx.fillStyle = colors.glow;
    ctx.font = `bold ${size * 0.32}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(el.label, 0, 0);
  }
  ctx.restore();
}

function drawDNA(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, colors: typeof timeColors.morning) {
  const { x, y, size, phase } = el;
  ctx.save();
  ctx.translate(x, y);

  const steps = 14;
  const stepH = size * 0.13;
  for (let i = 0; i < steps; i++) {
    const t = tick * 0.015 + phase + i * 0.5;
    const ox = Math.sin(t) * size * 0.35;
    const py = (i - steps / 2) * stepH;

    ctx.beginPath();
    ctx.arc(-ox, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = colors.primary;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ox, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = colors.secondary;
    ctx.fill();
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.moveTo(-ox, py);
      ctx.lineTo(ox, py);
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFormula(ctx: CanvasRenderingContext2D, el: ScienceElement, colors: typeof timeColors.morning) {
  ctx.save();
  ctx.translate(el.x, el.y);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.fillStyle = colors.primary;
  ctx.font = `bold ${el.size}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(el.label || "π", 0, 0);
  ctx.restore();
}

function drawBond(ctx: CanvasRenderingContext2D, el: ScienceElement, _tick: number, colors: typeof timeColors.morning) {
  ctx.save();
  ctx.translate(el.x, el.y);
  ctx.rotate((el.rotation * Math.PI) / 180);
  const len = el.size;
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.lineTo(len / 2, 0);
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.beginPath(); ctx.arc(-len / 2, 0, 3.5, 0, Math.PI * 2); ctx.fillStyle = colors.primary; ctx.fill();
  ctx.beginPath(); ctx.arc(len / 2, 0, 3.5, 0, Math.PI * 2); ctx.fillStyle = colors.glow; ctx.fill();
  ctx.restore();
}

function drawCell(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, colors: typeof timeColors.morning) {
  ctx.save();
  ctx.translate(el.x, el.y);
  const r = el.size * 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = colors.primary;
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI * 2 * i) / 4 + tick * 0.005 + el.phase;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5);
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();
}

const ScienceHeroCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1, y: -1 });
  const { get } = useSiteSettings();

  const timeOverride = get("atmosphere", "time_override", "");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? MOBILE_COUNT : DESKTOP_COUNT;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const elements: ScienceElement[] = Array.from({ length: count }, (_, i) => createElement(w, h, i));
    let tick = 0;

    const getColors = () => {
      const validTimes = ["morning", "noon", "evening", "night"];
      const active: TimeOfDay = validTimes.includes(timeOverride) ? (timeOverride as TimeOfDay) : getTimeOfDay();
      return timeColors[active];
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => { mouseRef.current = { x: -1, y: -1 }; };

    const draw = () => {
      tick++;
      const colors = getColors();
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const el of elements) {
        // Parallax — depth-aware
        if (mx >= 0 && my >= 0 && !isMobile) {
          const dx = el.x - mx;
          const dy = el.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const range = 140;
          if (dist < range) {
            const force = (range - dist) / range * (0.2 + el.depth * 0.15);
            el.x += (dx / dist) * force;
            el.y += (dy / dist) * force;
          }
        }

        // Slightly more noticeable floating
        el.x += el.vx + Math.sin(tick * 0.008 + el.phase) * 0.14;
        el.y += el.vy + Math.cos(tick * 0.006 + el.phase) * 0.1;
        el.rotation += el.rotSpeed;

        // Wrap
        if (el.x < -60) el.x = w + 60;
        if (el.x > w + 60) el.x = -60;
        if (el.y < -60) el.y = h + 60;
        if (el.y > h + 60) el.y = -60;

        ctx.globalAlpha = el.opacity;

        // Depth blur for far elements
        if (el.depth === 0) {
          ctx.filter = "blur(1.5px)";
        } else {
          ctx.filter = "none";
        }

        switch (el.type) {
          case "atom": drawAtom(ctx, el, tick, colors); break;
          case "molecule": drawMolecule(ctx, el, colors); break;
          case "dna": drawDNA(ctx, el, tick, colors); break;
          case "formula": drawFormula(ctx, el, colors); break;
          case "bond": drawBond(ctx, el, tick, colors); break;
          case "cell": drawCell(ctx, el, tick, colors); break;
        }
      }

      ctx.filter = "none";
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animRef.current);
      } else {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    if (!isMobile) {
      canvas.parentElement?.addEventListener("mousemove", onMouseMove);
      canvas.parentElement?.addEventListener("mouseleave", onMouseLeave);
    }
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (!isMobile) {
        canvas.parentElement?.removeEventListener("mousemove", onMouseMove);
        canvas.parentElement?.removeEventListener("mouseleave", onMouseLeave);
      }
    };
  }, [timeOverride]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
};

export default ScienceHeroCanvas;
