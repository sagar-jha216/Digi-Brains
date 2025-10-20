import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Eye, ThumbsUp, MousePointer, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

const Analytics = () => {
  const kpis = [
    { label: "Total Videos", value: "24", change: "+12%", icon: Eye, trend: "up" },
    { label: "Total Views", value: "45.2K", change: "+23%", icon: Eye, trend: "up" },
    { label: "Engagement Rate", value: "8.4%", change: "+2.1%", icon: ThumbsUp, trend: "up" },
    { label: "Click-Through Rate", value: "3.2%", change: "-0.3%", icon: MousePointer, trend: "down" },
  ];

  const topVideos = [
    { title: "Smart Watch Pro Launch", views: "12.5K", engagement: "9.2%", platform: "YouTube" },
    { title: "Summer Sale Campaign", views: "8.3K", engagement: "7.8%", platform: "Instagram" },
    { title: "Product Demo Video", views: "6.1K", engagement: "6.5%", platform: "LinkedIn" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your video performance and insights</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, index) => (
            <GlassCard 
              key={kpi.label} 
              className="p-6 animate-scale-in" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <kpi.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  kpi.trend === "up" ? "text-primary" : "text-destructive"
                }`}>
                  {kpi.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {kpi.change}
                </div>
              </div>
              <p className="text-2xl font-bold mb-1">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </GlassCard>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Views Chart */}
          <GlassCard className="p-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Views Over Time</h2>
            <div className="h-64 bg-gradient-hero rounded-lg flex items-end justify-around p-4 gap-2">
              {[45, 68, 52, 78, 85, 92, 88].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-primary rounded-t transition-all hover:opacity-80 cursor-pointer"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Platform Stats */}
          <GlassCard className="p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-xl font-semibold mb-4">Platform Distribution</h2>
            <div className="space-y-4">
              {[
                { platform: "YouTube", percentage: 45, color: "bg-red-500" },
                { platform: "Instagram", percentage: 30, color: "bg-pink-500" },
                { platform: "LinkedIn", percentage: 15, color: "bg-blue-600" },
                { platform: "TikTok", percentage: 10, color: "bg-black" },
              ].map((item) => (
                <div key={item.platform}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.platform}</span>
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Top Performing Videos */}
          <GlassCard className="p-6 lg:col-span-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-xl font-semibold mb-4">Top Performing Videos</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Video Title</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Views</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Engagement</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Platform</th>
                  </tr>
                </thead>
                <tbody>
                  {topVideos.map((video, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="py-4 px-4 font-medium">{video.title}</td>
                      <td className="py-4 px-4">{video.views}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-sm">
                          {video.engagement}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{video.platform}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* AI Insights */}
          <GlassCard className="p-6 lg:col-span-2 bg-gradient-hero border-primary/20 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-xl font-semibold mb-4">🤖 AI Insights</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-background/60 rounded-lg">
                <p className="text-sm font-medium mb-2">Best Posting Time</p>
                <p className="text-2xl font-bold mb-1">2:00 PM</p>
                <p className="text-xs text-muted-foreground">Weekdays</p>
              </div>
              <div className="p-4 bg-background/60 rounded-lg">
                <p className="text-sm font-medium mb-2">Optimal Video Length</p>
                <p className="text-2xl font-bold mb-1">45 sec</p>
                <p className="text-xs text-muted-foreground">Based on engagement</p>
              </div>
              <div className="p-4 bg-background/60 rounded-lg">
                <p className="text-sm font-medium mb-2">Top Performing Topic</p>
                <p className="text-2xl font-bold mb-1">Product Launch</p>
                <p className="text-xs text-muted-foreground">+35% avg engagement</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
