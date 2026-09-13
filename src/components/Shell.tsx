"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { RestTimer } from "./RestTimer";

const NAV = [
  { href: "/", label: "Today", icon: TodayIcon },
  { href: "/workout", label: "Train", icon: TrainIcon },
  { href: "/checkin", label: "Check-in", icon: CheckIcon },
  { href: "/progress", label: "Progress", icon: ChartIcon },
  { href: "/program", label: "Program", icon: ListIcon },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useStore((s) => s.hydrated);
  const theme = useStore((s) => s.settings.theme);
  const active = useStore((s) => s.active);

  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const mode =
        theme === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : theme;
      root.setAttribute("data-theme", mode);
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col border-r border-line bg-panel px-4 py-6 sticky top-0 h-dvh">
        <Link href="/" className="display text-3xl text-ink leading-none mb-8">
          Saber&rsquo;s
          <br />
          <span className="text-accent">Gym</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const on = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  on ? "bg-panel-2 text-ink" : "text-ink-2 hover:text-ink hover:bg-panel-2/60"
                }`}
              >
                <Icon />
                {label}
                {href === "/workout" && active && <span className="ml-auto h-2 w-2 rounded-full bg-green" aria-label="Workout in progress" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <Link
            href="/history"
            className={`rounded-lg px-3 py-2 text-sm ${pathname.startsWith("/history") ? "text-ink bg-panel-2" : "text-ink-2 hover:text-ink"}`}
          >
            History
          </Link>
          <Link
            href="/settings"
            className={`rounded-lg px-3 py-2 text-sm ${pathname.startsWith("/settings") ? "text-ink bg-panel-2" : "text-ink-2 hover:text-ink"}`}
          >
            Settings
          </Link>
        </div>
      </aside>

      <div className="flex flex-col min-h-dvh">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2">
          <Link href="/" className="display text-2xl leading-none">
            Saber&rsquo;s <span className="text-accent">Gym</span>
          </Link>
          <div className="flex gap-1">
            <Link href="/history" className="btn btn-ghost btn-sm" aria-label="History">
              <HistoryIcon />
            </Link>
            <Link href="/settings" className="btn btn-ghost btn-sm" aria-label="Settings">
              <GearIcon />
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-32 md:pb-16 md:pt-8">
          {hydrated ? children : <Skeleton />}
        </main>

        <RestTimer />

        {/* Mobile bottom tabs */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-panel/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const on = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${on ? "text-ink" : "text-ink-3"}`}
                >
                  <Icon />
                  {label}
                  {href === "/workout" && active && <span className="absolute top-2 right-[calc(50%-16px)] h-2 w-2 rounded-full bg-green" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse pt-2">
      <div className="h-40 rounded-2xl bg-panel" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-panel" />
        <div className="h-24 rounded-2xl bg-panel" />
      </div>
      <div className="h-32 rounded-2xl bg-panel" />
    </div>
  );
}

const ic = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function TodayIcon() {
  return (
    <svg {...ic}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}
function TrainIcon() {
  return (
    <svg {...ic}>
      <path d="M2 12h2M20 12h2M6 8v8M18 8v8M9 6v12M15 6v12M9 12h6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg {...ic}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg {...ic}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 6-6" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg {...ic}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg {...ic}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg {...ic}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
