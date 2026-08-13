"use client";

import Link from "next/link";
import Image from "next/image";

const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/Arijit-mondal099/vibe",
    icon: "/github.svg",
  },
  {
    label: "Twitter",
    href: "https://x.com/arijit_m_000999",
    icon: "/twitter.svg",
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-transparent px-4 pt-12 md:px-6 mt-24 md:mt-48">
      <div className="relative mx-auto flex max-w-5xl flex-col gap-10 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Vibe"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="font-semibold text-lg">Vibe</span>
          </Link>

          <p className="mt-3 text-sm text-muted-foreground">
            Build apps and websites by chatting with AI. Turn your ideas into
            production-ready products faster—with AI handling the code, design,
            and development.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Vibe. All rights reserved.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Social</h3>
          <ul className="space-y-2">
            {socialLinks.map(({ label, href, icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Image
                    src={icon}
                    alt={label}
                    width={20}
                    height={20}
                    className="dark:invert opacity-60 group-hover:opacity-80"
                  />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          maskImage:
            "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
        }}
        className="pointer-events-none mx-auto mt-8 max-w-5xl select-none text-center text-[8vh] md:text-9xl font-bold leading-none text-foreground opacity-15"
      >
        vibe
      </div>
    </footer>
  );
}
