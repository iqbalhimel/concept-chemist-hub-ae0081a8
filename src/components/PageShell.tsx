import type { ReactNode } from "react";

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid" />
      </div>
      {children}
    </div>
  );
}

