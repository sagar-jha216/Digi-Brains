import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Play, Share2, Calendar, CheckCircle2, Clock } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";
import thumb1 from "@/assets/video-thumb-1.jpg";
import thumb2 from "@/assets/video-thumb-2.jpg";
import thumb3 from "@/assets/video-thumb-3.jpg";

const Dashboard = () => {
  const recentVideos = [
    { id: 1, title: "Smart Watch Pro Launch", status: "Posted", thumb: thumb1, date: "2 hours ago" },
    { id: 2, title: "Summer Sale Campaign", status: "Generated", thumb: thumb2, date: "5 hours ago" },
    { id: 3, title: "Product Demo Video", status: "Scheduled", thumb: thumb3, date: "Yesterday" },
  ];

  const activities = [
    { action: "Video generated", title: "Smart Watch Pro Launch", time: "2 hours ago", icon: CheckCircle2 },
    { action: "Posted to YouTube", title: "Smart Watch Pro Launch", time: "2 hours ago", icon: Share2 },
    { action: "Video scheduled", title: "Product Demo Video", time: "Yesterday", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-muted-foreground">Here's what's happening with your video campaigns</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="overflow-hidden animate-scale-in">
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/10">
                <img 
                  src={heroImage} 
                  alt="Latest video" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="lg" variant="glow" className="w-16 h-16 rounded-full p-0">
                    <Play className="w-8 h-8" />
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Smart Watch Pro - Product Launch</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Posted 2 hours ago
                  </span>
                  <span>1.2K views</span>
                  <span>45 likes</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="glow">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="glass">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </div>
            </GlassCard>

            {/* Recent Videos */}
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Videos</h2>
              <div className="space-y-3">
                {recentVideos.map((video) => (
                  <div key={video.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                    <img 
                      src={video.thumb} 
                      alt={video.title} 
                      className="w-24 h-14 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{video.title}</h4>
                      <p className="text-sm text-muted-foreground">{video.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      video.status === "Posted" ? "bg-primary/20 text-primary" :
                      video.status === "Generated" ? "bg-accent/20 text-accent-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {video.status}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <GlassCard className="p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <activity.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6 bg-gradient-hero border-primary/20">
              <h3 className="font-semibold mb-2">🎯 Quick Tip</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Schedule videos during peak engagement times to maximize reach!
              </p>
              <Button variant="glow" size="sm" className="w-full">
                View Analytics
              </Button>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
