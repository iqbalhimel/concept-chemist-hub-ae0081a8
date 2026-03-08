import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type BrightnessMode = "dark" | "light";

interface BrightnessContextType {
  mode: BrightnessMode;
  toggle: () => void;
}

const BrightnessContext = createContext<BrightnessContextType>({
  mode: "dark",
  toggle: () => {},
});

export const useBrightness = () => useContext(BrightnessContext);

export const BrightnessProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<BrightnessMode>(() => {
    try {
      const saved = localStorage.getItem("brightness-mode");
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
    return "dark";
  });

  useEffect(() => {
    try { localStorage.setItem("brightness-mode", mode); } catch {}
    // Set data attribute so CSS can respond to brightness mode
    document.documentElement.setAttribute("data-brightness", mode);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode(prev => prev === "dark" ? "light" : "dark");
  }, []);

  return (
    <BrightnessContext.Provider value={{ mode, toggle }}>
      {children}
    </BrightnessContext.Provider>
  );
};