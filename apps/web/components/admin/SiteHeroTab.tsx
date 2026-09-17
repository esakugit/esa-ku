"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

type HeroSettings = {
  heroTitle: string;
  heroSubtitle: string;
  heroEyebrow: string;
  heroImageUrl: string;
  heroBadgeText?: string;
};

export function SiteHeroTab() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<HeroSettings>({
    heroTitle: "Advancing Engineering Excellence, Innovation & Technical Leadership",
    heroSubtitle:
      "The official academic and professional society representing Kenyatta University engineering scholars across Civil, Electrical, Mechanical, Agricultural, and Aerospace disciplines.",
    heroEyebrow: "Kenyatta University · School of Engineering & Architecture",
    heroImageUrl: "/hero-event.svg",
    heroBadgeText: "Official ESA Student Society",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.heroTitle) {
          setForm({
            heroTitle: data.heroTitle,
            heroSubtitle: data.heroSubtitle,
            heroEyebrow: data.heroEyebrow,
            heroImageUrl: data.heroImageUrl,
            heroBadgeText: data.heroBadgeText || "Official ESA Student Society",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "hero");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        error(data.error || "Upload failed.");
        return;
      }

      setForm((prev) => ({ ...prev, heroImageUrl: data.url }));
      success("Hero image uploaded successfully!");
    } catch {
      error("Failed to upload image. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        error(data.error || "Failed to update settings.");
        return;
      }

      success("Homepage hero updated successfully! Changes are live.");
    } catch {
      error("Error updating settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-8 text-center text-sm text-neutral-500">
        Loading site configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-ink">Homepage Hero & Branding Settings</h2>
        <p className="text-xs text-neutral-500">
          Future ESA leaders can update the homepage banner image, official headline, and institutional descriptions here without code changes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div>
            <label className="field-label">Institutional Eyebrow</label>
            <input
              required
              className="field-input"
              value={form.heroEyebrow}
              onChange={(e) => setForm({ ...form, heroEyebrow: e.target.value })}
              placeholder="e.g. Kenyatta University · School of Engineering & Architecture"
            />
          </div>

          <div>
            <label className="field-label">Flagship Headline</label>
            <textarea
              required
              rows={2}
              className="field-input font-semibold"
              value={form.heroTitle}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
              placeholder="Main homepage headline"
            />
          </div>

          <div>
            <label className="field-label">Subheadline / Society Mission</label>
            <textarea
              required
              rows={3}
              className="field-input text-xs"
              value={form.heroSubtitle}
              onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              placeholder="Descriptive paragraph about ESA and KU engineering"
            />
          </div>

          <div>
            <label className="field-label">Hero Background Image</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="hero-file-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="hero-file-upload"
                  className="btn-primary !py-2 !px-3 !text-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {uploading ? "Uploading..." : "Upload New Image"}
                </label>
                <span className="text-xs text-neutral-400">or enter an image URL below</span>
              </div>

              <input
                required
                className="field-input text-xs font-mono"
                value={form.heroImageUrl}
                onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
                placeholder="/hero-event.svg or https://..."
              />
            </div>
          </div>

          <button type="submit" disabled={saving || uploading} className="btn-primary w-full !py-2.5">
            {saving ? "Saving Changes..." : "Publish Hero Changes to Homepage"}
          </button>
        </form>

        {/* Live Preview Card */}
        <div className="card p-5 space-y-3 bg-neutral-900 text-white overflow-hidden relative">
          <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-neutral-800">
            <span>Live Hero Preview</span>
            <span className="text-[11px] rounded bg-neutral-800 px-2 py-0.5 text-neutral-300">Desktop / Mobile View</span>
          </div>

          {/* Background container */}
          <div
            className="rounded-lg h-56 w-full bg-cover bg-center relative overflow-hidden border border-neutral-800 p-5 flex flex-col justify-end"
            style={{ backgroundImage: `url('${form.heroImageUrl || "/hero-event.svg"}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
            <div className="relative z-10 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent-muted">
                {form.heroEyebrow}
              </p>
              <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                {form.heroTitle}
              </h3>
              <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                {form.heroSubtitle}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400">
            Preview reflects what prospective students and visitors will see at the top of <code className="text-white">/</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
