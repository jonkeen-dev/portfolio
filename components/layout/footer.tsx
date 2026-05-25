import { SiGithub } from "@icons-pack/react-simple-icons";
import { Mail } from "lucide-react";

import LinkedInIcon from "@/components/icons/linkedin-icon";

const links = [
  {
    href: "https://github.com/jonkeen-dev",
    label: "GitHub",
    icon: SiGithub,
  },
  {
    href: "https://www.linkedin.com/in/jonkeen85/",
    label: "LinkedIn",
    icon: LinkedInIcon,
  },
  {
    href: "mailto:jon@jonkeen.dev",
    label: "Email",
    icon: Mail,
  },
] as const;

export default function Footer() {
  return (
    <footer className="border-border/15 mt-32 border-t">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav aria-label="Contact links" className="flex justify-center gap-6">
          {links.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              target={href.startsWith("mailto:") ? undefined : "_blank"}
              rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              <Icon size={20} />
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
