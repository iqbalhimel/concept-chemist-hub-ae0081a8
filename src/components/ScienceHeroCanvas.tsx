import { useEffect, useRef } from "react";
import { getTimeOfDay, timeColors, type TimeOfDay } from "@/lib/atmosphere";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DESKTOP_COUNT = 21;
const MOBILE_COUNT = 9;

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
}

const FORMULAS = ["E=mc²", "π", "λ", "∑", "H₂O", "CO₂", "NaCl", "ΔG", "∫", "∇"];
const CHEM_LABELS = ["H₂O", "CO₂", "NaCl", "C₆H₆", "O₂", "N₂"];

function rand(a: number, b: number) { return a + Math.random() * (b - a); }

function createElement(w: number, h: number): ScienceElement {
  const types: ScienceElement["type"][] = ["atom", "molecule", "dna", "formula", "bond", "cell"];
  const type = types[Math.floor(Math.random() * types.length)];
  const base: ScienceElement = {
    x: rand(0, w), y: rand(0, h),
    vx: rand(-0.15, 0.15), vy: rand(-0.12, 0.12),
    type, size: rand(12, 28), rotation: rand(0, 360),
    rotSpeed: rand(-0.3, 0.3), opacity: rand(0.15, 0.45),
    phase: rand(0, Math.PI * 2),
  };
  if (type === "atom") { base.orbitRadius = rand(10, 22); base.electrons = Math.floor(rand(2, 4)); base.size = rand(16, 30); }
  if (type === "formula") { base.label = FORMULAS[Math.floor(Math.random() * FORMULAS.length)]; base.size = rand(10, 14); }
  if (type === "molecule") { base.label = CHEM_LABELS[Math.floor(Math.random() * CHEM_LABELS.length)]; }
  if (type === "dna") { base.size = rand(20, 35); }
  if (type === "cell") { base.size = rand(14, 24); }
  return base;
}

function drawAtom(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, colors: typeof timeColors.morning) {
  const { x, y, orbitRadius = 15, electrons = 3, rotation, size } = el;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Nucleus
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = colors.primary;
  ctx.fill();

  // Orbits
  for (let i = 0; i < electrons; i++) {
    const angle = (Math.PI * 2 * i) / electrons;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRadius, orbitRadius * 0.35, 0, 0, Math.PI * 2);
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Electron
    const eAngle = tick * 0.02 + el.phase + i * 2;
    const ex = Math.cos(eAngle) * orbitRadius;
    const ey = Math.sin(eAngle) * orbitRadius * 0.35;
    ctx.beginPath();
    ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
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

  // Hexagonal benzene-like structure
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
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Nodes
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2, 0, Math.PI * 2);
    ctx.fillStyle = colors.primary;
    ctx.fill();
  }

  if (el.label) {
    ctx.fillStyle = colors.glow;
    ctx.font = `${size * 0.3}px monospace`;
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

  const steps = 12;
  const stepH = size * 0.12;
  for (let i = 0; i < steps; i++) {
    const t = tick * 0.015 + phase + i * 0.5;
    const ox = Math.sin(t) * size * 0.3;
    const py = (i - steps / 2) * stepH;

    // Left strand
    ctx.beginPath();
    ctx.arc(-ox, py, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = colors.primary;
    ctx.fill();
    // Right strand
    ctx.beginPath();
    ctx.arc(ox, py, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = colors.secondary;
    ctx.fill();
    // Bond
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.moveTo(-ox, py);
      ctx.lineTo(ox, py);
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = 0.4;
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
  ctx.font = `${el.size}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(el.label || "π", 0, 0);
  ctx.restore();
}

function drawBond(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, colors: typeof timeColors.morning) {
  ctx.save();
  ctx.translate(el.x, el.y);
  ctx.rotate((el.rotation * Math.PI) / 180);
  const len = el.size;
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.lineTo(len / 2, 0);
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // Endpoints
  ctx.beginPath(); ctx.arc(-len / 2, 0, 2.5, 0, Math.PI * 2); ctx.fillStyle = colors.primary; ctx.fill();
  ctx.beginPath(); ctx.arc(len / 2, 0, 2.5, 0, Math.PI * 2); ctx.fillStyle = colors.glow; ctx.fill();
  ctx.restore();
}

function drawCell(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, colors: typeof timeColors.morning) {
  ctx.save();
  ctx.translate(el.x, el.y);
  const r = el.size * 0.5;
  // Membrane
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // Nucleus
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = colors.primary;
  ctx.fill();
  // Neuron-like dendrites
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI * 2 * i) / 4 + tick * 0.005 + el.phase;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5);
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 0.4;
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

    const elements: ScienceElement[] = Array.from({ length: count }, () => createElement(w, h));
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
        // Parallax
        if (mx >= 0 && my >= 0 && !isMobile) {
          const dx = el.x - mx;
          const dy = el.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120 * 0.3;
            el.x += (dx / dist) * force;
            el.y += (dy / dist) * force;
          }
        }

        el.x += el.vx + Math.sin(tick * 0.008 + el.phase) * 0.08;
        el.y += el.vy + Math.cos(tick * 0.006 + el.phase) * 0.06;
        el.rotation += el.rotSpeed;

        // Wrap
        if (el.x < -40) el.x = w + 40;
        if (el.x > w + 40) el.x = -40;
        if (el.y < -40) el.y = h + 40;
        if (el.y > h + 40) el.y = -40;

        ctx.globalAlpha = el.opacity;

        switch (el.type) {
          case "atom": drawAtom(ctx, el, tick, colors); break;
          case "molecule": drawMolecule(ctx, el, colors); break;
          case "dna": drawDNA(ctx, el, tick, colors); break;
          case "formula": drawFormula(ctx, el, colors); break;
          case "bond": drawBond(ctx, el, tick, colors); break;
          case "cell": drawCell(ctx, el, tick, colors); break;
        }
      }

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
