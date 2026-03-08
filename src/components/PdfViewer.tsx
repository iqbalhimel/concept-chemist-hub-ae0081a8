import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertTriangle, Download, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
  title?: string;
}

const SCALE_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const THUMB_WIDTH = 120;

const PdfViewer = ({ url, title }: PdfViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbContainerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scaleIndex, setScaleIndex] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [showThumbs, setShowThumbs] = useState(false);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const isMobile = useIsMobile();

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setPdf(null);
    setCurrentPage(1);
    setThumbs([]);

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

  // Auto-fit scale & default sidebar state
  useEffect(() => {
    if (!pdf || !containerRef.current) return;
    setShowThumbs(!isMobile && pdf.numPages > 1);
    pdf.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = containerRef.current?.clientWidth || 600;
      const fitScale = (containerWidth - 32) / viewport.width;
      let bestIdx = 0;
      let bestDiff = Infinity;
      SCALE_STEPS.forEach((s, i) => {
        const diff = Math.abs(s - fitScale);
        if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
      });
      setScaleIndex(bestIdx);
    });
  }, [pdf, isMobile]);

  // Generate thumbnails
  useEffect(() => {
    if (!pdf || totalPages === 0) return;
    let cancelled = false;

    const generate = async () => {
      const urls: string[] = [];
      for (let i = 1; i <= totalPages; i++) {
        if (cancelled) return;
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        const scale = THUMB_WIDTH / vp.width;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        urls.push(canvas.toDataURL("image/jpeg", 0.6));
      }
      if (!cancelled) setThumbs(urls);
    };

    generate();
    return () => { cancelled = true; };
  }, [pdf, totalPages]);

  // Scroll active thumb into view
  useEffect(() => {
    if (!showThumbs || !thumbContainerRef.current) return;
    const el = thumbContainerRef.current.querySelector(`[data-page="${currentPage}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentPage, showThumbs]);

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
        {totalPages > 1 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => setShowThumbs(v => !v)}
            title={showThumbs ? "Hide thumbnails" : "Show thumbnails"}
          >
            {showThumbs ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </Button>
        )}

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

      {/* Main area with optional thumbnail sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnail sidebar */}
        {showThumbs && (
          <div
            ref={thumbContainerRef}
            className="w-[140px] flex-shrink-0 overflow-y-auto border-r border-border bg-muted/40 p-2 space-y-2"
          >
            {thumbs.length > 0 ? (
              thumbs.map((src, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    data-page={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`block w-full rounded-md overflow-hidden border-2 transition-all ${
                      isActive
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-transparent hover:border-muted-foreground/20"
                    }`}
                  >
                    <img src={src} alt={`Page ${pageNum}`} className="w-full h-auto" />
                    <span className={`block text-[10px] py-0.5 text-center ${
                      isActive ? "text-primary font-semibold" : "text-muted-foreground"
                    }`}>
                      {pageNum}
                    </span>
                  </button>
                );
              })
            ) : (
              Array.from({ length: totalPages }, (_, i) => (
                <div key={i} className="w-full aspect-[3/4] rounded-md bg-muted animate-pulse" />
              ))
            )}
          </div>
        )}

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
    </div>
  );
};

export default PdfViewer;
