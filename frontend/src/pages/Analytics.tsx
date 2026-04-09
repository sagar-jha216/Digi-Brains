import { useEffect, useState } from "react";
import { BarChart3, Eye, Heart, MessageSquare, Share2, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyticsAPI, brandsAPI } from "@/lib/api";

export default function Analytics() {
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState("all");
  const [summary, setSummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { brandsAPI.list().then((r) => setBrands(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const id = brandId !== "all" ? Number(brandId) : undefined;
    Promise.allSettled([analyticsAPI.getSummary(id), analyticsAPI.getTimeline({ brand_id: id, days: 30 })])
      .then(([s, t]) => {
        if (s.status === "fulfilled") setSummary(s.value.data);
        if (t.status === "fulfilled") setTimeline(t.value.data);
      })
      .finally(() => setLoading(false));
  }, [brandId]);

  const stats = summary ? [
    { icon: Eye,           label: "Total Views",    value: summary.total_views,    bg: "bg-blue-500/10",   color: "text-blue-400" },
    { icon: Heart,         label: "Total Likes",    value: summary.total_likes,    bg: "bg-rose-500/10",   color: "text-rose-400" },
    { icon: MessageSquare, label: "Comments",       value: summary.total_comments, bg: "bg-purple-500/10", color: "text-purple-400" },
    { icon: Share2,        label: "Shares",         value: summary.total_shares,   bg: "bg-green-500/10",  color: "text-green-400" },
    { icon: BarChart3,     label: "Total Posts",    value: summary.total_posts,    bg: "bg-amber-500/10",  color: "text-amber-400" },
    { icon: TrendingUp,    label: "Avg Engagement", value: `${(summary.avg_engagement_rate || 0).toFixed(2)}%`, bg: "bg-cyan-500/10", color: "text-cyan-400" },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="mt-1 text-muted-foreground">Track performance across all platforms</p>
          </div>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground animate-pulse">Loading analytics...</div>
        ) : summary ? (
          <div className="space-y-6">
            {summary.performance_label && (
              <GlassCard className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold capitalize">{summary.performance_label} performance</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {summary.top_platform
                        ? `Your strongest platform right now is ${summary.top_platform}.`
                        : "Keep publishing to build enough signal for optimization."}
                    </p>
                  </div>
                  <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                    {(summary.avg_engagement_rate || 0).toFixed(2)}% avg engagement
                  </div>
                </div>
                {summary.recommendations?.length > 0 && (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {summary.recommendations.map((item: string) => (
                      <div key={item} className="rounded-xl bg-white/5 p-4 text-sm text-muted-foreground">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {summary.top_creatives?.length > 0 && (
              <GlassCard className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Top Creative Variants</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {summary.top_creatives.map((item: any) => (
                    <div key={`${item.title}-${item.platform}`} className="rounded-xl bg-white/5 p-4">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.platform}</p>
                      <p className="mt-3 text-sm text-muted-foreground">{item.views?.toLocaleString?.() ?? item.views} views</p>
                      <p className="mt-1 text-sm text-cyan-200">{Number(item.engagement_rate || 0).toFixed(2)}% engagement</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {stats.map((s) => (
                <GlassCard key={s.label} className="p-4">
                  <div className={`mb-3 inline-flex rounded-lg p-2 ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </GlassCard>
              ))}
            </div>

            {/* Platform breakdown */}
            {summary.platforms && Object.keys(summary.platforms).length > 0 && (
              <GlassCard className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Platform Breakdown</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(summary.platforms).map(([platform, data]: [string, any]) => (
                    <div key={platform} className="rounded-lg bg-white/5 p-4">
                      <p className="mb-1 font-medium capitalize">{platform}</p>
                      <p className="text-sm text-muted-foreground">{data.posts} posts · {(data.views || 0).toLocaleString()} views · {(data.likes || 0).toLocaleString()} likes</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Timeline */}
            {timeline.length > 0 && (
              <GlassCard className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Post Activity (Last 30 Days)</h2>
                <div className="space-y-2">
                  {timeline.slice(0, 15).map((row, i) => (
                    <div key={i} className="flex items-center gap-4 text-xs">
                      <span className="w-24 text-muted-foreground">{row.date}</span>
                      <span className="w-20 capitalize font-medium">{row.platform}</span>
                      <div className="flex-1 rounded-full bg-muted h-2">
                        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.min(row.posts * 25, 100)}%` }} />
                      </div>
                      <span className="w-4 text-right text-muted-foreground">{row.posts}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        ) : (
          <GlassCard className="p-16 text-center">
            <BarChart3 className="mx-auto mb-4 h-16 w-16 opacity-20" />
            <h3 className="mb-2 text-lg font-semibold">No analytics yet</h3>
            <p className="text-sm text-muted-foreground">Start posting content to see performance data here.</p>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
