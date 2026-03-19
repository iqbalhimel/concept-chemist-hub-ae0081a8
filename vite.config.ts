import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Ensure only one React instance is used across all chunks
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: ["leaflet", "react-leaflet"],
  },
  build: {
    // Raise the warning limit slightly; we control chunking manually
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core (react, react-dom, router, scheduler) intentionally
          // NOT split into a separate chunk — react-dom -> scheduler creates
          // a circular inter-chunk dependency that breaks production init.
          // They fall through to chunk-vendor below.

          // Tanstack Query
          if (id.includes("node_modules/@tanstack/")) {
            return "chunk-query";
          }
          // Framer Motion — used on public pages but large; isolated chunk
          // allows it to be cached independently and loaded in parallel
          if (id.includes("node_modules/framer-motion/")) {
            return "chunk-framer";
          }
          // Supabase client
          if (id.includes("node_modules/@supabase/")) {
            return "chunk-supabase";
          }
          // Radix UI primitives (large set of components)
          if (id.includes("node_modules/@radix-ui/")) {
            return "chunk-radix";
          }
          // Admin-only: Tiptap rich-text editor
          if (id.includes("node_modules/@tiptap/") ||
              id.includes("node_modules/prosemirror")) {
            return "chunk-tiptap";
          }
          // Admin-only: Recharts analytics
          if (id.includes("node_modules/recharts/") ||
              id.includes("node_modules/d3-") ||
              id.includes("node_modules/victory-vendor/")) {
            return "chunk-recharts";
          }
          // Admin-only: DnD-kit drag & drop
          if (id.includes("node_modules/@dnd-kit/")) {
            return "chunk-dndkit";
          }
          // Public/Admin: Leaflet maps (only loaded with ContactSection which is lazy)
          if (id.includes("node_modules/leaflet/") ||
              id.includes("node_modules/react-leaflet/") ||
              id.includes("node_modules/@react-leaflet/")) {
            return "chunk-leaflet";
          }
          // Admin-only: PDF.js viewer
          if (id.includes("node_modules/pdfjs-dist/")) {
            return "chunk-pdfjs";
          }
          // Embla Carousel (public sections, but not above-fold)
          if (id.includes("node_modules/embla-carousel")) {
            return "chunk-carousel";
          }
          // Date utilities
          if (id.includes("node_modules/date-fns/")) {
            return "chunk-datefns";
          }
          // All other node_modules into a general vendor chunk
          if (id.includes("node_modules/")) {
            return "chunk-vendor";
          }
        },
      },
    },
  },
}));
