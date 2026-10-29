import Link from "next/link";

const LINKS = [
  { href: "/today", label: "Today" },
  { href: "/ladders", label: "Ladders" },
  { href: "/progress", label: "Progress" },
  { href: "/library", label: "Library" },
  { href: "/settings", label: "Settings" },
];

export function Shell({ path, showNav, children }: { path: string; showNav: boolean; children: React.ReactNode }) {
  return (
    <>
      {children}
      {showNav ? (
        <nav className="nav" aria-label="Primary">
          {LINKS.map((link) => {
            const active = path === link.href || path.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
