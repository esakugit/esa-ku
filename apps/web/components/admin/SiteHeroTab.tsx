"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import {
  DEFAULT_HERO,
  DEFAULT_FOOTER,
  DEFAULT_GOVERNANCE,
  DEFAULT_GALLERY,
} from "@/lib/settings-defaults";

type SubTab = "hero" | "footer" | "governance" | "gallery";

export function SiteHeroTab() {
  const { success, error } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [heroForm, setHeroForm] = useState(DEFAULT_HERO);
  const [footerForm, setFooterForm] = useState(DEFAULT_FOOTER);
  const [governanceForm, setGovernanceForm] = useState(DEFAULT_GOVERNANCE);
  const [galleryList, setGalleryList] = useState(DEFAULT_GALLERY);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          if (data.hero) setHeroForm({ ...DEFAULT_HERO, ...data.hero });
          else if (data.heroTitle) setHeroForm({ ...DEFAULT_HERO, ...data });

          if (data.footer) setFooterForm({ ...DEFAULT_FOOTER, ...data.footer });
          if (data.governance) setGovernanceForm({ ...DEFAULT_GOVERNANCE, ...data.governance });
          if (Array.isArray(data.gallery)) setGalleryList(data.gallery);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleGenericUpload(
    file: File,
    category: string,
    onSuccess: (url: string) => void
  ) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        error(data.error || "Upload failed.");
        return;
      }

      onSuccess(data.url);
      success("Image uploaded successfully!");
    } catch {
      error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function saveSetting(key: string, value: any, successMsg: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      const data = await res.json();
      if (!res.ok) {
        error(data.error || "Failed to update configuration.");
        return;
      }

      success(successMsg);
    } catch {
      error("Network error updating configuration.");
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
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Site Content & Governance Settings</h2>
          <p className="text-xs text-neutral-500">
            Easily update homepage banners, institutional contacts, the Executive Committee roster, and event highlights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-neutral-100 p-1">
          {[
            { id: "hero", label: "🎨 Hero Banner" },
            { id: "footer", label: "📞 Footer & Contacts" },
            { id: "governance", label: "🏛️ ExCom & Patron" },
            { id: "gallery", label: "📸 Event Highlights" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveSubTab(t.id as SubTab)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === t.id
                  ? "bg-white text-ink shadow-xs"
                  : "text-neutral-500 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 1. HERO BANNER CONFIGURATION ──────────────────────────────── */}
      {activeSubTab === "hero" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSetting("hero", heroForm, "Homepage hero updated! Changes are live.");
            }}
            className="card p-5 space-y-4"
          >
            <div>
              <label className="field-label">Institutional Eyebrow</label>
              <input
                required
                className="field-input"
                value={heroForm.heroEyebrow}
                onChange={(e) => setHeroForm({ ...heroForm, heroEyebrow: e.target.value })}
                placeholder="e.g. Kenyatta University · School of Engineering & Architecture"
              />
            </div>

            <div>
              <label className="field-label">Flagship Headline</label>
              <textarea
                required
                rows={2}
                className="field-input font-semibold"
                value={heroForm.heroTitle}
                onChange={(e) => setHeroForm({ ...heroForm, heroTitle: e.target.value })}
                placeholder="Main homepage headline"
              />
            </div>

            <div>
              <label className="field-label">Subheadline / Society Mission</label>
              <textarea
                required
                rows={3}
                className="field-input text-xs"
                value={heroForm.heroSubtitle}
                onChange={(e) => setHeroForm({ ...heroForm, heroSubtitle: e.target.value })}
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
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleGenericUpload(f, "hero", (url) => setHeroForm((prev) => ({ ...prev, heroImageUrl: url })));
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="hero-file-upload"
                    className="btn-primary !py-2 !px-3 !text-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Upload New Image</span>
                  </label>
                  <span className="text-xs text-neutral-400">or enter image path below</span>
                </div>

                <input
                  required
                  className="field-input text-xs font-mono"
                  value={heroForm.heroImageUrl}
                  onChange={(e) => setHeroForm({ ...heroForm, heroImageUrl: e.target.value })}
                  placeholder="/hero-event.svg or https://..."
                />
              </div>
            </div>

            <button type="submit" disabled={saving || uploading} className="btn-primary w-full !py-2.5 cursor-pointer">
              {saving ? "Saving Changes..." : "Publish Hero Changes to Homepage"}
            </button>
          </form>

          {/* Live Preview Card */}
          <div className="card p-5 space-y-3 bg-neutral-900 text-white overflow-hidden relative">
            <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-neutral-800">
              <span>Live Hero Preview</span>
              <span className="text-[11px] rounded bg-neutral-800 px-2 py-0.5 text-neutral-300">Homepage Top</span>
            </div>

            <div
              className="rounded-lg h-56 w-full bg-cover bg-center relative overflow-hidden border border-neutral-800 p-5 flex flex-col justify-end"
              style={{ backgroundImage: `url('${heroForm.heroImageUrl || "/hero-event.svg"}')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
              <div className="relative z-10 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent-muted">
                  {heroForm.heroEyebrow}
                </p>
                <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                  {heroForm.heroTitle}
                </h3>
                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                  {heroForm.heroSubtitle}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              Changes published here update the top of the homepage in real time.
            </p>
          </div>
        </div>
      )}

      {/* ─── 2. FOOTER & EXECUTIVE CONTACTS CONFIGURATION ─────────────── */}
      {activeSubTab === "footer" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSetting("footer", footerForm, "Footer & contacts updated! Reflected across all pages.");
            }}
            className="card p-5 space-y-4"
          >
            <div>
              <label className="field-label">Official ESA Inquiries Email</label>
              <input
                type="email"
                required
                className="field-input"
                value={footerForm.email}
                onChange={(e) => setFooterForm({ ...footerForm, email: e.target.value })}
                placeholder="esa.kenyattauniv@gmail.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">Executive Helpline 1</label>
                <input
                  required
                  className="field-input"
                  value={footerForm.phone1}
                  onChange={(e) => setFooterForm({ ...footerForm, phone1: e.target.value })}
                  placeholder="+254 113 790 205"
                />
              </div>
              <div>
                <label className="field-label">Executive Helpline 2</label>
                <input
                  className="field-input"
                  value={footerForm.phone2}
                  onChange={(e) => setFooterForm({ ...footerForm, phone2: e.target.value })}
                  placeholder="+254 700 850 287"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="field-label">M-Pesa Paybill Number</label>
                <input
                  required
                  className="field-input font-mono font-bold"
                  value={footerForm.paybillNumber ?? "625625"}
                  onChange={(e) =>
                    setFooterForm({
                      ...footerForm,
                      paybillNumber: e.target.value,
                    })
                  }
                  placeholder="625625"
                />
              </div>
              <div>
                <label className="field-label">M-Pesa Account Number</label>
                <input
                  required
                  className="field-input font-mono font-bold"
                  value={footerForm.accountNumber ?? "01521260661100"}
                  onChange={(e) =>
                    setFooterForm({
                      ...footerForm,
                      accountNumber: e.target.value,
                    })
                  }
                  placeholder="01521260661100"
                />
              </div>
              <div>
                <label className="field-label">M-Pesa Business Name</label>
                <input
                  required
                  className="field-input"
                  value={footerForm.paybillName ?? "ESA Kenyatta University"}
                  onChange={(e) =>
                    setFooterForm({
                      ...footerForm,
                      paybillName: e.target.value,
                    })
                  }
                  placeholder="ESA Kenyatta University"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Campus Physical Office Location</label>
              <input
                required
                className="field-input"
                value={footerForm.officeLocation}
                onChange={(e) => setFooterForm({ ...footerForm, officeLocation: e.target.value })}
                placeholder="School of Engineering & Architecture, Main Campus, Thika Road"
              />
            </div>

            <div>
              <label className="field-label">Official Postal Address</label>
              <input
                required
                className="field-input"
                value={footerForm.postalAddress}
                onChange={(e) => setFooterForm({ ...footerForm, postalAddress: e.target.value })}
                placeholder="P.O. Box 43844-00100 Nairobi, Kenya"
              />
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full !py-2.5 cursor-pointer">
              {saving ? "Saving Changes..." : "Save Footer Contacts Across Website"}
            </button>
          </form>

          {/* Footer Preview Box */}
          <div className="card p-5 space-y-3 bg-neutral-900 text-neutral-300">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Live Footer Contacts Preview
            </span>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-2 text-xs">
              <p className="font-bold text-white text-sm">
                Engineering Students Association (ESA-KU)
              </p>
              <p className="text-neutral-400">{footerForm.officeLocation}</p>
              <p className="text-neutral-400">{footerForm.postalAddress}</p>

              <div className="pt-2 border-t border-neutral-800 space-y-1">
                <p>
                  <strong className="text-neutral-400">Official Email:</strong>{" "}
                  <span className="text-white underline">{footerForm.email || "esa.kenyattauniv@gmail.com"}</span>
                </p>
                <p>
                  <strong className="text-neutral-400">M-Pesa Paybill:</strong>{" "}
                  <span className="font-mono text-accent-muted font-bold">
                    {footerForm.paybillNumber || "625625"}
                  </span>{" "}
                  · <strong className="text-neutral-400">Acc:</strong>{" "}
                  <span className="font-mono text-white font-bold">
                    {footerForm.accountNumber || "01521260661100"}
                  </span>{" "}
                  ({footerForm.paybillName || "ESA Kenyatta University"})
                </p>
                <p>
                  <strong className="text-neutral-400">Helplines:</strong>{" "}
                  <span className="text-neutral-200">{footerForm.phone1} · {footerForm.phone2}</span>
                </p>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              When the executive committee changes or phone numbers rotate next year, updating this form updates the footer on every single page automatically.
            </p>
          </div>
        </div>
      )}

      {/* ─── 3. EXECUTIVE COMMITTEE & PATRON CONFIGURATION ─────────────── */}
      {activeSubTab === "governance" && (
        <div className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSetting("governance", governanceForm, "Executive Committee & Patron updated!");
            }}
            className="space-y-6"
          >
            {/* Academic Year Label */}
            <div className="card p-5">
              <label className="field-label">Current Governance Term / Academic Year</label>
              <input
                required
                className="field-input font-bold max-w-sm"
                value={governanceForm.academicYear}
                onChange={(e) => setGovernanceForm({ ...governanceForm, academicYear: e.target.value })}
                placeholder="e.g. 2025/2026 Academic Year"
              />
            </div>

            {/* Staff Patron Details */}
            <div className="card p-5 space-y-4 border-accent/30 bg-accent-soft/20">
              <div className="flex items-center justify-between border-b border-accent/20 pb-2">
                <h3 className="text-sm font-bold text-ink">Staff Patron & Academic Advisor</h3>
                <span className="text-xs text-accent font-semibold">Faculty Guidance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Patron Full Name & Title</label>
                  <input
                    required
                    className="field-input font-bold"
                    value={governanceForm.patron.name}
                    onChange={(e) =>
                      setGovernanceForm({
                        ...governanceForm,
                        patron: { ...governanceForm.patron, name: e.target.value },
                      })
                    }
                    placeholder="e.g. Dr. Eng. Shadrack Mambo"
                  />
                </div>
                <div>
                  <label className="field-label">Official University Position</label>
                  <input
                    required
                    className="field-input"
                    value={governanceForm.patron.title}
                    onChange={(e) =>
                      setGovernanceForm({
                        ...governanceForm,
                        patron: { ...governanceForm.patron, title: e.target.value },
                      })
                    }
                    placeholder="e.g. Staff Patron & Senior Lecturer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Department / School</label>
                  <input
                    required
                    className="field-input"
                    value={governanceForm.patron.department}
                    onChange={(e) =>
                      setGovernanceForm({
                        ...governanceForm,
                        patron: { ...governanceForm.patron, department: e.target.value },
                      })
                    }
                    placeholder="School of Engineering & Architecture"
                  />
                </div>
                <div>
                  <label className="field-label">Photo Image (Optional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="patron-photo-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          handleGenericUpload(f, "excom", (url) =>
                            setGovernanceForm({
                              ...governanceForm,
                              patron: { ...governanceForm.patron, photoBlobUrl: url },
                            })
                          );
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="patron-photo-upload"
                      className="btn-secondary !py-2 !px-3 !text-xs cursor-pointer"
                    >
                      Upload Photo
                    </label>
                    <input
                      className="field-input text-xs font-mono flex-1"
                      value={governanceForm.patron.photoBlobUrl || ""}
                      onChange={(e) =>
                        setGovernanceForm({
                          ...governanceForm,
                          patron: { ...governanceForm.patron, photoBlobUrl: e.target.value },
                        })
                      }
                      placeholder="Photo URL or leave blank for crest"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="field-label">Patron's Institutional Message / Quote</label>
                <textarea
                  rows={2}
                  className="field-input text-xs"
                  value={governanceForm.patron.message}
                  onChange={(e) =>
                    setGovernanceForm({
                      ...governanceForm,
                      patron: { ...governanceForm.patron, message: e.target.value },
                    })
                  }
                  placeholder="Inspiring quote for students"
                />
              </div>
            </div>

            {/* Executive Committee (ExCom) Roster */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-ink">Executive Committee (ExCom) Roster</h3>
                  <p className="text-xs text-neutral-500">Student leaders currently serving in office</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setGovernanceForm({
                      ...governanceForm,
                      members: [
                        ...governanceForm.members,
                        {
                          name: "",
                          role: "Committee Member",
                          department: "Engineering Discipline",
                          photoBlobUrl: "",
                        },
                      ],
                    });
                  }}
                  className="btn-secondary !text-xs cursor-pointer"
                >
                  + Add Committee Role
                </button>
              </div>

              <div className="space-y-3">
                {governanceForm.members.map((member: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-accent uppercase tracking-wider">
                        Leader #{idx + 1}
                      </span>
                      {governanceForm.members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...governanceForm.members];
                            next.splice(idx, 1);
                            setGovernanceForm({ ...governanceForm, members: next });
                          }}
                          className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="field-label">Full Name</label>
                        <input
                          required
                          className="field-input font-bold text-xs"
                          value={member.name}
                          onChange={(e) => {
                            const next = [...governanceForm.members];
                            next[idx].name = e.target.value;
                            setGovernanceForm({ ...governanceForm, members: next });
                          }}
                          placeholder="e.g. Brian Otieno"
                        />
                      </div>
                      <div>
                        <label className="field-label">Executive Role / Office</label>
                        <input
                          required
                          className="field-input text-xs font-semibold"
                          value={member.role}
                          onChange={(e) => {
                            const next = [...governanceForm.members];
                            next[idx].role = e.target.value;
                            setGovernanceForm({ ...governanceForm, members: next });
                          }}
                          placeholder="e.g. President / Chairperson"
                        />
                      </div>
                      <div>
                        <label className="field-label">Engineering Department</label>
                        <input
                          required
                          className="field-input text-xs"
                          value={member.department}
                          onChange={(e) => {
                            const next = [...governanceForm.members];
                            next[idx].department = e.target.value;
                            setGovernanceForm({ ...governanceForm, members: next });
                          }}
                          placeholder="e.g. Civil Engineering"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="field-label">Leader Photo (Optional)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id={`member-photo-${idx}`}
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleGenericUpload(f, "excom", (url) => {
                                const next = [...governanceForm.members];
                                next[idx].photoBlobUrl = url;
                                setGovernanceForm({ ...governanceForm, members: next });
                              });
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor={`member-photo-${idx}`}
                          className="btn-secondary !py-1.5 !px-2.5 !text-xs cursor-pointer"
                        >
                          Upload Photo
                        </label>
                        <input
                          className="field-input text-xs font-mono flex-1"
                          value={member.photoBlobUrl || ""}
                          onChange={(e) => {
                            const next = [...governanceForm.members];
                            next[idx].photoBlobUrl = e.target.value;
                            setGovernanceForm({ ...governanceForm, members: next });
                          }}
                          placeholder="Image URL or leave empty for initials"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving || uploading}
                className="btn-primary w-full !py-2.5 cursor-pointer mt-4"
              >
                {saving ? "Saving Changes..." : "Publish Governance & ExCom to Homepage"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── 4. EVENT HIGHLIGHTS GALLERY CONFIGURATION ─────────────────── */}
      {activeSubTab === "gallery" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-ink">Campus Life & Event Highlights</h3>
              <p className="text-xs text-neutral-500">Showcase recent moments, expos, hackathons, and industrial field tours</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setGalleryList([
                  ...galleryList,
                  {
                    id: String(Date.now()),
                    title: "New Event Highlight",
                    category: "Workshop / Summit",
                    date: "Recent Term",
                    imageUrl: "/hero-event.svg",
                    caption: "Brief descriptive summary of this event moment.",
                  },
                ]);
              }}
              className="btn-secondary !text-xs cursor-pointer"
            >
              + Add Event Moment
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSetting("gallery", galleryList, "Event Highlights Gallery published to Homepage!");
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {galleryList.map((item: any, idx: number) => (
                <div key={item.id || idx} className="card p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span className="text-xs font-black text-accent uppercase">
                      Moment #{idx + 1}
                    </span>
                    {galleryList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...galleryList];
                          next.splice(idx, 1);
                          setGalleryList(next);
                        }}
                        className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="field-label">Event Title</label>
                      <input
                        required
                        className="field-input font-bold text-xs"
                        value={item.title}
                        onChange={(e) => {
                          const next = [...galleryList];
                          next[idx].title = e.target.value;
                          setGalleryList(next);
                        }}
                        placeholder="e.g. Annual Engineering Summit"
                      />
                    </div>
                    <div>
                      <label className="field-label">Category Tag</label>
                      <input
                        required
                        className="field-input text-xs"
                        value={item.category}
                        onChange={(e) => {
                          const next = [...galleryList];
                          next[idx].category = e.target.value;
                          setGalleryList(next);
                        }}
                        placeholder="e.g. Flagship Summit"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="field-label">Date / Term</label>
                      <input
                        required
                        className="field-input text-xs"
                        value={item.date}
                        onChange={(e) => {
                          const next = [...galleryList];
                          next[idx].date = e.target.value;
                          setGalleryList(next);
                        }}
                        placeholder="e.g. November 2025"
                      />
                    </div>
                    <div>
                      <label className="field-label">Upload Highlight Image</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="file"
                          id={`gallery-photo-${idx}`}
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleGenericUpload(f, "gallery", (url) => {
                                const next = [...galleryList];
                                next[idx].imageUrl = url;
                                setGalleryList(next);
                              });
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor={`gallery-photo-${idx}`}
                          className="btn-secondary !py-1.5 !px-2.5 !text-xs cursor-pointer shrink-0"
                        >
                          Upload
                        </label>
                        <input
                          required
                          className="field-input text-xs font-mono"
                          value={item.imageUrl}
                          onChange={(e) => {
                            const next = [...galleryList];
                            next[idx].imageUrl = e.target.value;
                            setGalleryList(next);
                          }}
                          placeholder="/image.png or URL"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Descriptive Caption</label>
                    <textarea
                      required
                      rows={2}
                      className="field-input text-xs"
                      value={item.caption}
                      onChange={(e) => {
                        const next = [...galleryList];
                        next[idx].caption = e.target.value;
                        setGalleryList(next);
                      }}
                      placeholder="Brief note on what happened during this event"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              className="btn-primary w-full !py-2.5 cursor-pointer mt-4"
            >
              {saving ? "Saving..." : "Publish Event Highlights to Homepage"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
