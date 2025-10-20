import { useState } from "react";
import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Sparkles, Loader2, TrendingUp, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AIGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const trendingSuggestions = [
    {
      topic: "Behind-the-Scenes Manufacturing",
      reason: "Authenticity content is trending 47% higher engagement",
      tags: "#BehindTheScenes #Manufacturing #ProcessVideo"
    },
    {
      topic: "Customer Success Stories",
      reason: "UGC-style testimonials drive 3x more conversions",
      tags: "#CustomerStory #Testimonial #Results"
    },
    {
      topic: "Quick Product Tutorial",
      reason: "Short-form how-to videos get 2.5x more shares",
      tags: "#Tutorial #HowTo #ProductDemo"
    },
    {
      topic: "Before & After Transformations",
      reason: "Visual transformations increase retention by 68%",
      tags: "#BeforeAfter #Transformation #Results"
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    toast({
      title: `${type} uploaded successfully`,
      description: `${files.length} file(s) added`,
    });
  };

  const handleGenerate = () => {
    if (!description.trim() && uploadedFiles.length === 0) {
      toast({
        title: "Missing content",
        description: "Please add a description or upload files",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    toast({
      title: "AI is creating your video...",
      description: "This may take 30-60 seconds",
    });

    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Video generated successfully!",
        description: "Your video is ready in the Generate tab",
      });
    }, 3000);
  };

  const useSuggestion = (suggestion: typeof trendingSuggestions[0]) => {
    setDescription(`Create a compelling video about: ${suggestion.topic}\n\nWhy this works: ${suggestion.reason}\n\nSuggested hashtags: ${suggestion.tags}`);
    toast({
      title: "Suggestion applied!",
      description: "Description updated with trending topic",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">AI-Powered Video Creation</h1>
          <p className="text-muted-foreground">Upload your content and let AI create stunning marketing videos</p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="create">Create Video</TabsTrigger>
            <TabsTrigger value="trending">Trending Ideas</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <GlassCard className="p-6 space-y-6 animate-scale-in">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Upload Media</h2>
                  
                  <div className="space-y-4">
                    {/* Video Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="video-upload" className="flex items-center gap-2">
                        <VideoIcon className="w-4 h-4" />
                        Upload Videos
                      </Label>
                      <div className="relative">
                        <input
                          id="video-upload"
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={(e) => handleFileUpload(e, "Videos")}
                          className="hidden"
                        />
                        <label htmlFor="video-upload">
                          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-background/50">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload videos</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="photo-upload" className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Upload Photos
                      </Label>
                      <div className="relative">
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleFileUpload(e, "Photos")}
                          className="hidden"
                        />
                        <label htmlFor="photo-upload">
                          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-background/50">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload photos</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium mb-2">Uploaded Files ({uploadedFiles.length})</p>
                      <div className="space-y-1">
                        {uploadedFiles.map((file, index) => (
                          <p key={index} className="text-xs text-muted-foreground truncate">
                            {file.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Product Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product, its key features, target audience, and what makes it unique..."
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-background/50 resize-none"
                  />
                </div>

                <Button 
                  variant="glow" 
                  className="w-full" 
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Video with AI
                    </>
                  )}
                </Button>
              </GlassCard>

              {/* Preview Section */}
              <GlassCard className="p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <h2 className="text-xl font-semibold mb-4">AI Processing</h2>
                
                {isGenerating ? (
                  <div className="aspect-video bg-gradient-hero rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">AI is analyzing your content...</p>
                      <p className="text-sm text-muted-foreground mt-2">Creating engaging video narrative</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gradient-hero rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                      <div className="text-center">
                        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Your generated video will appear here</p>
                      </div>
                    </div>

                    <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                      <p className="text-sm font-medium">✨ AI Features Enabled:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Auto scene detection and transitions</li>
                        <li>• Dynamic caption generation</li>
                        <li>• Background music matching</li>
                        <li>• Platform-specific optimization</li>
                        <li>• Trending hashtag suggestions</li>
                      </ul>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">AI-Powered Trending Topics</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Our AI analyzes millions of posts to identify what's working right now. Use these insights to maximize your reach.
              </p>

              <div className="grid gap-4">
                {trendingSuggestions.map((suggestion, index) => (
                  <GlassCard 
                    key={index} 
                    className="p-4 hover:border-primary/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 text-lg">{suggestion.topic}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          <span className="text-primary font-medium">Why it works:</span> {suggestion.reason}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{suggestion.tags}</p>
                      </div>
                      <Button 
                        variant="glow" 
                        size="sm"
                        onClick={() => useSuggestion(suggestion)}
                      >
                        Use This
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-hero rounded-lg border border-primary/20">
                <h3 className="font-semibold mb-2">🎯 Pro Tip</h3>
                <p className="text-sm text-muted-foreground">
                  Combining trending topics with authentic, behind-the-scenes content typically generates 3-5x more engagement than traditional product shots.
                </p>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AIGeneration;
