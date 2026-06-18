import { Users, BookOpen, Award, Globe } from "lucide-react";

const STATS = [
  { icon: Users, value: "4,200+", label: "Students exploring" },
  { icon: BookOpen, value: "1,800+", label: "Opportunities catalogued" },
  { icon: Award, value: "340+", label: "Roadmaps generated" },
  { icon: Globe, value: "12+", label: "Countries supported" },
];

export function TrustBar() {
  return (
    <section className="border-y border-border bg-surface py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-fg-faint">
          Building a generation of prepared students
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft">
                <Icon className="h-4.5 w-4.5 text-brand" />
              </div>
              <p className="text-2xl font-black tabular-nums text-fg">{value}</p>
              <p className="text-xs font-semibold text-fg-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
