import { useState } from "react";
import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Play, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import thumb1 from "@/assets/video-thumb-1.jpg";

const Generate = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoGenerated, setVideoGenerated] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    setIsGenerating(true);
    toast({
      title: "Generating your video...",
      description: "This may take a few moments",
    });
    
    setTimeout(() => {
      setIsGenerating(false);
      setVideoGenerated(true);
      toast({
        title: "Video generated successfully!",
        description: "Your video is ready to preview",
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Generate AI Video</h1>
          <p className="text-muted-foreground">Create engaging marketing videos with AI</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <GlassCard className="p-6 animate-scale-in">
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  placeholder="Enter product name"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Product Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product and its key features..."
                  rows={4}
                  className="bg-background/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select>
                    <SelectTrigger id="audience" className="bg-background/50">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gen-z">Gen Z (18-24)</SelectItem>
                      <SelectItem value="millennials">Millennials (25-40)</SelectItem>
                      <SelectItem value="gen-x">Gen X (41-56)</SelectItem>
                      <SelectItem value="boomers">Boomers (57+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select>
                    <SelectTrigger id="tone" className="bg-background/50">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select>
                  <SelectTrigger id="platform" className="bg-background/50">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="button"
                variant="glow" 
                className="w-full" 
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            </form>
          </GlassCard>

          {/* Preview */}
          <div className="space-y-6">
            <GlassCard className="p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              
              {isGenerating && (
                <div className="aspect-video bg-gradient-hero rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">AI is creating your video...</p>
                  </div>
                </div>
              )}

              {!isGenerating && !videoGenerated && (
                <div className="aspect-video bg-gradient-hero rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Your video will appear here</p>
                  </div>
                </div>
              )}

              {videoGenerated && (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <img src={thumb1} alt="Generated video" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button size="lg" variant="glow" className="w-16 h-16 rounded-full p-0">
                        <Play className="w-8 h-8" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caption">Auto-Generated Caption</Label>
                    <Textarea
                      id="caption"
                      defaultValue="🚀 Introducing the future of tech! Check out our amazing new product. #Innovation #Tech #NewProduct"
                      rows={3}
                      className="bg-background/50"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="glow" className="flex-1">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Now
                    </Button>
                    <Button variant="glass">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-6 bg-gradient-hero border-primary/20">
              <h3 className="font-semibold mb-2">✨ AI Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Be specific about your product features</li>
                <li>• Choose the right tone for your audience</li>
                <li>• Optimize for your target platform</li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Generate;
