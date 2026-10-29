import Link from "next/link";

import { LaddersIcon, LibraryIcon, ProgressIcon, SettingsIcon, TodayIcon } from "@/components/ui/icons";

const LINKS = [
  { href: "/today", label: "Today", icon: TodayIcon },
  { href: "/ladders", label: "Ladders", icon: LaddersIcon },
  { href: "/progress", label: "Progress", icon: ProgressIcon },
  { href: "/library", label: "Library", icon: LibraryIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Shell({ path, showNav, children }: { path: string; showNav: boolean; children: React.ReactNode }) {
  return (
    <>
      {children}
      {showNav ? (
        <nav className="nav" aria-label="Primary">
          {LINKS.map((link) => {
            const active = path === link.href || path.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
                <span className="nav-icon">
                  <Icon />
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
