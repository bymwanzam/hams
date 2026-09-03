import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AccessRestricted } from "@/components/ui";
import { hasAuditAccess } from "./access";
import {
  auditActionLabel,
  auditActionTone,
  auditActorText,
  auditDetailText,
} from "./labels";

const PAGE_SIZE = 50;

type SP = {
  actor?: string;
  entity?: string;
  action?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: string;
};

const TONE_CLASS: Record<string, string> = {
  neutral: "tag tag-neutral",
  info: "tag tag-info",
  success: "tag tag-success",
  danger: "tag tag-danger",
  critical: "tag tag-critical",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  if (!(await hasAuditAccess())) {
    return (
      <AccessRestricted title="Audit Trail & Activity Logs">
        The audit trail is available to administrators and IT support only.
      </AccessRestricted>
    );
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.AuditLogWhereInput = {};
  if (sp.actor) where.userId = sp.actor;
  if (sp.entity) where.entity = sp.entity;
  if (sp.action) where.action = sp.action;
  if (sp.q) where.entityId = { contains: sp.q, mode: "insensitive" };
  if (sp.from || sp.to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (sp.from) createdAt.gte = new Date(sp.from);
    if (sp.to) createdAt.lt = new Date(new Date(sp.to).getTime() + 86_400_000);
    where.createdAt = createdAt;
  }

  const [entries, total, entityGroups, actionGroups, actors] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ["entity"], orderBy: { entity: "asc" } }),
    prisma.auditLog.groupBy({ by: ["action"], orderBy: { action: "asc" } }),
    prisma.user.findMany({
      where: { auditLogs: { some: {} } },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(
    sp.actor || sp.entity || sp.action || sp.from || sp.to || sp.q
  );

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (sp.actor) p.set("actor", sp.actor);
    if (sp.entity) p.set("entity", sp.entity);
    if (sp.action) p.set("action", sp.action);
    if (sp.from) p.set("from", sp.from);
    if (sp.to) p.set("to", sp.to);
    if (sp.q) p.set("q", sp.q);
    p.set("page", String(n));
    return `/dashboard/audit?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Audit Trail &amp; Activity Logs</h1>
        <p className="text-muted">
          Sign-in history, data changes and system activity. Read-only.
        </p>
      </div>

      <form className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <label className="block">
          <span className="form-label">User</span>
          <select name="actor" defaultValue={sp.actor ?? ""} className="input input-sm">
            <option value="">Anyone</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.firstName} {a.lastName} · {a.role}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="form-label">Entity</span>
          <select name="entity" defaultValue={sp.entity ?? ""} className="input input-sm">
            <option value="">Any</option>
            {entityGroups.map((g) => (
              <option key={g.entity} value={g.entity}>
                {g.entity}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="form-label">Action</span>
          <select name="action" defaultValue={sp.action ?? ""} className="input input-sm">
            <option value="">Any</option>
            {actionGroups.map((g) => (
              <option key={g.action} value={g.action}>
                {auditActionLabel(g.action)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="form-label">From</span>
          <input type="date" name="from" defaultValue={sp.from} className="input input-sm" />
        </label>
        <label className="block">
          <span className="form-label">To</span>
          <input type="date" name="to" defaultValue={sp.to} className="input input-sm" />
        </label>
        <label className="block">
          <span className="form-label">Record ID</span>
          <input
            type="text"
            name="q"
            defaultValue={sp.q}
            placeholder="entity id contains…"
            className="input input-sm"
          />
        </label>
        <div className="col-span-2 flex items-end gap-3 sm:col-span-3 lg:col-span-6">
          <button type="submit" className="btn btn-secondary">
            Apply
          </button>
          {hasFilters && (
            <Link href="/dashboard/audit" className="btn btn-ghost">
              Clear
            </Link>
          )}
          <span className="text-muted ml-auto text-sm">
            {total.toLocaleString()} entr{total === 1 ? "y" : "ies"}
          </span>
        </div>
      </form>

      <div className="panel overflow-x-auto">
        <table className="table text-sm">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Record</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted py-8 text-center">
                  No audit entries match these filters.
                </td>
              </tr>
            )}
            {entries.map((e) => {
              const detail = auditDetailText(e.metadata);
              return (
                <tr key={e.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-muted">
                    {e.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-[color:var(--color-text)]">
                    {auditActorText(e)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={TONE_CLASS[auditActionTone(e.action)]}>
                      {auditActionLabel(e.action)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted">{e.entity}</td>
                  <td className="px-4 py-2 text-muted font-mono text-xs">
                    {e.entityId ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted">{detail || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="btn btn-ghost">
                ← Newer
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="btn btn-ghost">
                Older →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
