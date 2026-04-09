import { useEffect, useMemo, useRef, useState } from "react";
import { Edit, Image, Package, Plus, Save, Trash2, Upload, Video, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brandsAPI, productsAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const empty = { name: "", description: "", price: "", category: "", features: "", benefits: "", call_to_action: "" };

export default function Products() {
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    brandsAPI.list().then((r) => {
      setBrands(r.data);
      if (r.data[0]) setBrandId(String(r.data[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (brandId) {
      productsAPI.listByBrand(Number(brandId)).then((r) => setProducts(r.data)).catch(() => {});
    }
  }, [brandId]);

  const openProduct = (p: any) => {
    setSelected(p);
    setCreating(false);
    setEditing(false);
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: p.price ? String(p.price) : "",
      category: p.category || "",
      features: (p.features || []).join("\n"),
      benefits: (p.benefits || []).join("\n"),
      call_to_action: p.call_to_action || "",
    });
  };

  const startCreate = () => {
    setSelected(null);
    setCreating(true);
    setEditing(false);
    setForm(empty);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Product name required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      category: form.category || undefined,
      features: lines(form.features),
      benefits: lines(form.benefits),
      call_to_action: form.call_to_action || undefined,
    };

    try {
      if (creating) {
        const r = await productsAPI.create(Number(brandId), payload);
        setProducts((p) => [...p, r.data]);
        openProduct(r.data);
        toast({ title: "Product created!" });
      } else {
        const r = await productsAPI.update(selected.id, payload);
        setProducts((p) => p.map((x) => x.id === r.data.id ? r.data : x));
        setSelected(r.data);
        setEditing(false);
        toast({ title: "Product updated!" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.detail || "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Archive this product?")) return;
    await productsAPI.delete(id);
    setProducts((p) => p.filter((x) => x.id !== id));
    setSelected(null);
    toast({ title: "Product archived" });
  };

  const uploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selected) return;

    setUploading(true);
    try {
      const response = files.length === 1
        ? await productsAPI.uploadMedia(selected.id, files[0])
        : await productsAPI.uploadMediaBulk(selected.id, files);
      const uploadedMedia = Array.isArray(response.data) ? response.data : [response.data];
      const updated = { ...selected, media_files: [...(selected.media_files || []), ...uploadedMedia] };
      setSelected(updated);
      setProducts((p) => p.map((x) => x.id === updated.id ? updated : x));
      toast({ title: `${uploadedMedia.length} media file${uploadedMedia.length > 1 ? "s" : ""} uploaded` });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteMedia = async (mediaId: number) => {
    if (!selected) return;
    await productsAPI.deleteMedia(selected.id, mediaId);
    const updated = { ...selected, media_files: selected.media_files.filter((m: any) => m.id !== mediaId) };
    setSelected(updated);
    setProducts((p) => p.map((x) => x.id === updated.id ? updated : x));
    toast({ title: "Media deleted" });
  };

  const showForm = creating || editing;
  const mediaFiles = selected?.media_files || [];
  const imageCount = useMemo(() => mediaFiles.filter((m: any) => m.file_type === "image").length, [mediaFiles]);
  const videoCount = useMemo(() => mediaFiles.filter((m: any) => m.file_type === "video").length, [mediaFiles]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="mt-1 text-muted-foreground">Manage products and upload the media AI will use for video generation.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={startCreate} disabled={!brandId} className="gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            {products.length === 0 && !creating ? (
              <GlassCard className="p-8 text-center text-muted-foreground">
                <Package className="mx-auto mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm">No products yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={startCreate} disabled={!brandId}>
                  Add First Product
                </Button>
              </GlassCard>
            ) : (
              products.map((p) => (
                <GlassCard
                  key={p.id}
                  className={`cursor-pointer p-4 transition-all ${selected?.id === p.id ? "border-primary/50" : "hover:border-white/20"}`}
                  onClick={() => openProduct(p)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.category || "No category"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{p.media_files?.length || 0} media - {p.price ? `$${p.price}` : "No price"}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </GlassCard>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {selected || creating ? (
              <GlassCard className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{creating ? "New Product" : showForm ? "Edit Product" : selected?.name}</h2>
                  <div className="flex gap-2">
                    {!creating && !editing && (
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
                        <Edit className="h-4 w-4" /> Edit
                      </Button>
                    )}
                    {(editing || creating) && (
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(false); setCreating(false); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {showForm ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Name *</Label>
                        <Input value={form.name} onChange={set("name")} placeholder="Product name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Category</Label>
                        <Input value={form.category} onChange={set("category")} placeholder="Electronics" />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Price (USD)</Label>
                        <Input type="number" value={form.price} onChange={set("price")} placeholder="49.99" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Call to Action</Label>
                        <Input value={form.call_to_action} onChange={set("call_to_action")} placeholder="Shop Now" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea value={form.description} onChange={set("description")} rows={2} placeholder="Short description" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Features (one per line)</Label>
                        <Textarea value={form.features} onChange={set("features")} rows={4} placeholder={"Waterproof\n24hr battery\nCompact"} className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Benefits (one per line)</Label>
                        <Textarea value={form.benefits} onChange={set("benefits")} rows={4} placeholder={"Stay dry\nLast longer\nCarry anywhere"} className="font-mono text-xs" />
                      </div>
                    </div>
                    <Button className="w-full gap-2" onClick={save} disabled={saving}>
                      <Save className="h-4 w-4" /> {saving ? "Saving..." : creating ? "Create Product" : "Save Changes"}
                    </Button>

                    <div className="border-t border-white/10 pt-4">
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">Product Photos and Videos</p>
                            <p className="max-w-2xl text-sm text-muted-foreground">
                              Upload product photos, demo clips, and packaging shots here so the AI can use them as reference for better video generation.
                            </p>
                          </div>
                          {!creating && selected ? (
                            <Button variant="default" size="sm" className="gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                              <Upload className="h-3 w-3" /> {uploading ? "Uploading..." : "Upload Photos or Videos"}
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled className="gap-2">
                              <Upload className="h-3 w-3" /> Save Product First
                            </Button>
                          )}
                        </div>

                        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" multiple onChange={uploadMedia} />

                        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-background/20 p-4 text-sm text-muted-foreground">
                          {creating ? (
                            <span>Create the product first, then this upload area becomes active immediately so you can add product photos and videos.</span>
                          ) : (
                            <span>You can upload multiple photos and videos here. These files will be used by Video Studio as product references.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium">{selected.category || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-medium">{selected.price ? `$${selected.price}` : "-"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Description</p>
                        <p>{selected.description || "-"}</p>
                      </div>
                      {selected.features?.length > 0 && (
                        <div>
                          <p className="mb-1 text-muted-foreground">Features</p>
                          <ul className="space-y-1">{selected.features.map((f: string, i: number) => <li key={i} className="text-sm">* {f}</li>)}</ul>
                        </div>
                      )}
                      {selected.benefits?.length > 0 && (
                        <div>
                          <p className="mb-1 text-muted-foreground">Benefits</p>
                          <ul className="space-y-1">{selected.benefits.map((b: string, i: number) => <li key={i} className="text-sm">* {b}</li>)}</ul>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">AI Video References</p>
                            <p className="max-w-2xl text-sm text-muted-foreground">
                              Upload product photos and product videos here. Video Studio uses these references to create better scenes,
                              stronger product shots, and more accurate AI-generated videos.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.location.href = "/videos"}>
                              <Video className="h-3 w-3" /> Open Video Studio
                            </Button>
                            <Button variant="default" size="sm" className="gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                              <Upload className="h-3 w-3" /> {uploading ? "Uploading..." : "Upload Photos or Videos"}
                            </Button>
                          </div>
                          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" multiple onChange={uploadMedia} />
                        </div>

                        <div className="mb-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total References</p>
                            <p className="mt-1 text-2xl font-semibold">{mediaFiles.length}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Photos</p>
                            <p className="mt-1 text-2xl font-semibold">{imageCount}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Videos</p>
                            <p className="mt-1 text-2xl font-semibold">{videoCount}</p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-white/10 bg-background/20 p-3 text-sm text-muted-foreground">
                          Best results come from clear product photos, packaging shots, close-up detail shots, and short usage demos.
                          Upload multiple references together so the AI has enough context to make stronger ad creatives.
                        </div>
                      </div>

                      <div className="mt-4">
                        {mediaFiles.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {mediaFiles.map((m: any) => (
                              <div key={m.id} className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                <div className="aspect-square overflow-hidden bg-black/20">
                                  {m.file_type === "image" ? (
                                    <img src={m.url} alt={m.filename || selected.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                  ) : (
                                    <video src={m.url} className="h-full w-full object-cover" controls preload="metadata" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-3 p-3 text-xs">
                                  <div className="min-w-0">
                                    <p className="truncate font-medium">{m.filename || `${selected.name} reference`}</p>
                                    <p className="mt-1 text-muted-foreground">{m.file_type === "image" ? "Photo reference" : "Video reference"}</p>
                                  </div>
                                  <button onClick={() => deleteMedia(m.id)} className="rounded-full bg-black/60 p-1 text-white opacity-70 transition-opacity hover:opacity-100">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border-2 border-dashed border-white/10 py-8 text-center text-muted-foreground">
                            <Image className="mx-auto mb-2 h-8 w-8 opacity-20" />
                            <p className="text-sm font-medium">No AI video references uploaded yet</p>
                            <p className="mt-1 text-sm">Add product photos and demo videos so the AI can generate better videos from this product.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            ) : (
              <GlassCard className="p-12 text-center text-muted-foreground">
                <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p>Select a product to view details</p>
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
