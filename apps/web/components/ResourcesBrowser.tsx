"use client";

import { useEffect, useState } from "react";

type Department = { id: number; name: string; code: string };
type Course = { id: number; code: string; name: string };
type Resource = {
  id: number;
  type: string;
  title: string;
  blobUrl: string;
  academicYear: string | null;
  examType: string | null;
  course: Course | null;
  department: Department;
  fileSizeBytes: number | null;
};

const TYPE_LABELS: Record<string, string> = {
  past_paper: "Past paper",
  notes: "Notes",
  slides: "Slides",
  other: "Other",
};

export function ResourcesBrowser({ defaultDepartmentId }: { defaultDepartmentId: number | null }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ? String(defaultDepartmentId) : "");
  const [courseId, setCourseId] = useState("");
  const [type, setType] = useState("");
  const [rows, setRows] = useState<Resource[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then(setDepartments);
  }, []);

  useEffect(() => {
    if (departmentId) {
      fetch(`/api/courses?departmentId=${departmentId}`).then((r) => r.json()).then(setCourses);
    } else {
      setCourses([]);
    }
    setCourseId("");
  }, [departmentId]);

  function load() {
    const params = new URLSearchParams();
    if (departmentId) params.set("departmentId", departmentId);
    if (courseId) params.set("courseId", courseId);
    if (type) params.set("type", type);
    fetch(`/api/resources?${params}`).then((r) => r.json()).then(setRows);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId, courseId, type]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <select className="field-input col-span-2 sm:col-span-1" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select className="field-input" value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={!departmentId}>
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>
        <select className="field-input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <button onClick={() => setShowUpload((v) => !v)} className="btn-secondary mb-4 w-full">
        {showUpload ? "Cancel upload" : "+ Upload a resource"}
      </button>
      {showUpload && (
        <UploadForm
          departments={departments}
          defaultDepartmentId={departmentId}
          onUploaded={() => {
            setShowUpload(false);
            load();
          }}
        />
      )}

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{r.title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {TYPE_LABELS[r.type]}
                  {r.course ? ` · ${r.course.code}` : ""}
                  {r.academicYear ? ` · ${r.academicYear}` : ""}
                  {r.examType ? ` · ${r.examType.replace("_", " ")}` : ""}
                </p>
              </div>
              <a href={r.blobUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary whitespace-nowrap px-3 py-1.5 text-xs">
                Download
              </a>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
            Nothing here yet — be the first to upload.
          </p>
        )}
      </ul>
    </div>
  );
}

function UploadForm({
  departments,
  defaultDepartmentId,
  onUploaded,
}: {
  departments: Department[];
  defaultDepartmentId: string;
  onUploaded: () => void;
}) {
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("past_paper");
  const [academicYear, setAcademicYear] = useState("");
  const [examType, setExamType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (departmentId) fetch(`/api/courses?departmentId=${departmentId}`).then((r) => r.json()).then(setCourses);
  }, [departmentId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Choose a file.");
    if (!departmentId) return setError("Pick a department.");
    setLoading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("title", title);
      form.set("type", type);
      form.set("departmentId", departmentId);
      if (courseId) form.set("courseId", courseId);
      if (academicYear) form.set("academicYear", academicYear);
      if (examType) form.set("examType", examType);

      const res = await fetch("/api/resources", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      onUploaded();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mb-4 space-y-3 p-4">
      <input required className="field-input" placeholder="Title, e.g. EEE 301 CAT 1 2025" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="flex gap-3">
        <select className="field-input flex-1" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select className="field-input flex-1" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Course (optional)</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <select className="field-input flex-1" value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select className="field-input flex-1" value={examType} onChange={(e) => setExamType(e.target.value)}>
          <option value="">Exam type (optional)</option>
          <option value="cat_1">CAT 1</option>
          <option value="cat_2">CAT 2</option>
          <option value="main_exam">Main exam</option>
          <option value="assignment">Assignment</option>
        </select>
      </div>
      <input className="field-input" placeholder="Academic year, e.g. 2025/2026" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
      <input required type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="field-input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Uploading..." : "Submit for review"}
      </button>
      <p className="text-xs text-neutral-400">An ESA admin reviews uploads before they appear for everyone.</p>
    </form>
  );
}
