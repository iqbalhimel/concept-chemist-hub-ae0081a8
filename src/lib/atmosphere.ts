export type TimeOfDay = "morning" | "noon" | "evening" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";

export function getTimeOfDay(hour?: number): TimeOfDay {
  const h = hour ?? new Date().getHours();
  if (h >= 5 && h <= 10) return "morning";
  if (h >= 11 && h <= 15) return "noon";
  if (h >= 16 && h <= 18) return "evening";
  return "night";
}

export function getSeason(month?: number): Season {
  const m = month ?? new Date().getMonth(); // 0-indexed
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

export const timeGradients: Record<TimeOfDay, string> = {
  morning:
    "radial-gradient(ellipse at 30% 30%, hsla(30,90%,65%,0.25), transparent 55%), " +
    "radial-gradient(ellipse at 70% 60%, hsla(45,85%,70%,0.18), transparent 55%), " +
    "linear-gradient(170deg, hsla(30,80%,60%,0.12) 0%, hsla(45,80%,70%,0.10) 40%, hsla(200,70%,75%,0.08) 100%)",
  noon:
    "radial-gradient(ellipse at 50% 20%, hsla(200,80%,70%,0.20), transparent 55%), " +
    "radial-gradient(ellipse at 60% 70%, hsla(180,70%,75%,0.12), transparent 55%), " +
    "linear-gradient(180deg, hsla(210,80%,70%,0.10) 0%, hsla(190,70%,80%,0.08) 50%, hsla(0,0%,100%,0.05) 100%)",
  evening:
    "radial-gradient(ellipse at 25% 40%, hsla(20,85%,60%,0.22), transparent 55%), " +
    "radial-gradient(ellipse at 75% 50%, hsla(330,70%,65%,0.18), transparent 55%), " +
    "linear-gradient(160deg, hsla(25,80%,60%,0.12) 0%, hsla(340,70%,60%,0.10) 50%, hsla(270,60%,55%,0.08) 100%)",
  night:
    "radial-gradient(ellipse at 30% 25%, hsla(240,60%,30%,0.20), transparent 55%), " +
    "radial-gradient(ellipse at 70% 70%, hsla(270,50%,25%,0.18), transparent 55%), " +
    "linear-gradient(180deg, hsla(230,60%,15%,0.12) 0%, hsla(260,50%,18%,0.10) 50%, hsla(240,60%,12%,0.08) 100%)",
};

export const seasonTints: Record<Season, string> = {
  spring: "hsla(140,60%,55%,0.06)",
  summer: "hsla(45,80%,60%,0.06)",
  autumn: "hsla(30,70%,50%,0.07)",
  winter: "hsla(210,50%,70%,0.06)",
};
