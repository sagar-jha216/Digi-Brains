import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, Sparkles, BarChart3, Zap, CheckCircle2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import heroImage from "@/assets/hero-dashboard.jpg";

const Index = () => {
  const features = [
    { icon: Sparkles, title: "AI-Powered Generation", description: "Create stunning videos with AI in minutes", link: "/ai-generation" },
    { icon: BarChart3, title: "Advanced Analytics", description: "Track performance across all platforms", link: "/analytics" },
    { icon: Zap, title: "Auto-Posting", description: "Schedule and post automatically", link: "/generate" },
  ];

  const benefits = [
    "Generate professional marketing videos in minutes",
    "AI-powered captions and content optimization",
    "Multi-platform distribution and scheduling",
    "Real-time analytics and performance tracking",
    "Automated workflow from creation to posting",
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
              <Video className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Digi Brain
            </span>
          </Link>
          <Link to="/auth">
            <Button variant="glow">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              AI-Powered Video Marketing on{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Autopilot
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Generate, analyze, and post marketing videos automatically. Let AI handle your video marketing
              while you focus on growing your business.
            </p>
            <div className="flex gap-4">
              <Link to="/auth">
                <Button variant="glow" size="lg" className="text-lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="glass" size="lg" className="text-lg">
                Watch Demo
              </Button>
            </div>
          </div>

          <div className="animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <GlassCard className="overflow-hidden" hover>
              <img src={heroImage} alt="AI Dashboard" className="w-full rounded-lg" />
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-muted-foreground">Powerful features to automate your video marketing</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link key={feature.title} to={feature.link}>
              <GlassCard
                className="p-8 animate-scale-in cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
                hover
              >
                <div className="w-14 h-14 bg-gradient-primary rounded-lg flex items-center justify-center mb-6 shadow-glow">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div
                key={benefit}
                className="flex gap-4 items-start animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <p className="text-lg">{benefit}</p>
              </div>
            ))}
          </div>

          <GlassCard className="p-12 bg-gradient-hero border-primary/20">
            <h3 className="text-3xl font-bold mb-4">Ready to transform your marketing?</h3>
            <p className="text-muted-foreground mb-8">
              Join thousands of businesses using AI to create amazing video content.
            </p>
            <Link to="/auth">
              <Button variant="glow" size="lg" className="w-full text-lg">
                Get Started Now
              </Button>
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold">Digi Brain</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 Digi Brain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
