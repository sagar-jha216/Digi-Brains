import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Clapperboard, Rocket, Sparkles, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const highlights = [
  {
    icon: Sparkles,
    title: "Generate campaign assets",
    body: "Create scripts, captions, hooks, and platform-ready creative from one product setup.",
  },
  {
    icon: Clapperboard,
    title: "Build video campaigns",
    body: "Turn product media into storyboarded ads with scene direction and voiceover copy.",
  },
  {
    icon: BarChart3,
    title: "Schedule and measure",
    body: "Push content into a posting workflow and keep performance visible in one dashboard.",
  },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", company_name: "" });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      toast({ title: isLogin ? "Welcome back!" : "Account created!" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.detail || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
              <Rocket className="h-4 w-4" />
              Launch your AI marketing system
            </div>
            <h1 className="text-5xl font-bold leading-tight">
              Build, package, and ship product marketing from one brain.
            </h1>
            <p className="mt-5 text-lg text-slate-300">
              AI Brand Brain helps brands turn product details into ready-to-publish creative campaigns, video concepts, and social content in one workflow.
            </p>

            <div className="mt-10 space-y-4">
              {highlights.map(({ icon: Icon, title, body }) => (
                <GlassCard key={title} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-cyan-400/10 p-3">
                      <Icon className="h-5 w-5 text-cyan-200" />
                    </div>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary shadow-[0_0_40px_rgba(59,130,246,0.4)]">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold">AI Brand Brain</h2>
            <p className="mt-2 text-muted-foreground">Your founder-grade content and campaign engine</p>
          </div>

          <GlassCard className="border-white/15 bg-slate-950/60 p-8 backdrop-blur-xl">
            <div className="mb-6 flex gap-2 rounded-xl bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isLogin ? "bg-white text-slate-950" : "text-muted-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  !isLogin ? "bg-white text-slate-950" : "text-muted-foreground"
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input placeholder="Sagar Sharma" value={form.full_name} onChange={set("full_name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company Name</Label>
                    <Input placeholder="My Brand Co." value={form.company_name} onChange={set("company_name")} />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="you@company.com" required value={form.email} onChange={set("email")} />
              </div>

              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" placeholder="********" required value={form.password} onChange={set("password")} />
              </div>

              <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Enter Workspace" : "Create Workspace"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {isLogin ? "Need an account?" : "Already have an account?"}{" "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-cyan-200 hover:underline">
                {isLogin ? "Start free" : "Sign in"}
              </button>
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
