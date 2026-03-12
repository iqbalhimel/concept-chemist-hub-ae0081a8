import { usePerformanceSettings } from "@/hooks/usePerformanceSettings";

/**
 * Component that applies performance settings globally.
 * Must be rendered inside the app tree (after QueryClientProvider).
 */
const PerformanceApplier = () => {
  usePerformanceSettings();
  return null;
};

export default PerformanceApplier;
