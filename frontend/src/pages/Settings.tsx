import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, Link2, PlusCircle, Save, Trash2, Upload, Unplug, Users } from "lucide-react";

import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brandsAPI, socialAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const TONES = ["professional", "casual", "humorous", "inspirational", "bold", "friendly"];
const INDUSTRIES = ["E-commerce", "SaaS", "Fashion", "Food & Beverage", "Health & Wellness", "Finance", "Education", "Travel", "Other"];
const EMPTY_BRAND = {
  name: "",
  description: "",
  industry: "",
  brand_tone: "professional",
  target_audience: "",
  brand_values: "",
  website_url: "",
};
const EMPTY_SOCIAL = {
  platform: "instagram",
  account_name: "",
  account_id: "",
  access_token: "",
};

export default function Settings() {
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [form, setForm] = useState(EMPTY_BRAND);
  const [socialForm, setSocialForm] = useState(EMPTY_SOCIAL);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    brandsAPI.list().then((r) => {
      setBrands(r.data);
      if (r.data[0]) loadBrand(r.data[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setAccounts([]);
      return;
    }
    socialAPI.listAccounts(selectedId).then((r) => setAccounts(r.data)).catch(() => setAccounts([]));
  }, [selectedId]);

  const activeBrand = useMemo(
    () => brands.find((brand) => brand.id === selectedId) || null,
    [brands, selectedId],
  );

  const loadBrand = (brand: any) => {
    setSelectedId(brand.id);
    setCreating(false);
    setForm({
      name: brand.name || "",
      description: brand.description || "",
      industry: brand.industry || "",
      brand_tone: brand.brand_tone || "professional",
      target_audience: brand.target_audience || "",
      brand_values: brand.brand_values || "",
      website_url: brand.website_url || "",
    });
  };

  const setBrandField = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setBrandSelect = (key: string) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const setSocialField = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSocialForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setSocialSelect = (value: string) => setSocialForm((prev) => ({ ...prev, platform: value }));

  const saveBrand = async () => {
    if (!form.name.trim()) {
      toast({ title: "Brand name required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (creating || !selectedId) {
        const response = await brandsAPI.create(form);
        setBrands((prev) => [...prev, response.data]);
        loadBrand(response.data);
        toast({ title: "Brand created" });
      } else {
        const response = await brandsAPI.update(selectedId, form);
        setBrands((prev) => prev.map((brand) => (brand.id === response.data.id ? response.data : brand)));
        loadBrand(response.data);
        toast({ title: "Brand updated" });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          typeof err?.response?.data?.detail === "string"
            ? err.response.data.detail
            : err?.response?.data?.detail?.[0]?.msg || "Failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteBrand = async () => {
    if (!selectedId || !confirm("Delete this brand and all its data?")) return;
    await brandsAPI.delete(selectedId);
    const remaining = brands.filter((brand) => brand.id !== selectedId);
    setBrands(remaining);
    if (remaining[0]) loadBrand(remaining[0]);
    else {
      setSelectedId(null);
      setCreating(false);
      setForm(EMPTY_BRAND);
      setAccounts([]);
    }
    toast({ title: "Brand deleted" });
  };

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedId) return;
    setLogoUploading(true);
    try {
      const response = await brandsAPI.uploadLogo(selectedId, file);
      setBrands((prev) => prev.map((brand) => (brand.id === response.data.id ? response.data : brand)));
      loadBrand(response.data);
      toast({ title: "Logo uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.response?.data?.detail || "Please try again", variant: "destructive" });
    } finally {
      setLogoUploading(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  };

  const connectAccount = async () => {
    if (!selectedId) {
      toast({ title: "Create or select a brand first", variant: "destructive" });
      return;
    }
    if (!socialForm.account_name.trim() || !socialForm.access_token.trim()) {
      toast({ title: "Account name and access token are required", variant: "destructive" });
      return;
    }

    setConnecting(true);
    try {
      await socialAPI.connectAccount({
        brand_id: selectedId,
        platform: socialForm.platform,
        account_name: socialForm.account_name,
        account_id: socialForm.account_id || undefined,
        access_token: socialForm.access_token,
      });
      setSocialForm(EMPTY_SOCIAL);
      socialAPI.listAccounts(selectedId).then((r) => setAccounts(r.data)).catch(() => {});
      toast({ title: "Social account connected" });
    } catch (err: any) {
      toast({ title: "Connection failed", description: err?.response?.data?.detail || "Please try again", variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectAccount = async (accountId: number) => {
    try {
      await socialAPI.disconnectAccount(accountId);
      setAccounts((prev) => prev.map((account) => (account.id === accountId ? { ...account, is_connected: false } : account)));
      toast({ title: "Social account disconnected" });
    } catch {
      toast({ title: "Disconnect failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="mt-1 text-muted-foreground">Manage your brands, identity, and social publishing channels.</p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setSelectedId(null);
              setCreating(true);
              setForm(EMPTY_BRAND);
            }}
          >
            <PlusCircle className="h-4 w-4" />
            New Brand
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <GlassCard className="h-fit p-4">
            <p className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Brands</p>
            <div className="space-y-2">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => loadBrand(brand)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    selectedId === brand.id && !creating
                      ? "border-cyan-400/40 bg-cyan-400/10"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <p className="font-medium">{brand.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{brand.industry || "No industry set"}</p>
                </button>
              ))}
              {brands.length === 0 && <p className="px-1 text-xs text-muted-foreground">No brands yet</p>}
            </div>
          </GlassCard>

          <div className="lg:col-span-3">
            <Tabs defaultValue="brand">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="brand" className="gap-2"><Globe className="h-4 w-4" /> Brand</TabsTrigger>
                <TabsTrigger value="social" className="gap-2"><Users className="h-4 w-4" /> Social Channels</TabsTrigger>
              </TabsList>

              <TabsContent value="brand">
                <GlassCard className="p-6">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">{creating ? "New Brand" : "Brand Workspace"}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Set the context the AI should use across every campaign.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {activeBrand?.logo_url ? (
                        <img src={activeBrand.logo_url} alt={activeBrand.name} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-sm text-muted-foreground">Logo</div>
                      )}
                      <div>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => logoRef.current?.click()} disabled={!selectedId || logoUploading}>
                          <Upload className="h-4 w-4" />
                          {logoUploading ? "Uploading..." : "Upload Logo"}
                        </Button>
                        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Brand Name *</Label>
                        <Input value={form.name} onChange={setBrandField("name")} placeholder="Acme Corp" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Website</Label>
                        <Input value={form.website_url} onChange={setBrandField("website_url")} placeholder="https://acme.com" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea value={form.description} onChange={setBrandField("description")} rows={2} placeholder="What does your brand do?" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Industry</Label>
                        <Select value={form.industry} onValueChange={setBrandSelect("industry")}>
                          <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                          <SelectContent>{INDUSTRIES.map((industry) => <SelectItem key={industry} value={industry}>{industry}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Brand Tone</Label>
                        <Select value={form.brand_tone} onValueChange={setBrandSelect("brand_tone")}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{TONES.map((tone) => <SelectItem key={tone} value={tone} className="capitalize">{tone}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Target Audience</Label>
                      <Textarea
                        value={form.target_audience}
                        onChange={setBrandField("target_audience")}
                        rows={2}
                        placeholder="e.g. small business owners aged 25-45 who want to automate marketing"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Brand Values</Label>
                      <Textarea value={form.brand_values} onChange={setBrandField("brand_values")} rows={2} placeholder="Innovation, clarity, customer-first" />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button className="flex-1 gap-2" onClick={saveBrand} disabled={saving}>
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Brand"}
                      </Button>
                      {!creating && selectedId && (
                        <Button variant="destructive" size="icon" onClick={deleteBrand}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </TabsContent>

              <TabsContent value="social">
                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <GlassCard className="p-6">
                    <h2 className="mb-2 text-lg font-semibold">Connect Social Channel</h2>
                    <p className="mb-5 text-sm text-muted-foreground">
                      For the current MVP, paste platform credentials from your OAuth flow or platform dashboard.
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Platform</Label>
                        <Select value={socialForm.platform} onValueChange={setSocialSelect}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Account Name</Label>
                        <Input value={socialForm.account_name} onChange={setSocialField("account_name")} placeholder="Brand handle or channel name" />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Platform Account ID</Label>
                        <Input value={socialForm.account_id} onChange={setSocialField("account_id")} placeholder="Optional account/channel identifier" />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Access Token</Label>
                        <Textarea value={socialForm.access_token} onChange={(e) => setSocialForm((prev) => ({ ...prev, access_token: e.target.value }))} rows={5} placeholder="Paste access token" />
                      </div>

                      <Button className="w-full gap-2" onClick={connectAccount} disabled={connecting || !selectedId}>
                        <Link2 className="h-4 w-4" />
                        {connecting ? "Connecting..." : "Connect Channel"}
                      </Button>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">Connected Channels</h2>
                        <p className="text-sm text-muted-foreground">These channels are available in the scheduler.</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                        {accounts.filter((account) => account.is_connected).length} active
                      </span>
                    </div>

                    {selectedId ? (
                      accounts.length > 0 ? (
                        <div className="space-y-3">
                          {accounts.map((account) => (
                            <div key={account.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium capitalize">{account.platform}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{account.account_name || "Unnamed account"}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {account.is_connected ? "Connected" : "Disconnected"} • {account.followers_count || 0} followers
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => disconnectAccount(account.id)}>
                                  <Unplug className="h-4 w-4" />
                                  Disconnect
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-muted-foreground">
                          No channels connected for this brand yet.
                        </div>
                      )
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-muted-foreground">
                        Select or create a brand first.
                      </div>
                    )}
                  </GlassCard>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
