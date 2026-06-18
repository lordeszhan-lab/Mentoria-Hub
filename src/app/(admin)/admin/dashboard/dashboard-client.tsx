"use client";

/**
 * DashboardClient — premium restrained admin analytics.
 * One green accent, neutral icon chips, no rainbow, count-up numbers, green bars.
 */

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Users, Compass, BookOpen, Bell, Bookmark, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

// ── Stat card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  sub?: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  href?: string;
  /** If true, the big number is rendered in brand green */
  accent?: boolean;
}

function StatCard({ label, value, sub, Icon, href, accent }: StatCardProps) {
  const animated = useCountUp(value);

  const content = (
    <div className="rounded-2xl bg-card border border-border p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="min-w-0 pr-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          {label}
        </p>
        <p className={cn(
          "text-[2rem] font-extrabold tabular-nums leading-none",
          accent ? "text-primary" : "text-foreground",
        )}>
          {animated.toLocaleString()}
        </p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{sub}</p>
        )}
      </div>
      {/* Neutral icon chip */}
      <div
        className="flex items-center justify-center size-10 rounded-xl bg-muted text-muted-foreground shrink-0"
        aria-hidden
      >
        <Icon size={17} strokeWidth={1.6} />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-primary"
      >
        {content}
      </Link>
    );
  }
  return content;
}

// ── Section card wrapper ───────────────────────────────────────────────────────

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl bg-card border border-border p-5 shadow-sm",
      className,
    )}>
      {children}
    </div>
  );
}

// ── Chart eyebrow ─────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
      {children}
    </p>
  );
}

// ── Custom Recharts tooltip ────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-card border border-border shadow-md px-3 py-2 text-sm">
      <p className="font-bold text-foreground tabular-nums">{payload[0]?.value ?? 0}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalUsers: number;
  active7d: number;
  active30d: number;
  totalOpportunities: number;
  publishedOpportunities: number;
  totalCourses: number;
  publishedCourses: number;
  deadlinesIn7d: number;
  signupChartData: Array<{ date: string; signups: number }>;
  completionChartData: Array<{ date: string; completions: number }>;
  topSaved: Array<{ id: string; title: string; count: number }>;
  enrollCounts: Record<string, number>;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DashboardClient({ stats }: { stats: DashboardStats }) {
  const [activeSignupIndex, setActiveSignupIndex] = useState<number | null>(null);
  const [activeComplIndex, setActiveComplIndex] = useState<number | null>(null);

  return (
    <div className="space-y-6">

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          sub={`${stats.active7d} active (7d)`}
          Icon={Users}
          href="/admin/users"
          accent
        />
        <StatCard
          label="Opportunities"
          value={stats.totalOpportunities}
          sub={`${stats.publishedOpportunities} published`}
          Icon={Compass}
          href="/admin/opportunities"
        />
        <StatCard
          label="Courses"
          value={stats.totalCourses}
          sub={`${stats.publishedCourses} published`}
          Icon={BookOpen}
          href="/admin/courses"
        />
        <StatCard
          label="Deadlines in 7d"
          value={stats.deadlinesIn7d}
          sub="active student deadlines"
          Icon={Bell}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Active (30d)"
          value={stats.active30d}
          sub="learners with lesson progress"
          Icon={Activity}
        />
        <StatCard
          label="Top saved"
          value={stats.topSaved[0]?.count ?? 0}
          sub={stats.topSaved[0]?.title.slice(0, 36).concat("…") ?? "No saves yet"}
          Icon={Bookmark}
        />
      </div>

      {/* ── Signups chart ── */}
      <SectionCard>
        <div className="flex items-start justify-between mb-5">
          <div>
            <Eyebrow>Signups</Eyebrow>
            <p className="text-sm font-semibold text-foreground">New accounts — last 30 days</p>
          </div>
          <span className="text-2xl font-extrabold tabular-nums text-foreground">
            {stats.signupChartData.reduce((s, d) => s + d.signups, 0)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={stats.signupChartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            onMouseLeave={() => setActiveSignupIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", radius: 6 }} />
            <Bar
              dataKey="signups"
              radius={[6, 6, 0, 0]}
              maxBarSize={22}
              onMouseEnter={(_, index) => setActiveSignupIndex(index)}
            >
              {stats.signupChartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={
                    activeSignupIndex === index
                      ? "#16A34A"
                      : "#86EFAC"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* ── Completions chart ── */}
      <SectionCard>
        <div className="flex items-start justify-between mb-5">
          <div>
            <Eyebrow>Completions</Eyebrow>
            <p className="text-sm font-semibold text-foreground">Lessons completed — last 30 days</p>
          </div>
          <span className="text-2xl font-extrabold tabular-nums text-foreground">
            {stats.completionChartData.reduce((s, d) => s + d.completions, 0)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={stats.completionChartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            onMouseLeave={() => setActiveComplIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", radius: 6 }} />
            <Bar
              dataKey="completions"
              radius={[6, 6, 0, 0]}
              maxBarSize={22}
              onMouseEnter={(_, index) => setActiveComplIndex(index)}
            >
              {stats.completionChartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={
                    activeComplIndex === index
                      ? "#16A34A"
                      : "#BBF7D0"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* ── Most saved ── */}
      {stats.topSaved.length > 0 && (
        <SectionCard>
          <Eyebrow>Most saved</Eyebrow>
          <p className="text-sm font-semibold text-foreground mb-4">Top saved opportunities</p>
          <div className="space-y-3">
            {stats.topSaved.map((item, i) => {
              const max = stats.topSaved[0]?.count ?? 1;
              const pct = Math.round((item.count / max) * 100);
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-right text-muted-foreground tabular-nums shrink-0 font-medium">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Link
                        href={`/admin/opportunities/${item.id}/edit`}
                        className="text-xs font-medium text-foreground hover:text-primary hover:underline truncate transition-colors duration-150"
                      >
                        {item.title}
                      </Link>
                      <span className="text-xs text-muted-foreground tabular-nums ml-3 shrink-0">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
