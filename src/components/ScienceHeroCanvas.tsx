import { useEffect, useRef } from "react";
import { getTimeOfDay, timeColors, type TimeOfDay } from "@/lib/atmosphere";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// All platforms: free-roaming motion

interface ScienceElement {
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  vx: number;
  vy: number;
  type: "atom" | "solar" | "wave" | "benzene" | "water" | "network" | "dna" | "neuron" | "cell";
  size: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  phase: number;
  floatRadius: number;
}

function rand(a: number, b: number) { return a + Math.random() * (b - a); }

const ELEMENT_TYPES: ScienceElement["type"][] = [
  "atom", "solar", "wave", "benzene", "water", "network", "dna", "neuron", "cell"
];

const BIOLOGY_TYPES = new Set<ScienceElement["type"]>(["dna", "neuron", "cell"]);

// Fixed 3x3 grid placement for all 9 elements
// Row 0: solar(top-left), atom(top-center), dna(top-right)
// Row 1: wave(mid-left), network(center), benzene(mid-right)
// Row 2: water(bot-left), cell(bot-center), neuron(bot-right)
const PLACEMENT_ORDER: ScienceElement["type"][] = [
  "solar", "atom", "dna",
  "wave", "network", "benzene",
  "water", "cell", "neuron",
];

// Mobile: 6 specific elements: solar, atom, benzene, dna, water, neuron
const MOBILE_TYPES: ScienceElement["type"][] = ["solar", "atom", "benzene", "dna", "water", "neuron"];
const MOBILE_INDICES = [0, 1, 5, 2, 6, 8]; // indices into PLACEMENT_ORDER for grid fallback

function createElement(w: number, h: number, gridIndex: number): ScienceElement {
  const type = PLACEMENT_ORDER[gridIndex];
  const isBio = BIOLOGY_TYPES.has(type);

  const mx = 50;
  const my = 50;
  const baseSize = isBio ? rand(72, 88) : rand(55, 72);

  // Distribute starting positions in a 3x3 grid with jitter
  const col = gridIndex % 3;
  const row = Math.floor(gridIndex / 3);
  const cellW = (w - mx * 2) / 3;
  const cellH = (h - my * 2) / 3;
  const startX = mx + cellW * col + rand(cellW * 0.25, cellW * 0.75);
  const startY = my + cellH * row + rand(cellH * 0.25, cellH * 0.75);

  const speed = rand(0.2, 0.4);
  const angle = rand(0, Math.PI * 2);

  return {
    x: startX,
    y: startY,
    anchorX: startX,
    anchorY: startY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    type,
    size: baseSize,
    rotation: rand(0, 360),
    rotSpeed: isBio ? rand(-0.12, 0.12) : rand(-0.2, 0.2),
    opacity: isBio ? rand(0.55, 0.72) : rand(0.38, 0.58),
    phase: rand(0, Math.PI * 2),
    floatRadius: rand(18, 35),
  };
}

