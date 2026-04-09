import { useEffect, useState } from "react";
import { Copy, Check, RefreshCw, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brandsAPI, productsAPI, contentAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const TYPES = [
  { value: "caption",      label: "Social Caption" },
  { value: "script",       label: "Video Script (60s)" },
  { value: "video_script", label: "Full Production Script" },
  { value: "hashtags",     label: "Hashtags" },
];

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "youtube",   label: "YouTube" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "general",   label: "General" },
];

export default function Generate() {
  const [brands, setBrands] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [brandId, setBrandId] = useState("");
  const [productId, setProductId] = useState("");
  const [type, setType] = useState("caption");
  const [platform, setPlatform] = useState("instagram");
  const [instructions, setInstructions] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contentId, setContentId] = useState<number | null>(null);

  useEffect(() => { brandsAPI.list().then((r) => setBrands(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    if (brandId) {
      productsAPI.listByBrand(Number(brandId)).then((r) => { setProducts(r.data); setProductId(""); }).catch(() => {});
    }
  }, [brandId]);

  const generate = async () => {
    if (!brandId || !productId) {
      toast({ title: "Please select a brand and product", variant: "destructive" });
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const r = await contentAPI.generate({
        brand_id: Number(brandId),
        product_id: Number(productId),
        content_type: type,
        platform,
        custom_instructions: instructions || undefined,
      });
      setOutput(r.data.content);
      setContentId(r.data.id);
      toast({ title: "Content generated! ✨" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.response?.data?.detail || "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const approve = async () => {
    if (!contentId) return;
    try {
      await contentAPI.approve(contentId);
      toast({ title: "Approved & saved to library!" });
    } catch {
      toast({ title: "Error approving", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Generate Content</h1>
          <p className="mt-1 text-muted-foreground">AI-powered captions, scripts & hashtags for your products</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left — Config */}
          <GlassCard className="p-6">
            <h2 className="mb-5 text-lg font-semibold">Setup</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.length === 0
                      ? <SelectItem value="__none" disabled>No brands — go to Settings first</SelectItem>
                      : brands.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId} disabled={!brandId}>
                  <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                  <SelectContent>
                    {products.length === 0
                      ? <SelectItem value="__none" disabled>No products — go to Products first</SelectItem>
                      : products.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Content Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Extra Instructions (optional)</Label>
                <Textarea
                  placeholder="e.g. Focus on the 30% discount, keep it under 100 words..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>

              <Button className="w-full gap-2" size="lg" onClick={generate} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating..." : "Generate Content"}
              </Button>
            </div>
          </GlassCard>

          {/* Right — Output */}
          <GlassCard className="flex flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Output</h2>
              {output && (
                <Button variant="ghost" size="sm" onClick={copy} className="gap-2">
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>

            {output ? (
              <>
                <Textarea
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  rows={16}
                />
                <div className="mt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2" onClick={generate} disabled={loading}>
                    <RefreshCw className="h-4 w-4" /> Regenerate
                  </Button>
                  <Button className="flex-1" onClick={approve}>
                    Approve & Save
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Sparkles className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p className="text-sm">Your generated content will appear here</p>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
