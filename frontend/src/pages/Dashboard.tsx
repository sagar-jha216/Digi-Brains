import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Calendar, Package, Play, Settings, Sparkles, Clock, CheckCircle2, Clapperboard } from "lucide-react";
import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsAPI, brandsAPI, contentAPI, socialAPI, videosAPI } from "@/lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [brandCount, setBrandCount] = useState(0);

  useEffect(() => {
    Promise.allSettled([
      analyticsAPI.getSummary(),
      contentAPI.list({ limit: 5 }),
      videosAPI.list({ limit: 4 }),
      socialAPI.listScheduled({ status: "scheduled" }),
      brandsAPI.list(),
    ]).then(([a, c, v, s, b]) => {
      if (a.status === "fulfilled") setSummary(a.value.data);
      if (c.status === "fulfilled") setRecentContent(c.value.data);
      if (v.status === "fulfilled") setRecentVideos(v.value.data);
      if (s.status === "fulfilled") setUpcoming(s.value.data.slice(0, 4));
      if (b.status === "fulfilled") setBrandCount(b.value.data.length);
    });
  }, []);

  const stats = [
    { label: "Total Views",      value: summary?.total_views ?? 0,  icon: Play,         color: "text-blue-400",   bg: "bg-blue-500/10" },
    { label: "Total Likes",      value: summary?.total_likes ?? 0,  icon: CheckCircle2, color: "text-rose-400",   bg: "bg-rose-500/10" },
    { label: "Posts Published",  value: summary?.total_posts ?? 0,  icon: BarChart3,    color: "text-green-400",  bg: "bg-green-500/10" },
    { label: "Brands",           value: brandCount,                  icon: Package,      color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  const timeAgo = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    return h < 1 ? "Just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Here's what's happening with your brands.</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <GlassCard key={s.label} className="p-5">
              <div className={`mb-3 inline-flex rounded-lg p-2 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Content */}
          <div className="space-y-6 lg:col-span-2">
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Content</h2>
                <Link to="/generate">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Generate
                  </Button>
                </Link>
              </div>
              {recentContent.length > 0 ? (
                <div className="space-y-3">
                  {recentContent.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="truncate text-sm font-medium">
                          {item.title || `${item.content_type} — ${item.platform}`}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(item.created_at)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs capitalize ${item.status === "approved" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <Sparkles className="mx-auto mb-3 h-10 w-10 opacity-20" />
                  <p className="text-sm">No content yet.</p>
                  <Link to="/generate">
                    <Button size="sm" variant="outline" className="mt-3">Generate First Content</Button>
                  </Link>
                </div>
              )}
            </GlassCard>

            {/* Upcoming Posts */}
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Upcoming Posts</h2>
                <Link to="/schedule">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" /> Schedule
                  </Button>
                </Link>
              </div>
              {upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming.map((post) => (
                    <div key={post.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                      <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize">{post.platform}</p>
                        <p className="truncate text-xs text-muted-foreground">{post.caption || "No caption"}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(post.scheduled_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Calendar className="mx-auto mb-2 h-10 w-10 opacity-20" />
                  <p className="text-sm">No scheduled posts yet.</p>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Video Campaigns</h2>
                <Link to="/videos">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Clapperboard className="h-4 w-4" /> Video Studio
                  </Button>
                </Link>
              </div>
              {recentVideos.length > 0 ? (
                <div className="space-y-3">
                  {recentVideos.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground capitalize">
                          {item.platform} • {item.render_status.replace(/_/g, " ")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(item.created_at)}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-200">
                        {item.video_style}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Clapperboard className="mx-auto mb-2 h-10 w-10 opacity-20" />
                  <p className="text-sm">No video campaigns yet.</p>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { to: "/generate",  icon: Sparkles,    label: "Generate Content",  color: "text-primary" },
                  { to: "/videos",    icon: Clapperboard, label: "Build Video Ad",   color: "text-cyan-400" },
                  { to: "/products",  icon: Package,     label: "Manage Products",   color: "text-purple-400" },
                  { to: "/schedule",  icon: Calendar,    label: "Schedule a Post",   color: "text-amber-400" },
                  { to: "/analytics", icon: BarChart3,   label: "View Analytics",    color: "text-blue-400" },
                  { to: "/settings",  icon: Settings,    label: "Brand Settings",    color: "text-green-400" },
                ].map(({ to, icon: Icon, label, color }) => (
                  <Link key={to} to={to} className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Icon className={`h-4 w-4 ${color}`} /> {label}
                    </Button>
                  </Link>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-primary/20">
              <h3 className="mb-2 font-semibold">🎯 Pro Tip</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Upload strong product photos in Products, then use Video Studio to turn them into launch-ready ad concepts.
              </p>
              <Link to="/videos">
                <Button size="sm" className="w-full">Open Video Studio</Button>
              </Link>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}
