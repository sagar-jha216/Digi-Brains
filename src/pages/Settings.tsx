import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Youtube, Instagram, Linkedin, Key, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully",
    });
  };

  const platforms = [
    { name: "YouTube", icon: Youtube, connected: true, color: "text-red-500" },
    { name: "Instagram", icon: Instagram, connected: true, color: "text-pink-500" },
    { name: "LinkedIn", icon: Linkedin, connected: false, color: "text-blue-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* User Profile */}
          <GlassCard className="p-6 animate-scale-in">
            <div className="flex items-center gap-6 mb-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1">John Doe</h2>
                <p className="text-muted-foreground">john@company.com</p>
              </div>
              <Button variant="outline">
                <User className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="John Doe" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" defaultValue="Acme Corp" className="bg-background/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john@company.com" className="bg-background/50" />
              </div>
            </div>
          </GlassCard>

          {/* Connected Accounts */}
          <GlassCard className="p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
            <div className="space-y-4">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex items-center justify-between p-4 rounded-lg bg-accent/20">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-background rounded-lg flex items-center justify-center ${platform.color}`}>
                      <platform.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {platform.connected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Button variant={platform.connected ? "outline" : "glow"} size="sm">
                    {platform.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* API Keys */}
          <GlassCard className="p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-key">YouTube API Key</Label>
                <Input 
                  id="youtube-key" 
                  type="password" 
                  defaultValue="ya29.a0AfH6SMBx..." 
                  className="bg-background/50 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram-key">Instagram Access Token</Label>
                <Input 
                  id="instagram-key" 
                  type="password" 
                  defaultValue="IGQVJXaDFN..." 
                  className="bg-background/50 font-mono text-sm"
                />
              </div>
            </div>
          </GlassCard>

          {/* Preferences */}
          <GlassCard className="p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-xl font-semibold mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/20">
                <div>
                  <p className="font-medium">Auto-post videos</p>
                  <p className="text-sm text-muted-foreground">Automatically post generated videos</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/20">
                <div>
                  <p className="font-medium">Email notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates about your videos</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/20">
                <div>
                  <p className="font-medium">AI suggestions</p>
                  <p className="text-sm text-muted-foreground">Get AI-powered content recommendations</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </GlassCard>

          <div className="flex justify-end gap-3">
            <Button variant="outline">Cancel</Button>
            <Button variant="glow" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
