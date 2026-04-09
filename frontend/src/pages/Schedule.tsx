import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Send, Trash2, CheckCircle2, XCircle, Clapperboard } from "lucide-react";

import Navigation from "@/components/Navigation";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brandsAPI, contentAPI, socialAPI, videosAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-amber-500/20 text-amber-400",
  posted: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
  cancelled: "bg-muted text-muted-foreground",
};

export default function Schedule() {
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [videoProjects, setVideoProjects] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    content_item_id: "",
    video_project_id: "",
    social_account_id: "",
    platform: "",
    caption: "",
    hashtags: "",
    scheduled_at: "",
  });

  useEffect(() => {
    brandsAPI.list().then((r) => {
      setBrands(r.data);
      if (r.data[0]) setBrandId(String(r.data[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    socialAPI.listScheduled().then((r) => setPosts(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!brandId) return;
    socialAPI.listAccounts(Number(brandId)).then((r) => setAccounts(r.data)).catch(() => {});
    contentAPI.list({ brand_id: Number(brandId), status: "approved" }).then((r) => setContentItems(r.data)).catch(() => {});
    videosAPI.list({ brand_id: Number(brandId), limit: 20 }).then((r) => setVideoProjects(r.data)).catch(() => {});
  }, [brandId]);

  const selectedVideo = useMemo(
    () => videoProjects.find((item) => String(item.id) === form.video_project_id),
    [videoProjects, form.video_project_id],
  );

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const chooseContent = (value: string) => {
    if (value === "__none") {
      setForm((p) => ({ ...p, content_item_id: "" }));
      return;
    }

    const item = contentItems.find((entry) => String(entry.id) === value);
    setForm((p) => ({
      ...p,
      content_item_id: value,
      caption: item?.content || p.caption,
    }));
  };

  const chooseVideo = (value: string) => {
    if (value === "__none") {
      setForm((p) => ({ ...p, video_project_id: "" }));
      return;
    }

    const project = videoProjects.find((entry) => String(entry.id) === value);
    setForm((p) => ({
      ...p,
      video_project_id: value,
      caption: project?.caption || p.caption,
      hashtags: (project?.hashtags || []).join(" "),
      platform: p.platform || project?.platform || p.platform,
    }));
  };

  const submit = async () => {
    if (!form.social_account_id || !form.scheduled_at) {
      toast({ title: "Select account and date/time", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const hashtags = form.hashtags
        .split(/[\s,]+/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

      await socialAPI.schedulePost({
        content_item_id: form.content_item_id ? Number(form.content_item_id) : undefined,
        video_project_id: form.video_project_id ? Number(form.video_project_id) : undefined,
        social_account_id: Number(form.social_account_id),
        platform: form.platform,
        caption: form.caption || undefined,
        media_urls: selectedVideo?.preview_url
          ? [selectedVideo.preview_url]
          : (selectedVideo?.source_media || []).slice(0, 4),
        hashtags: hashtags.length ? hashtags : undefined,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      });

      toast({ title: "Post scheduled!" });
      setForm({
        content_item_id: "",
        video_project_id: "",
        social_account_id: "",
        platform: "",
        caption: "",
        hashtags: "",
        scheduled_at: "",
      });
      socialAPI.listScheduled().then((r) => setPosts(r.data)).catch(() => {});
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.detail || "Failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: number) => {
    try {
      await socialAPI.cancelPost(id);
      setPosts((items) => items.map((item) => (item.id === id ? { ...item, status: "cancelled" } : item)));
      toast({ title: "Post cancelled" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const publishNow = async (id: number) => {
    try {
      await socialAPI.publishNow(id);
      socialAPI.listScheduled().then((r) => setPosts(r.data));
      toast({ title: "Published!" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.response?.data?.detail, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Schedule Posts</h1>
          <p className="mt-1 text-muted-foreground">
            Turn approved copy and generated video campaigns into queued social posts.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <GlassCard className="h-fit p-6 lg:col-span-2">
            <h2 className="mb-5 text-lg font-semibold">New Scheduled Post</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => <SelectItem key={brand.id} value={String(brand.id)}>{brand.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Social Account</Label>
                {accounts.filter((account) => account.is_connected).length > 0 ? (
                  <Select
                    value={form.social_account_id}
                    onValueChange={(value) => {
                      const account = accounts.find((entry) => String(entry.id) === value);
                      setForm((p) => ({ ...p, social_account_id: value, platform: account?.platform || "" }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((account) => account.is_connected)
                        .map((account) => (
                          <SelectItem key={account.id} value={String(account.id)}>
                            {account.platform} - {account.account_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                    No connected accounts. Connect one in Settings.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Approved Content</Label>
                <Select value={form.content_item_id || "__none"} onValueChange={chooseContent}>
                  <SelectTrigger><SelectValue placeholder="Choose content" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">- None -</SelectItem>
                    {contentItems.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.title || `${item.content_type} - ${item.platform}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Video Campaign</Label>
                <Select value={form.video_project_id || "__none"} onValueChange={chooseVideo}>
                  <SelectTrigger><SelectValue placeholder="Choose generated video" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">- None -</SelectItem>
                    {videoProjects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.title} - {project.platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVideo && (
                  <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-50">
                    <div className="flex items-center gap-2 font-medium">
                      <Clapperboard className="h-4 w-4" />
                      {selectedVideo.title}
                    </div>
                    <p className="mt-1 text-cyan-100/80">
                      This post will use the generated caption and attach the campaign preview media.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Caption</Label>
                <Textarea value={form.caption} onChange={set("caption")} rows={4} placeholder="Write your caption here..." />
              </div>

              <div className="space-y-1.5">
                <Label>Hashtags</Label>
                <Input value={form.hashtags} onChange={set("hashtags")} placeholder="#marketing #brand #ai" />
              </div>

              <div className="space-y-1.5">
                <Label>Schedule Date & Time</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={set("scheduled_at")} />
              </div>

              <Button className="w-full gap-2" onClick={submit} disabled={submitting || !accounts.length}>
                <Calendar className="h-4 w-4" />
                {submitting ? "Scheduling..." : "Schedule Post"}
              </Button>
            </div>
          </GlassCard>

          <div className="space-y-4 lg:col-span-3">
            <h2 className="text-lg font-semibold">All Scheduled Posts</h2>
            {posts.length === 0 ? (
              <GlassCard className="p-12 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p>No posts scheduled yet</p>
              </GlassCard>
            ) : (
              posts.map((post) => (
                <GlassCard key={post.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                      <Send className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium capitalize text-sm">{post.platform}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[post.status] || STATUS_STYLE.scheduled}`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{post.caption || "No caption"}</p>
                      {post.media_urls?.length > 0 && (
                        <p className="mt-1 text-xs text-cyan-300">
                          Includes {post.media_urls.length} media asset{post.media_urls.length > 1 ? "s" : ""}
                        </p>
                      )}
                      {post.hashtags?.length > 0 && <p className="mt-1 text-xs text-primary">{post.hashtags.slice(0, 5).join(" ")}</p>}
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(post.scheduled_at).toLocaleString()}</span>
                      </div>
                      {post.error_message && <p className="mt-1 text-xs text-red-400">{post.error_message}</p>}
                      {post.post_url && (
                        <a href={post.post_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                          View Post
                        </a>
                      )}
                    </div>
                    {post.status === "scheduled" && (
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => publishNow(post.id)}>
                          <Send className="h-3 w-3" />
                          Now
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => cancel(post.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {post.status === "posted" && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />}
                    {post.status === "failed" && <XCircle className="h-5 w-5 shrink-0 text-red-400" />}
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
