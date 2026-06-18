import Link from "next/link";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { listUsers } from "@/server/admin/users";
import { updateUserRole } from "@/server/admin/users";
import { UserRoleActions } from "./role-actions";

type RawParams = { [key: string]: string | string[] | undefined };

function str(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

// ── Role badge — restrained: green for admin, muted for rest ──────────────────

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
        admin
      </span>
    );
  }
  if (role === "mentor") {
    return (
      <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-semibold bg-muted text-foreground/70">
        mentor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
      student
    </span>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;
  const q = str(raw.q);
  const page = Math.max(1, parseInt(str(raw.page) ?? "1", 10));

  const [{ rows, count }, t, tCommon] = await Promise.all([
    listUsers({ q, page }),
    getTranslations("admin"),
    getTranslations("common"),
  ]);
  const totalPages = Math.ceil(count / 30);

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{t("users")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{count} total</p>
        </div>
      </div>

      {/* Search */}
      <form method="get" className="flex items-center gap-2.5 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={14}
            strokeWidth={1.6}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder={tCommon("search")}
            className="w-full h-9 pl-9 pr-3.5 rounded-full border border-border bg-card text-sm
              text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40
              shadow-sm transition-all duration-200"
          />
        </div>
        <button
          type="submit"
          className="h-9 px-4 rounded-full border border-border bg-card text-sm font-medium
            text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm
            transition-colors duration-200 motion-reduce:transition-none"
        >
          {tCommon("search")}
        </button>
        {q && (
          <Link
            href="/admin/users"
            className="h-9 px-4 rounded-full border border-border bg-card text-sm font-medium
              text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm
              transition-colors duration-200 flex items-center"
          >
            {tCommon("clearAll")}
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {t("users")}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Name / Email</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{tCommon("grade")}</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">XP</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Joined</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => {
                const joinedDate = new Date(user.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                return (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors duration-150"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">{user.full_name ?? "—"}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate max-w-[220px] mt-0.5">
                          {user.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground tabular-nums">
                      {user.grade ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground tabular-nums">
                      {user.xp.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground tabular-nums">
                      {joinedDate}
                    </td>
                    <td className="px-4 py-3.5">
                      <UserRoleActions
                        userId={user.id}
                        currentRole={user.role}
                        updateRole={updateUserRole}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/users?page=${page - 1}${q ? `&q=${q}` : ""}`}
              className="h-8 px-4 rounded-full border border-border bg-card text-sm font-medium
                text-muted-foreground hover:bg-muted hover:text-foreground
                flex items-center transition-colors duration-200"
            >
              ← Prev
            </Link>
          )}
          <span className="text-sm text-muted-foreground tabular-nums px-2">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/users?page=${page + 1}${q ? `&q=${q}` : ""}`}
              className="h-8 px-4 rounded-full border border-border bg-card text-sm font-medium
                text-muted-foreground hover:bg-muted hover:text-foreground
                flex items-center transition-colors duration-200"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
