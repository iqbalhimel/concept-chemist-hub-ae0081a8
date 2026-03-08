import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
  title?: string;
}

const SCALE_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const PdfViewer = ({ url, title }: PdfViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scaleIndex, setScaleIndex] = useState(2); // default 1x
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rendering, setRendering] = useState(false);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setPdf(null);
    setCurrentPage(1);

    pdfjsLib.getDocument(url).promise.then(
      (doc) => {
        if (cancelled) return;
        setPdf(doc);
        setTotalPages(doc.numPages);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      }
    );

    return () => { cancelled = true; };
  }, [url]);

  // Auto-fit scale on load
  useEffect(() => {
    if (!pdf || !containerRef.current) return;
    pdf.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = containerRef.current?.clientWidth || 600;
      const fitScale = (containerWidth - 32) / viewport.width;
      // Pick closest scale step
      let bestIdx = 0;
      let bestDiff = Infinity;
      SCALE_STEPS.forEach((s, i) => {
        const diff = Math.abs(s - fitScale);
        if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
      });
      setScaleIndex(bestIdx);
    });
  }, [pdf]);

  // Render page
  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current) return;
    if (rendering) {
      renderTaskRef.current?.cancel();
    }
    setRendering(true);

    try {
      const page = await pdf.getPage(currentPage);
      const scale = SCALE_STEPS[scaleIndex];
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * dpr });

      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      const ctx = canvas.getContext("2d")!;
      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.warn("PDF render error:", err);
      }
    } finally {
      setRendering(false);
    }
  }, [pdf, currentPage, scaleIndex]);

  useEffect(() => { renderPage(); }, [renderPage]);

  const goPage = (delta: number) => {
    setCurrentPage(p => Math.max(1, Math.min(totalPages, p + delta)));
  };

  const zoom = (delta: number) => {
    setScaleIndex(i => Math.max(0, Math.min(SCALE_STEPS.length - 1, i + delta)));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <AlertTriangle size={48} className="text-muted-foreground/40" />
        <p className="text-muted-foreground">Unable to preview this PDF.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Download size={14} /> Download instead
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 border-b border-border bg-muted/30 flex-shrink-0 flex-wrap">
        <Button size="sm" variant="ghost" className="h-8 px-2" disabled={currentPage <= 1} onClick={() => goPage(-1)}>
          <ChevronLeft size={16} />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[80px] text-center">
          Page {currentPage} / {totalPages}
        </span>
        <Button size="sm" variant="ghost" className="h-8 px-2" disabled={currentPage >= totalPages} onClick={() => goPage(1)}>
          <ChevronRight size={16} />
        </Button>

        <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

        <Button size="sm" variant="ghost" className="h-8 px-2" disabled={scaleIndex <= 0} onClick={() => zoom(-1)}>
          <ZoomOut size={16} />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[40px] text-center">
          {Math.round(SCALE_STEPS[scaleIndex] * 100)}%
        </span>
        <Button size="sm" variant="ghost" className="h-8 px-2" disabled={scaleIndex >= SCALE_STEPS.length - 1} onClick={() => zoom(1)}>
          <ZoomIn size={16} />
        </Button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/20">
        <div className="flex justify-center p-4 min-h-full">
          <canvas
            ref={canvasRef}
            className="shadow-lg rounded-sm"
            style={{ maxWidth: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
