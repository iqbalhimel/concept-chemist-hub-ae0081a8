import { useEffect, useRef } from "react";
import { getTimeOfDay, timeColors, type TimeOfDay } from "@/lib/atmosphere";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DESKTOP_COUNT = 9;
const MOBILE_COUNT = 5;

interface ScienceElement {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "atom" | "solar" | "wave" | "benzene" | "water" | "network" | "dna" | "neuron" | "cell";
  size: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  phase: number;
}

function rand(a: number, b: number) { return a + Math.random() * (b - a); }

const ELEMENT_TYPES: ScienceElement["type"][] = [
  "atom", "solar", "wave", "benzene", "water", "network", "dna", "neuron", "cell"
];

function createElement(w: number, h: number, index: number): ScienceElement {
  const type = ELEMENT_TYPES[index % ELEMENT_TYPES.length];
  // Distribute across hero area
  const cols = 3;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const cellW = w / cols;
  const cellH = h / 3;
  const x = cellW * col + rand(cellW * 0.2, cellW * 0.8);
  const y = cellH * row + rand(cellH * 0.2, cellH * 0.8);

  return {
    x, y,
    vx: rand(-0.15, 0.15),
    vy: rand(-0.12, 0.12),
    type,
    size: rand(50, 70),
    rotation: rand(0, 360),
    rotSpeed: rand(-0.3, 0.3),
    opacity: rand(0.35, 0.6),
    phase: rand(0, Math.PI * 2),
  };
}

type Colors = typeof timeColors.morning;

// 1. Atomic Structure
function drawAtom(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, c: Colors) {
  const { x, y, size } = el;
  ctx.save();
  ctx.translate(x, y);
  // Nucleus
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  // 3 orbit paths + electrons
  for (let i = 0; i < 3; i++) {
    const tilt = (Math.PI / 3) * i;
    ctx.save();
    ctx.rotate(tilt);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.45, size * 0.18, 0, 0, Math.PI * 2);
    ctx.strokeStyle = c.secondary;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    const eA = tick * 0.02 + el.phase + i * 2.1;
    const ex = Math.cos(eA) * size * 0.45;
    const ey = Math.sin(eA) * size * 0.18;
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fillStyle = c.glow;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// 2. Solar System Orbit
function drawSolar(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, c: Colors) {
  const { x, y, size } = el;
  ctx.save();
  ctx.translate(x, y);
  // Sun
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.14);
  grad.addColorStop(0, c.glow);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(-size * 0.2, -size * 0.2, size * 0.4, size * 0.4);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  // 3 orbits + planets
  const radii = [0.28, 0.4, 0.5];
  for (let i = 0; i < 3; i++) {
    const r = size * radii[i];
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = c.secondary;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    const a = tick * (0.008 - i * 0.002) + el.phase + i * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2.5 - i * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = c.primary;
    ctx.fill();
  }
  ctx.restore();
}

// 3. Wave Motion
function drawWave(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, c: Colors) {
  const { x, y, size } = el;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const points = 40;
  const wLen = size * 1.2;
  for (let i = 0; i <= points; i++) {
    const px = -wLen / 2 + (wLen / points) * i;
    const py = Math.sin((i / points) * Math.PI * 3 + tick * 0.03 + el.phase) * size * 0.2;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = c.primary;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

// 4. Benzene Ring (C6H6)
function drawBenzene(ctx: CanvasRenderingContext2D, el: ScienceElement, _tick: number, c: Colors) {
  const { x, y, size, rotation } = el;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  const r = size * 0.38;
  const ri = r * 0.65;
  // Outer hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = c.secondary;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Alternating double bonds (inner partial lines on even edges)
  for (let i = 0; i < 6; i += 2) {
    const a1 = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const a2 = (Math.PI * 2 * (i + 1)) / 6 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a1) * ri, Math.sin(a1) * ri);
    ctx.lineTo(Math.cos(a2) * ri, Math.sin(a2) * ri);
    ctx.strokeStyle = c.primary;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  // Carbon nodes
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = c.primary;
    ctx.fill();
  }
  // Label
  ctx.fillStyle = c.glow;
  ctx.font = `bold ${size * 0.16}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("C₆H₆", 0, r + size * 0.18);
  ctx.restore();
}

// 5. Water Molecule (H2O) - 104.5° bond angle
function drawWater(ctx: CanvasRenderingContext2D, el: ScienceElement, _tick: number, c: Colors) {
  const { x, y, size, rotation } = el;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  const bondLen = size * 0.4;
  const halfAngle = (104.5 / 2) * (Math.PI / 180);
  const h1x = -Math.sin(halfAngle) * bondLen;
  const h1y = Math.cos(halfAngle) * bondLen;
  const h2x = Math.sin(halfAngle) * bondLen;
  const h2y = Math.cos(halfAngle) * bondLen;
  // Bonds
  ctx.beginPath();
  ctx.moveTo(h1x, h1y); ctx.lineTo(0, 0); ctx.lineTo(h2x, h2y);
  ctx.strokeStyle = c.secondary;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Oxygen (center)
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  ctx.fillStyle = c.glow;
  ctx.font = `bold ${size * 0.13}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("O", 0, 0);
  // Hydrogens
  for (const [hx, hy] of [[h1x, h1y], [h2x, h2y]]) {
    ctx.beginPath();
    ctx.arc(hx, hy, size * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = c.secondary;
    ctx.fill();
    ctx.fillStyle = c.glow;
    ctx.font = `bold ${size * 0.11}px monospace`;
    ctx.fillText("H", hx, hy);
  }
  ctx.restore();
}

// 6. Molecular Network
function drawNetwork(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, c: Colors) {
  const { x, y, size } = el;
  ctx.save();
  ctx.translate(x, y);
  // 5 nodes in a small cluster
  const nodes: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 + tick * 0.003;
    const r = size * (i % 2 === 0 ? 0.35 : 0.2);
    nodes.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  // Bonds
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j][0] - nodes[i][0], dy = nodes[j][1] - nodes[i][1];
      if (Math.sqrt(dx * dx + dy * dy) < size * 0.5) {
        ctx.beginPath();
        ctx.moveTo(nodes[i][0], nodes[i][1]);
        ctx.lineTo(nodes[j][0], nodes[j][1]);
        ctx.strokeStyle = c.secondary;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
  }
  // Atoms
  for (const [nx, ny] of nodes) {
    ctx.beginPath();
    ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = c.primary;
    ctx.fill();
  }
  ctx.restore();
}

