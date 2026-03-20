import { useEffect, useRef } from "react";
import { getTimeOfDay, timeColors, type TimeOfDay } from "@/lib/atmosphere";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/* ================= TYPES ================= */

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
"atom","solar","wave","benzene","water","network","dna","neuron","cell"
];

const BIOLOGY_TYPES = new Set<ScienceElement["type"]>(["dna","neuron","cell"]);

type Colors = typeof timeColors.morning;

/* ================= MAIN COMPONENT ================= */

const ScienceHeroCanvas = () => {
const canvasRef = useRef<HTMLCanvasElement>(null);
const animRef = useRef<number>(0);
const mouseRef = useRef({ x: -1, y: -1 });
const { get } = useSiteSettings();
const timeOverride = get("atmosphere","time_override","");

useEffect(() => {
const canvas = canvasRef.current;
if (!canvas) return;

```
const ctx = canvas.getContext("2d",{ alpha:true });
if (!ctx) return;

const isMobile = window.innerWidth < 768;
const dpr = Math.min(window.devicePixelRatio || 1,2);

let w = canvas.offsetWidth;
let h = canvas.offsetHeight;

const resize = () => {
  w = canvas.offsetWidth;
  h = canvas.offsetHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
};
resize();

/* ================= 🔥 PERFORMANCE FIX ================= */

let last = 0;
const FPS = 30;

let isScrolling = false;
let scrollTimer: any;

const onScroll = () => {
  isScrolling = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    isScrolling = false;
  },120);
};

window.addEventListener("scroll", onScroll, { passive: true });

/* ================= COLORS CACHE ================= */

let cachedColors =
  timeColors[
    (["morning","noon","evening","night"].includes(timeOverride)
      ? (timeOverride as TimeOfDay)
      : getTimeOfDay())
  ];

let colorsCachedAt = Date.now();

const getColors = () => {
  const now = Date.now();
  if (now - colorsCachedAt > 60000) {
    const active: TimeOfDay = ["morning","noon","evening","night"].includes(timeOverride)
      ? (timeOverride as TimeOfDay)
      : getTimeOfDay();
    cachedColors = timeColors[active];
    colorsCachedAt = now;
  }
  return cachedColors;
};

/* ================= SIMPLE ELEMENTS ================= */

const elements: ScienceElement[] = Array.from({ length: isMobile ? 6 : 9 }).map((_, i) => ({
  x: rand(50, w - 50),
  y: rand(50, h - 50),
  anchorX: 0,
  anchorY: 0,
  vx: rand(-0.3, 0.3),
  vy: rand(-0.3, 0.3),
  type: ELEMENT_TYPES[i],
  size: rand(50, 80),
  rotation: rand(0, 360),
  rotSpeed: rand(-0.2, 0.2),
  opacity: rand(0.4, 0.7),
  phase: rand(0, Math.PI * 2),
  floatRadius: rand(20, 40),
}));

let tick = 0;

const draw = (time = 0) => {
  /* 🔥 FPS CONTROL */
  if (time - last < 1000 / FPS) {
    animRef.current = requestAnimationFrame(draw);
    return;
  }
  last = time;

  /* 🔥 SCROLL PAUSE */
  if (isScrolling) {
    animRef.current = requestAnimationFrame(draw);
    return;
  }

  tick += 0.6;

  const colors = getColors();
  ctx.clearRect(0,0,w,h);

  for (const el of elements) {
    el.x += el.vx;
    el.y += el.vy;

    if (el.x < 20 || el.x > w - 20) el.vx *= -1;
    if (el.y < 20 || el.y > h - 20) el.vy *= -1;

    el.rotation += el.rotSpeed;

    const isBio = BIOLOGY_TYPES.has(el.type);

    /* 🔥 SHADOW FIX */
    if (isBio && !isMobile) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 6;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = el.opacity;

    ctx.beginPath();
    ctx.arc(el.x, el.y, el.size * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = colors.primary;
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  animRef.current = requestAnimationFrame(draw);
};

const onVisibility = () => {
  if (document.hidden) cancelAnimationFrame(animRef.current);
  else animRef.current = requestAnimationFrame(draw);
};

window.addEventListener("resize", resize);
document.addEventListener("visibilitychange", onVisibility);

animRef.current = requestAnimationFrame(draw);

return () => {
  cancelAnimationFrame(animRef.current);
  window.removeEventListener("resize", resize);
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("scroll", onScroll);
};
```

}, [timeOverride]);

return (
<canvas
ref={canvasRef}
className="absolute inset-0 w-full h-full pointer-events-none"
style={{ zIndex: 1 }}
/>
);
};

export default ScienceHeroCanvas;
