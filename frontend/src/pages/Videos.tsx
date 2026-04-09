import { useEffect, useMemo, useState } from "react";
import { Clapperboard, Copy, ExternalLink, Image, RefreshCw, Sparkles, Video, WandSparkles } from "lucide-react";

import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brandsAPI, productsAPI, socialAPI, videosAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const OBJECTIVES = [
  "product launch",
  "seasonal promotion",
  "ugc conversion ad",
  "retargeting",
];

const STYLES = [
  "ugc",
  "premium studio",
  "founder-led",
  "explainer",
];

const ASPECT_RATIOS = ["9:16", "1:1", "16:9"];
const DURATIONS = [15, 30, 45, 60];
const VARIANT_COUNTS = ["1", "3", "5"];

export default function Videos() {
  const [brands, setBrands] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [productDetail, setProductDetail] = useState<any>(null);
  const [brandId, setBrandId] = useState("");
  const [productId, setProductId] = useState("");
  const [objective, setObjective] = useState("product launch");
  const [videoStyle, setVideoStyle] = useState("ugc");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [platform, setPlatform] = useState("instagram");
  const [duration, setDuration] = useState("30");
  const [variantCount, setVariantCount] = useState("1");
  const [instructions, setInstructions] = useState("");
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [campaignAccountId, setCampaignAccountId] = useState("");
  const [campaignStartAt, setCampaignStartAt] = useState("");
  const [campaignIntervalHours, setCampaignIntervalHours] = useState("24");
  const [autoScheduling, setAutoScheduling] = useState(false);

  useEffect(() => {
    Promise.allSettled([brandsAPI.list(), videosAPI.list({ limit: 12 })]).then(([brandsResult, videosResult]) => {
      if (brandsResult.status === "fulfilled") {
        setBrands(brandsResult.value.data);
        if (brandsResult.value.data[0]) setBrandId(String(brandsResult.value.data[0].id));
      }
      if (videosResult.status === "fulfilled") {
        setProjects(videosResult.value.data);
        if (videosResult.value.data[0]) setCurrentProject(videosResult.value.data[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (!brandId) return;
    productsAPI.listByBrand(Number(brandId)).then((r) => {
      setProducts(r.data);
      if (!r.data.some((p: any) => String(p.id) === productId)) {
        const nextId = r.data[0] ? String(r.data[0].id) : "";
        setProductId(nextId);
      }
    }).catch(() => setProducts([]));
    socialAPI.listAccounts(Number(brandId)).then((r) => setAccounts(r.data.filter((account: any) => account.is_connected))).catch(() => setAccounts([]));
  }, [brandId]);

  useEffect(() => {
    if (!productId) {
      setProductDetail(null);
      return;
    }
    productsAPI.get(Number(productId)).then((r) => setProductDetail(r.data)).catch(() => setProductDetail(null));
  }, [productId]);

  const mediaFiles = productDetail?.media_files || [];
  const imageCount = mediaFiles.filter((m: any) => m.file_type === "image").length;
  const videoCount = mediaFiles.filter((m: any) => m.file_type === "video").length;

  const preview = useMemo(() => {
    if (!currentProject?.preview_url) return null;
    return currentProject.preview_url.startsWith("http") || currentProject.preview_url.startsWith("/")
      ? currentProject.preview_url
      : null;
  }, [currentProject]);

  const generate = async () => {
    if (!brandId || !productId) {
      toast({ title: "Select a brand and product first", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (variantCount === "1") {
        const response = await videosAPI.generate({
          brand_id: Number(brandId),
          product_id: Number(productId),
          platform,
          objective,
          video_style: videoStyle,
          aspect_ratio: aspectRatio,
          duration_seconds: Number(duration),
          custom_instructions: instructions || undefined,
        });

        setCurrentProject(response.data);
        setProjects((existing) => [response.data, ...existing.filter((item) => item.id !== response.data.id)].slice(0, 12));
        toast({ title: "Video campaign generated", description: "Storyboard, voiceover, caption, and shot plan are ready." });
      } else {
        const response = await videosAPI.generateBatch({
          brand_id: Number(brandId),
          product_id: Number(productId),
          platform,
          objective,
          video_style: videoStyle,
          aspect_ratio: aspectRatio,
          duration_seconds: Number(duration),
          variant_count: Number(variantCount),
          custom_instructions: instructions || undefined,
        });
        const created = response.data || [];
        if (created[0]) setCurrentProject(created[0]);
        setProjects((existing) => [...created, ...existing.filter((item) => !created.some((next: any) => next.id === item.id))].slice(0, 20));
        toast({ title: "Campaign variants generated", description: `${created.length} creative angles are ready for testing.` });
      }
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err?.response?.data?.detail || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCaption = async () => {
    if (!currentProject?.caption) return;
    await navigator.clipboard.writeText(currentProject.caption);
    toast({ title: "Caption copied" });
  };

  const renderProject = async () => {
    if (!currentProject?.id) return;
    setRendering(true);
    try {
      const response = await videosAPI.render(currentProject.id);
      setCurrentProject(response.data);
      setProjects((existing) => existing.map((item) => item.id === response.data.id ? response.data : item));
      toast({ title: "Animated preview rendered" });
    } catch (err: any) {
      toast({
        title: "Render failed",
        description: err?.response?.data?.detail || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRendering(false);
    }
  };

  const toggleProjectSelection = (projectId: number) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId]
    );
  };

  const autoScheduleCampaign = async () => {
    if (!selectedProjectIds.length || !campaignAccountId || !campaignStartAt) {
      toast({ title: "Select variants, account, and start time", variant: "destructive" });
      return;
    }

    setAutoScheduling(true);
    try {
      await videosAPI.autoSchedule({
        video_project_ids: selectedProjectIds,
        social_account_id: Number(campaignAccountId),
        start_at: new Date(campaignStartAt).toISOString(),
        interval_hours: Number(campaignIntervalHours),
      });
      toast({ title: "Campaign scheduled", description: `${selectedProjectIds.length} video variants were queued.` });
      setSelectedProjectIds([]);
      setCampaignStartAt("");
    } catch (err: any) {
      toast({
        title: "Auto-schedule failed",
        description: err?.response?.data?.detail || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAutoScheduling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Video Studio</h1>
            <p className="mt-1 text-muted-foreground">
              Turn product media into launch-ready ad concepts, voiceovers, captions, and shot plans.
            </p>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            Founder mode: shipping the core video workflow first
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr_0.9fr]">
          <GlassCard className="p-6">
            <h2 className="mb-5 text-lg font-semibold">Campaign Setup</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.length === 0
                      ? <SelectItem value="__none" disabled>No brands yet</SelectItem>
                      : brands.map((brand) => <SelectItem key={brand.id} value={String(brand.id)}>{brand.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId} disabled={!brandId}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.length === 0
                      ? <SelectItem value="__none" disabled>No products available</SelectItem>
                      : products.map((product) => <SelectItem key={product.id} value={String(product.id)}>{product.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Objective</Label>
                  <Select value={objective} onValueChange={setObjective}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OBJECTIVES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Style</Label>
                  <Select value={videoStyle} onValueChange={setVideoStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYLES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((item) => <SelectItem key={item} value={String(item)}>{item}s</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Creative Variants</Label>
                <Select value={variantCount} onValueChange={setVariantCount}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VARIANT_COUNTS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item === "1" ? "Single concept" : `${item} test variants`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Media readiness</p>
                    <p className="text-sm text-muted-foreground">Images unlock storyboard generation. Uploaded videos act as instant preview assets.</p>
                  </div>
                  <Clapperboard className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-black/20 p-3">
                    <p className="text-muted-foreground">Images</p>
                    <p className="mt-1 text-xl font-semibold">{imageCount}</p>
                  </div>
                  <div className="rounded-lg bg-black/20 p-3">
                    <p className="text-muted-foreground">Videos</p>
                    <p className="mt-1 text-xl font-semibold">{videoCount}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Creative Instructions</Label>
                <Textarea
                  rows={5}
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Example: make this feel premium and cinematic, focus on gifting season, lead with customer pain point."
                />
                <p className="text-xs text-muted-foreground">
                  Rendered exports can include an AI-generated narration track when your API key supports voice synthesis.
                </p>
              </div>

              <Button className="w-full gap-2" size="lg" onClick={generate} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating campaign..." : variantCount === "1" ? "Generate Video Campaign" : "Generate Test Variants"}
              </Button>
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="overflow-hidden">
              <div className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{currentProject?.title || "Campaign Preview"}</h2>
                    <p className="text-sm text-muted-foreground">
                      {currentProject
                        ? `${currentProject.video_style} • ${currentProject.platform} • ${currentProject.duration_seconds}s • ${currentProject.render_status}`
                        : "Generate a project to see your ad concept, preview asset, and delivery plan."}
                    </p>
                  </div>
                  {currentProject?.caption && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={copyCaption}>
                        <Copy className="h-4 w-4" /> Copy Caption
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={renderProject} disabled={rendering}>
                        {rendering ? <RefreshCw className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                        {rendering ? "Rendering..." : "Render Preview"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {preview ? (
                  <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    {currentProject?.preview_type === "video" ? (
                      <video src={preview} controls className="aspect-[9/16] w-full bg-black object-contain" />
                    ) : (
                      <img src={preview} alt={currentProject?.title || "Video preview"} className="aspect-[9/16] w-full object-cover" />
                    )}
                  </div>
                ) : (
                  <div className="mb-6 flex aspect-[9/16] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center text-muted-foreground">
                    <div>
                      <Video className="mx-auto mb-3 h-10 w-10 opacity-30" />
                      <p>No preview asset yet.</p>
                      <p className="mt-1 text-sm">Upload product media in Products to strengthen the output.</p>
                    </div>
                  </div>
                )}

                {currentProject ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Hook</p>
                        <p className="mt-2 text-base font-medium">{currentProject.hook}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Launch Status</p>
                        <p className="mt-2 text-base font-medium capitalize">{currentProject.render_status.replace(/_/g, " ")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {currentProject.render_provider === "pillow_renderer"
                            ? "A generated animated preview is ready to share or schedule."
                            : currentProject.download_url
                              ? "A media asset is ready to publish."
                              : "Storyboard package is ready for creative production."}
                        </p>
                        {currentProject.meta?.voiceover_included && (
                          <p className="mt-2 text-xs text-cyan-200">Voiceover narration included in exported MP4.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 font-semibold">Storyboard</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {(currentProject.storyboard || []).map((step: string, index: number) => (
                          <div key={`${step}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Beat {index + 1}</p>
                            <p className="mt-2">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 font-semibold">Scene Direction</h3>
                      <div className="space-y-3">
                        {(currentProject.scenes || []).map((scene: any) => (
                          <div key={scene.scene_number} className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <p className="font-medium">Scene {scene.scene_number}</p>
                              <span className="text-xs text-muted-foreground">{scene.start_seconds}s - {scene.end_seconds}s</span>
                            </div>
                            <p className="mt-3 text-sm"><span className="text-muted-foreground">Visual:</span> {scene.visual}</p>
                            <p className="mt-2 text-sm"><span className="text-muted-foreground">Overlay:</span> {scene.overlay_text}</p>
                            <p className="mt-2 text-sm"><span className="text-muted-foreground">Voiceover:</span> {scene.voiceover}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl bg-white/5 p-4">
                        <h3 className="font-semibold">Voiceover Script</h3>
                        <Textarea value={currentProject.voiceover_script || ""} rows={10} readOnly className="mt-3" />
                      </div>
                      <div className="rounded-xl bg-white/5 p-4">
                        <h3 className="font-semibold">Caption + Hashtags</h3>
                        <Textarea value={currentProject.caption || ""} rows={6} readOnly className="mt-3" />
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(currentProject.hashtags || []).map((tag: string) => (
                            <span key={tag} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/5 p-4">
                      <h3 className="font-semibold">Shot Plan</h3>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {(currentProject.shot_plan || []).map((item: string, index: number) => (
                          <div key={`${item}-${index}`} className="rounded-lg bg-black/20 p-3 text-sm">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {currentProject.preview_url && (
                      <div className="flex flex-wrap gap-3">
                        <a href={currentProject.preview_url} target="_blank" rel="noreferrer">
                          <Button variant="outline" className="gap-2">
                            <ExternalLink className="h-4 w-4" /> Open Preview Asset
                          </Button>
                        </a>
                        {currentProject.download_url && (
                          <a href={currentProject.download_url} target="_blank" rel="noreferrer">
                            <Button variant="outline" className="gap-2">
                              <Video className="h-4 w-4" /> Download Render
                            </Button>
                          </a>
                        )}
                        <a href="/schedule">
                          <Button className="gap-2">
                            <Sparkles className="h-4 w-4" /> Move to Scheduling
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Clapperboard className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p>Generate your first video campaign to unlock the studio.</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Campaign Calendar</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Select multiple variants below, choose a connected account, and queue a spaced creative test automatically.
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Connected Account</Label>
                  <Select value={campaignAccountId} onValueChange={setCampaignAccountId}>
                    <SelectTrigger><SelectValue placeholder="Choose account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.length === 0
                        ? <SelectItem value="__none" disabled>No connected accounts</SelectItem>
                        : accounts.map((account: any) => (
                          <SelectItem key={account.id} value={String(account.id)}>
                            {account.platform} - {account.account_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Start Time</Label>
                    <Input type="datetime-local" value={campaignStartAt} onChange={(e) => setCampaignStartAt(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Spacing (hours)</Label>
                    <Input type="number" min="1" max="168" value={campaignIntervalHours} onChange={(e) => setCampaignIntervalHours(e.target.value)} />
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 p-4 text-sm text-muted-foreground">
                  {selectedProjectIds.length} variant{selectedProjectIds.length === 1 ? "" : "s"} selected for this campaign.
                </div>
                <Button className="w-full gap-2" onClick={autoScheduleCampaign} disabled={autoScheduling || !selectedProjectIds.length}>
                  {autoScheduling ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
                  {autoScheduling ? "Scheduling..." : "Auto-Schedule Campaign"}
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Production Checklist</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="font-medium text-foreground">1. Load strong visuals</p>
                  <p className="mt-1">Upload at least 3 product images in the Products tab for better storyboards.</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="font-medium text-foreground">2. Sharpen the angle</p>
                  <p className="mt-1">Set brand tone and target audience in Settings so the copy sounds like your brand.</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="font-medium text-foreground">3. Ship fast</p>
                  <p className="mt-1">Use the generated caption and shot plan immediately in your editing or posting workflow.</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Video Projects</h2>
                <span className="text-xs text-muted-foreground">{projects.length} saved</span>
              </div>
              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setCurrentProject(project)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        currentProject?.id === project.id
                          ? "border-cyan-400/40 bg-cyan-400/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{project.title}</p>
                          <p className="mt-1 text-xs capitalize text-muted-foreground">
                            {project.platform} • {project.render_status.replace(/_/g, " ")}
                          </p>
                          {project.meta?.creative_angle && (
                            <p className="mt-1 text-xs text-cyan-200">{project.meta.creative_angle}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {project.preview_type === "video" ? (
                            <Video className="h-4 w-4 shrink-0 text-cyan-200" />
                          ) : (
                            <Image className="h-4 w-4 shrink-0 text-cyan-200" />
                          )}
                          <span
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleProjectSelection(project.id);
                            }}
                            className={`rounded-full px-3 py-1 text-[11px] transition ${
                              selectedProjectIds.includes(project.id)
                                ? "bg-cyan-300 text-slate-950"
                                : "bg-white/10 text-muted-foreground"
                            }`}
                          >
                            {selectedProjectIds.includes(project.id) ? "Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-muted-foreground">
                  No video projects yet.
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}