// 7. DNA Double Helix
function drawDNA(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, c: Colors) {
  const { x, y, size, phase } = el;
  ctx.save();
  ctx.translate(x, y);
  const steps = 16;
  const stepH = size * 0.08;
  for (let i = 0; i < steps; i++) {
    const t = tick * 0.015 + phase + i * 0.5;
    const ox = Math.sin(t) * size * 0.3;
    const py = (i - steps / 2) * stepH;
    ctx.beginPath();
    ctx.arc(-ox, py, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = c.primary;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ox, py, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = c.secondary;
    ctx.fill();
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.moveTo(-ox, py);
      ctx.lineTo(ox, py);
      ctx.strokeStyle = c.glow;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }
  ctx.restore();
}

// 8. Neuron Network
function drawNeuron(ctx: CanvasRenderingContext2D, el: ScienceElement, _tick: number, c: Colors) {
  const { x, y, size } = el;
  ctx.save();
  ctx.translate(x, y);
  // Cell body
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  // Dendrites (6 branches)
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 + el.phase;
    const len = size * (0.3 + (i % 2) * 0.15);
    const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(a + 0.3) * len * 0.5,
      Math.sin(a + 0.3) * len * 0.5,
      ex, ey
    );
    ctx.strokeStyle = c.secondary;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Terminal node
    ctx.beginPath();
    ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = c.glow;
    ctx.fill();
  }
  ctx.restore();
}

// 9. Cell Structure
function drawCell(ctx: CanvasRenderingContext2D, el: ScienceElement, _tick: number, c: Colors) {
  const { x, y, size } = el;
  ctx.save();
  ctx.translate(x, y);
  const r = size * 0.4;
  // Cell membrane
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = c.secondary;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Nucleus
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = c.primary;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Small organelles
  const spots: [number, number][] = [[r * 0.55, r * 0.2], [-r * 0.4, -r * 0.5], [r * 0.1, r * 0.6], [-r * 0.6, r * 0.3]];
  for (const [sx, sy] of spots) {
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fillStyle = c.glow;
    ctx.fill();
  }
  ctx.restore();
}

const DRAW_MAP: Record<ScienceElement["type"], (ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, c: Colors) => void> = {
  atom: drawAtom, solar: drawSolar, wave: drawWave,
  benzene: drawBenzene, water: drawWater, network: drawNetwork,
  dna: drawDNA, neuron: drawNeuron, cell: drawCell,
};

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
      const valid = ["morning", "noon", "evening", "night"];
      const active: TimeOfDay = valid.includes(timeOverride) ? (timeOverride as TimeOfDay) : getTimeOfDay();
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
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      for (const el of elements) {
        // Mouse parallax
        if (mx >= 0 && my >= 0 && !isMobile) {
          const dx = el.x - mx, dy = el.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (150 - dist) / 150 * 0.25;
            el.x += (dx / dist) * force;
            el.y += (dy / dist) * force;
          }
        }
        el.x += el.vx + Math.sin(tick * 0.007 + el.phase) * 0.1;
        el.y += el.vy + Math.cos(tick * 0.005 + el.phase) * 0.08;
        el.rotation += el.rotSpeed;
        // Wrap
        if (el.x < -80) el.x = w + 80;
        if (el.x > w + 80) el.x = -80;
        if (el.y < -80) el.y = h + 80;
        if (el.y > h + 80) el.y = -80;

        ctx.globalAlpha = el.opacity;
        DRAW_MAP[el.type](ctx, el, tick, colors);
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(animRef.current);
      else animRef.current = requestAnimationFrame(draw);
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
