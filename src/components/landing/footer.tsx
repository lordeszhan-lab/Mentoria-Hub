import Link from "next/link";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Opportunity Catalog", href: "#product" },
      { label: "Your Roadmap", href: "#product" },
      { label: "Courses", href: "#product" },
      { label: "AI Mentor", href: "#product" },
      { label: "Certificates", href: "#product" },
    ],
  },
  {
    heading: "For Students",
    links: [
      { label: "Grades 8–11", href: "#students" },
      { label: "KZ Opportunities", href: "#product" },
      { label: "International Programs", href: "#product" },
      { label: "Streak & Progress", href: "#product" },
      { label: "Leaderboard", href: "#product" },
    ],
  },
  {
    heading: "For Mentors",
    links: [
      { label: "School Dashboard", href: "#mentors" },
      { label: "Student Analytics", href: "#mentors" },
      { label: "Sponsor Reporting", href: "#mentors" },
      { label: "Contact us", href: "/auth/login" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Data Processing", href: "#" },
    ],
  },
];

const LOCALES = [
  { code: "EN", label: "English" },
  { code: "RU", label: "Русский" },
  { code: "KK", label: "Қазақша" },
];

const SOCIALS = [
  { glyph: "𝕏", label: "Twitter / X", href: "#" },
  { glyph: "in", label: "LinkedIn", href: "#" },
  { glyph: "▶", label: "YouTube", href: "#" },
  { glyph: "✈", label: "Telegram", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Top — wordmark + columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Wordmark + mission */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-black text-white">
                M
              </span>
              <span className="text-base font-black tracking-tight text-fg">
                Mentoria <span className="text-brand">Hub</span>
              </span>
            </Link>
            <p className="mt-3 text-xs font-medium leading-relaxed text-fg-muted">
              Turning every student&apos;s ambition into a clear, achievable roadmap.
            </p>

            {/* Socials */}
            <div className="mt-5 flex gap-2">
            {SOCIALS.map(({ glyph, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs font-bold text-fg-muted transition-colors hover:border-fg/30 hover:text-fg"
              >
                {glyph}
              </a>
            ))}
            </div>
          </div>

          {/* Nav columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading} className="lg:col-span-1">
              <p className="text-xs font-black uppercase tracking-widest text-fg">
                {col.heading}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs font-medium text-fg-faint">
            © {new Date().getFullYear()} Mentoria Hub. All rights reserved.
          </p>

          {/* Locale switcher (visual only) */}
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1">
            {LOCALES.map((loc, i) => (
              <button
                key={loc.code}
                aria-label={`Switch to ${loc.label}`}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  i === 0
                    ? "bg-surface text-fg shadow-sm"
                    : "text-fg-muted hover:text-fg"
                }`}
              >
                {loc.code}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