function createMobileElement(w: number, h: number, type: ScienceElement["type"], index: number, total: number): ScienceElement {
  const isBio = BIOLOGY_TYPES.has(type);
  const mx = 50;
  const my = 50;

  // Distribute starting positions evenly using a 2x3 grid
  const col = index % 2;
  const row = Math.floor(index / 2);
  const cellW = (w - mx * 2) / 2;
  const cellH = (h - my * 2) / 3;
  const startX = mx + cellW * col + rand(cellW * 0.3, cellW * 0.7);
  const startY = my + cellH * row + rand(cellH * 0.3, cellH * 0.7);

  const speed = rand(0.2, 0.4);
  const angle = rand(0, Math.PI * 2);
  const baseSize = isBio ? rand(72, 88) : rand(55, 72);

  return {
    x: startX,
    y: startY,
    anchorX: startX,
    anchorY: startY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    type,
    size: baseSize,
    rotation: rand(0, 360),
    rotSpeed: isBio ? rand(-0.12, 0.12) : rand(-0.2, 0.2),
    opacity: isBio ? rand(0.55, 0.72) : rand(0.38, 0.58),
    phase: rand(0, Math.PI * 2),
    floatRadius: rand(18, 35),
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

// 2. Solar System Orbit — 8 planets
function drawSolar(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, c: Colors) {
  const { x, y, size } = el;
  ctx.save();
  ctx.translate(x, y);
  // Sun with glow
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.18);
  grad.addColorStop(0, c.glow);
  grad.addColorStop(0.6, c.primary);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  // 8 orbit paths + planets with varying sizes
  const radii = [0.15, 0.2, 0.25, 0.3, 0.36, 0.42, 0.47, 0.52];
  const planetSizes = [1.2, 1.5, 1.8, 1.6, 2.8, 2.4, 2.0, 1.8];
  const speeds = [0.018, 0.014, 0.011, 0.009, 0.006, 0.0045, 0.003, 0.002];
  for (let i = 0; i < 8; i++) {
    const r = size * radii[i];
    // Orbit path
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = c.secondary;
    ctx.lineWidth = 0.4;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Planet
    const a = tick * speeds[i] + el.phase + i * 0.8;
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    ctx.beginPath();
    ctx.arc(px, py, planetSizes[i], 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? c.primary : c.glow;
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

// 8. Neuron — soma, dendrites, axon with signal pulse
function drawNeuron(ctx: CanvasRenderingContext2D, el: ScienceElement, tick: number, c: Colors) {
  const { x, y, size } = el;
  ctx.save();
  ctx.translate(x, y);

  // Axon — long extension to the right
  const axonLen = size * 0.55;
  const axonAngle = el.phase + 0.3;
  const axEndX = Math.cos(axonAngle) * axonLen;
  const axEndY = Math.sin(axonAngle) * axonLen;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(axEndX, axEndY);
  ctx.strokeStyle = c.secondary;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Axon terminal branches
  for (let b = 0; b < 3; b++) {
    const spread = (b - 1) * 0.4;
    const bx = axEndX + Math.cos(axonAngle + spread) * size * 0.12;
    const by = axEndY + Math.sin(axonAngle + spread) * size * 0.12;
    ctx.beginPath();
    ctx.moveTo(axEndX, axEndY);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = c.secondary;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = c.glow;
    ctx.fill();
  }

  // Signal pulse along axon
  const pulseT = ((tick * 0.02 + el.phase) % 1);
  const pulseX = pulseT * axEndX;
  const pulseY = pulseT * axEndY;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = c.glow;
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Soma (cell body)
  const somaR = size * 0.14;
  ctx.beginPath();
  ctx.arc(0, 0, somaR, 0, Math.PI * 2);
  ctx.fillStyle = c.primary;
  ctx.fill();
  ctx.strokeStyle = c.glow;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Dendrites — 5 branching extensions opposite the axon
  for (let i = 0; i < 5; i++) {
    const base = axonAngle + Math.PI; // opposite side
    const spread = (i - 2) * 0.45;
    const a = base + spread;
    const len1 = size * (0.22 + (i % 2) * 0.1);
    const mx1 = Math.cos(a) * len1, my1 = Math.sin(a) * len1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(a + 0.2) * len1 * 0.6,
      Math.sin(a + 0.2) * len1 * 0.6,
      mx1, my1
    );
    ctx.strokeStyle = c.secondary;
    ctx.lineWidth = 1.0;
    ctx.stroke();
    // Sub-branch
    const subA = a + (i % 2 === 0 ? 0.5 : -0.5);
    const subLen = size * 0.1;
    ctx.beginPath();
    ctx.moveTo(mx1, my1);
    ctx.lineTo(mx1 + Math.cos(subA) * subLen, my1 + Math.sin(subA) * subLen);
    ctx.strokeStyle = c.secondary;
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // Terminal
    ctx.beginPath();
    ctx.arc(mx1, my1, 1.5, 0, Math.PI * 2);
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

    // Create elements: all 9 on desktop, 6 specific on mobile
    const elements: ScienceElement[] = isMobile
      ? MOBILE_TYPES.map((type, i) => createMobileElement(w, h, type, i, MOBILE_TYPES.length))
      : Array.from({ length: 9 }, (_, i) => createElement(w, h, i));
    let tick = 0;

    const MIN_DIST = 80; // minimum distance between mobile elements

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

      // Render in layer order: physics → chemistry → biology (on top)
      const sorted = [...elements].sort((a, b) => {
        const order = (e: ScienceElement) => BIOLOGY_TYPES.has(e.type) ? 2 : (["benzene","water","network"].includes(e.type) ? 1 : 0);
        return order(a) - order(b);
      });

      for (const el of sorted) {
        if (isMobile) {
          // Free-roaming: update position with velocity
          el.x += el.vx;
          el.y += el.vy;

          // Boundary bounce with margin
          const margin = el.size * 0.5 + 10;
          if (el.x < margin) { el.x = margin; el.vx = Math.abs(el.vx); }
          if (el.x > w - margin) { el.x = w - margin; el.vx = -Math.abs(el.vx); }
          if (el.y < margin) { el.y = margin; el.vy = Math.abs(el.vy); }
          if (el.y > h - margin) { el.y = h - margin; el.vy = -Math.abs(el.vy); }

          // Gentle repulsion from other elements
          for (const other of elements) {
            if (other === el) continue;
            const dx = el.x - other.x;
            const dy = el.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MIN_DIST && dist > 0) {
              const force = (MIN_DIST - dist) / MIN_DIST * 0.05;
              el.vx += (dx / dist) * force;
              el.vy += (dy / dist) * force;
            }
          }

          // Clamp speed
          const speed = Math.sqrt(el.vx * el.vx + el.vy * el.vy);
          const maxSpeed = 0.5;
          const minSpeed = 0.15;
          if (speed > maxSpeed) { el.vx = (el.vx / speed) * maxSpeed; el.vy = (el.vy / speed) * maxSpeed; }
          if (speed < minSpeed) { el.vx = (el.vx / speed) * minSpeed; el.vy = (el.vy / speed) * minSpeed; }

          // Slight random direction drift for natural motion
          if (tick % 60 === 0) {
            el.vx += rand(-0.05, 0.05);
            el.vy += rand(-0.05, 0.05);
          }
        } else {
          // Desktop: bounded floating around anchor
          const t = tick * 0.008 + el.phase;
          el.x = el.anchorX + Math.sin(t) * el.floatRadius;
          el.y = el.anchorY + Math.cos(t * 0.7) * el.floatRadius * 0.7;
        }
        el.rotation += el.rotSpeed;

        // Gentle mouse parallax (shift, don't displace permanently)
        let drawX = el.x, drawY = el.y;
        if (mx >= 0 && my >= 0 && !isMobile) {
          const dx = el.x - mx, dy = el.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 0) {
            const force = (180 - dist) / 180 * 6;
            drawX += (dx / dist) * force;
            drawY += (dy / dist) * force;
          }
        }

        // Temporarily set position for drawing
        const origX = el.x, origY = el.y;
        el.x = drawX;
        el.y = drawY;

        // Biology elements get subtle glow
        const isBio = BIOLOGY_TYPES.has(el.type);
        if (isBio) {
          ctx.shadowColor = colors.glow;
          ctx.shadowBlur = 8;
        }
        ctx.globalAlpha = el.opacity;
        DRAW_MAP[el.type](ctx, el, tick, colors);
        if (isBio) {
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }

        // Restore actual position
        el.x = origX;
        el.y = origY;
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
