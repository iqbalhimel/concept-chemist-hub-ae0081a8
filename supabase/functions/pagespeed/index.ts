import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, strategy = 'mobile' } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&category=seo&category=accessibility&category=best-practices`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'PageSpeed API error' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lighthouse = data.lighthouseResult;
    const categories = lighthouse?.categories || {};
    const audits = lighthouse?.audits || {};

    const result = {
      url: data.id,
      strategy,
      fetchTime: lighthouse?.fetchTime,
      scores: {
        performance: Math.round((categories.performance?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      },
      metrics: {
        lcp: audits['largest-contentful-paint']?.numericValue || 0,
        fcp: audits['first-contentful-paint']?.numericValue || 0,
        cls: audits['cumulative-layout-shift']?.numericValue || 0,
        tbt: audits['total-blocking-time']?.numericValue || 0,
        si: audits['speed-index']?.numericValue || 0,
        tti: audits['interactive']?.numericValue || 0,
      },
      diagnostics: Object.entries(audits)
        .filter(([_, audit]: [string, any]) => audit.score !== null && audit.score < 1 && audit.details?.type === 'opportunity')
        .slice(0, 5)
        .map(([_, audit]: [string, any]) => ({
          title: audit.title,
          description: audit.description,
          score: audit.score,
          savings: audit.details?.overallSavingsMs,
        })),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
