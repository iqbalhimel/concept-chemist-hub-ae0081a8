import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SeoFields {
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  seo_canonical_url?: string | null;
  seo_og_title?: string | null;
  seo_og_description?: string | null;
  seo_og_image?: string | null;
  seo_twitter_title?: string | null;
  seo_twitter_description?: string | null;
  seo_twitter_image?: string | null;
}

interface Props {
  values: SeoFields;
  onChange: (field: string, value: string) => void;
  defaultCanonical?: string;
}

const SeoFieldsPanel = ({ values, onChange, defaultCanonical }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
      >
        <span>🔍 SEO Overrides</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Leave blank to use global SEO defaults. Fill in to override per page.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Meta Title</label>
              <Input value={values.seo_title || ""} onChange={e => onChange("seo_title", e.target.value)} placeholder="Custom page title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Meta Keywords</label>
              <Input value={values.seo_keywords || ""} onChange={e => onChange("seo_keywords", e.target.value)} placeholder="keyword1, keyword2" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Meta Description</label>
            <Textarea value={values.seo_description || ""} onChange={e => onChange("seo_description", e.target.value)} placeholder="Custom page description" rows={2} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Canonical URL
              {defaultCanonical && (
                <span className="text-muted-foreground/60 ml-1">default: {defaultCanonical}</span>
              )}
            </label>
            <Input value={values.seo_canonical_url || ""} onChange={e => onChange("seo_canonical_url", e.target.value)} placeholder={defaultCanonical || "https://iqbalsir.bd/..."} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">OG Title</label>
              <Input value={values.seo_og_title || ""} onChange={e => onChange("seo_og_title", e.target.value)} placeholder="Falls back to Meta Title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">OG Image URL</label>
              <Input value={values.seo_og_image || ""} onChange={e => onChange("seo_og_image", e.target.value)} placeholder="Falls back to global OG image" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">OG Description</label>
            <Textarea value={values.seo_og_description || ""} onChange={e => onChange("seo_og_description", e.target.value)} placeholder="Falls back to Meta Description" rows={2} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Twitter Title</label>
              <Input value={values.seo_twitter_title || ""} onChange={e => onChange("seo_twitter_title", e.target.value)} placeholder="Falls back to OG Title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Twitter Image URL</label>
              <Input value={values.seo_twitter_image || ""} onChange={e => onChange("seo_twitter_image", e.target.value)} placeholder="Falls back to OG Image" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Twitter Description</label>
            <Textarea value={values.seo_twitter_description || ""} onChange={e => onChange("seo_twitter_description", e.target.value)} placeholder="Falls back to OG Description" rows={2} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoFieldsPanel;
