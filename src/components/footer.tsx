import React from "react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer
      className="w-full py-10 px-6 flex flex-col items-center gap-6 border-t"
      style={{
        background: "rgba(13,13,18,0.98)",
        borderTopColor: "rgba(232,109,176,0.12)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-8 h-8">
          <Image
            src="/aniblossom-logo.svg"
            alt="AniBlossom"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <span
          className="font-display text-xl font-black"
          style={{
            background: "linear-gradient(135deg, #ffb7d5 0%, #e86db0 60%, #f4a6cc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AniBlossom
        </span>
      </div>

      {/* Links row */}
      <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-blossom-pink transition-colors">Home</Link>
        <Link href="/search" className="hover:text-blossom-pink transition-colors">Search</Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-blossom-pink transition-colors flex items-center gap-1.5"
        >
          <GithubIcon />
          GitHub
        </a>
        <a
          href="https://discord.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-blossom-pink transition-colors flex items-center gap-1.5"
        >
          <DiscordIcon />
          Discord
        </a>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center max-w-md leading-relaxed">
        AniBlossom does not store any files on the server. We only link to media
        hosted on third-party services.
      </p>

      {/* Copyright */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-sm">🌸</span>
        <span>© {new Date().getFullYear()} AniBlossom. Made with love.</span>
      </div>

      {/* Blossom shimmer line */}
      <div
        className="w-32 h-0.5 rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(232,109,176,0.6), transparent)",
        }}
      />
    </footer>
  );
};

const GithubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const DiscordIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
  </svg>
);

export default Footer;
