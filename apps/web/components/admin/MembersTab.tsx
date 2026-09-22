"use client";

import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/components/Toast";

type Member = {
  id: number;
  fullName: string;
  email: string;
  regNo: string | null;
  role: "student" | "class_rep" | "club_admin" | "esa_admin" | "super_admin";
  photoBlobUrl: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  department: { id: number; name: string; code: string } | null;
  cohort: { id: number; label: string; entryYear: number } | null;
  badge: {
    id: number;
    badgeNumber: string | null;
    status: "pending_verification" | "active" | "expired" | "rejected";
    paymentReference: string;
    academicYear: string | null;
    approvedAt: string | null;
  } | null;
};

type Stats = {
  total: number;
  verified: number;
  activeBadges: number;
  pendingBadges: number;
};

export function MembersTab() {
  const { success, error: toastError } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Action modals/states
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [badgeModalMember, setBadgeModalMember] = useState<Member | null>(null);
  const [customBadgeNumber, setCustomBadgeNumber] = useState("");
  const [roleModalMember, setRoleModalMember] = useState<Member | null>(null);
  const [newRole, setNewRole] = useState<string>("student");
  const [clubs, setClubs] = useState<{ id: number; name: string }[]>([]);
  const [cohorts, setCohorts] = useState<{ id: number; label: string }[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number>(1);
  const [selectedCohortId, setSelectedCohortId] = useState<number>(1);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadMembers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load members");
      const data = await res.json();
      setMembers(data.users || []);
      setStats(data.stats || null);
    } catch (err: any) {
      toastError("Could not load members", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
    fetch("/api/clubs")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setClubs(data);
          if (data.length > 0) setSelectedClubId(data[0].id);
        }
      })
      .catch(() => {});
    fetch("/api/cohorts")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setCohorts(data);
          if (data.length > 0) setSelectedCohortId(data[0].id);
        }
      })
      .catch(() => {});
  }, [roleFilter, statusFilter]);

  // Debounced or on-submit search
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadMembers();
  }

  async function handleVerifyEmail(member: Member) {
    if (!confirm(`Mark email as verified for ${member.fullName} (${member.email})?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_email" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify email");
      success("Email verified", `${member.fullName}'s account is now verified.`);
      loadMembers();
    } catch (err: any) {
      toastError("Error verifying email", err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssignBadge(autoGenerate: boolean = false) {
    if (!badgeModalMember) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${badgeModalMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_badge",
          badgeNumber: autoGenerate ? undefined : customBadgeNumber.trim() || undefined,
          status: "active",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign badge");
      success("ESA Badge activated", `Badge No. ${data.badgeNumber} assigned to ${badgeModalMember.fullName}.`);
      setBadgeModalMember(null);
      setCustomBadgeNumber("");
      loadMembers();
    } catch (err: any) {
      toastError("Badge assignment failed", err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleChangeRole() {
    if (!roleModalMember) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${roleModalMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_role",
          role: newRole,
          clubId: newRole === "club_admin" ? selectedClubId : undefined,
          cohortId: newRole === "class_rep" ? selectedCohortId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      success("Role updated", `${roleModalMember.fullName} is now ${newRole.replace("_", " ")}.`);
      setRoleModalMember(null);
      loadMembers();
    } catch (err: any) {
      toastError("Role update failed", err.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Members</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Verified Accounts</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{stats.verified}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Active Badges</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{stats.activeBadges}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Badges</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{stats.pendingBadges}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              className="field-input w-full pl-9"
              placeholder="Search by name, email, reg no, or badge no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="pointer-events-none absolute left-3 top-2.5 text-neutral-400">🔍</span>
          </div>

          <div className="flex gap-2">
            <select
              className="field-input py-2 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="class_rep">Class Rep</option>
              <option value="club_admin">Club Admin</option>
              <option value="esa_admin">ESA Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>

            <select
              className="field-input py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Badge Statuses</option>
              <option value="active">Active Badge</option>
              <option value="pending">Pending Approval</option>
              <option value="unregistered">No Badge</option>
            </select>

            <button type="submit" className="btn-primary shrink-0 px-4 py-2 text-sm">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">
              Members Directory ({members.length})
            </h3>
            <button
              onClick={loadMembers}
              disabled={loading}
              className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
            >
              Refresh list
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-500">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No members found matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50/50 text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Reg No & Dept</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">ESA Badge</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {members.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-neutral-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 font-bold text-accent">
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{m.fullName}</p>
                          <p className="truncate text-xs text-neutral-500">{m.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium text-ink">{m.regNo || "—"}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {m.department ? m.department.name : "No department"}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.role === "super_admin"
                            ? "bg-purple-100 text-purple-800"
                            : m.role === "esa_admin"
                            ? "bg-blue-100 text-blue-800"
                            : m.role === "club_admin"
                            ? "bg-amber-100 text-amber-800"
                            : m.role === "class_rep"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {m.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {m.badge?.badgeNumber ? (
                        <div>
                          <span className="font-mono text-xs font-bold text-ink">
                            {m.badge.badgeNumber}
                          </span>
                          <span
                            className={`ml-2 inline-flex rounded-full px-1.5 py-0.2 text-[10px] font-semibold uppercase ${
                              m.badge.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : m.badge.status === "pending_verification"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {m.badge.status.replace("_", " ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">No badge issued</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {m.emailVerifiedAt ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          ✓ Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerifyEmail(m)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                          title="Click to manually verify member's email"
                        >
                          ✉ Verify Email
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setBadgeModalMember(m);
                            setCustomBadgeNumber(m.badge?.badgeNumber || "");
                          }}
                          className="rounded border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-ink shadow-sm hover:bg-neutral-50"
                        >
                          {m.badge?.status === "active" ? "Edit Badge" : "Issue / Activate"}
                        </button>

                        {m.role !== "super_admin" && (
                          <button
                            onClick={() => {
                              setRoleModalMember(m);
                              setNewRole(m.role);
                            }}
                            className="rounded border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
                          >
                            Role
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Badge Assignment / Edit Modal */}
      {badgeModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-ink">
              {badgeModalMember.badge?.status === "active" ? "Manage ESA Badge" : "Issue / Activate ESA Badge"}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Member: <span className="font-semibold text-ink">{badgeModalMember.fullName}</span> ({badgeModalMember.email})
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="field-label">Custom Badge Number</label>
                <input
                  type="text"
                  placeholder="e.g. ESA-1042 (Leave blank to auto-generate)"
                  className="field-input font-mono uppercase"
                  value={customBadgeNumber}
                  onChange={(e) => setCustomBadgeNumber(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Matches ESA physical membership card format. If blank, a unique number will be generated.
                </p>
              </div>

              {badgeModalMember.badge?.paymentReference && (
                <div className="rounded-lg bg-neutral-50 p-2 text-xs text-neutral-600">
                  <span className="font-semibold">M-Pesa Reference:</span> {badgeModalMember.badge.paymentReference}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => handleAssignBadge(false)}
                disabled={actionLoading}
                className="btn-primary flex-1 py-2 text-xs"
              >
                {actionLoading ? "Processing..." : customBadgeNumber.trim() ? "Assign Custom No." : "Auto-Generate & Activate"}
              </button>
              <button
                onClick={() => setBadgeModalMember(null)}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {roleModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-ink">Change Member Role</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Updating role for: <span className="font-semibold text-ink">{roleModalMember.fullName}</span>
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="field-label">System Role</label>
                <select
                  className="field-input w-full"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="student">Student (Standard Member)</option>
                  <option value="class_rep">Class Representative (Timetable Editor)</option>
                  <option value="club_admin">Club Admin (Society Head / Event Creator)</option>
                  <option value="esa_admin">ESA Administrator</option>
                </select>
              </div>

              {newRole === "club_admin" && (
                <div>
                  <label className="field-label">Assigned Technical Society / Club</label>
                  <select
                    className="field-input w-full"
                    value={selectedClubId}
                    onChange={(e) => setSelectedClubId(Number(e.target.value))}
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Gives this member direct permission to create and manage events for this society.
                  </p>
                </div>
              )}

              {newRole === "class_rep" && (
                <div>
                  <label className="field-label">Assigned Cohort / Class</label>
                  <select
                    className="field-input w-full"
                    value={selectedCohortId}
                    onChange={(e) => setSelectedCohortId(Number(e.target.value))}
                  >
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Gives this class rep permission to update and edit class schedules for this cohort.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleChangeRole}
                disabled={actionLoading}
                className="btn-primary flex-1 py-2 text-xs"
              >
                {actionLoading ? "Updating..." : "Save Role"}
              </button>
              <button
                onClick={() => setRoleModalMember(null)}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
