"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { colors, fonts } from "@/lib/theme";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";
import type { Notification } from "@/lib/activity/store";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/deals", label: "Brand Deals" },
  { href: "/agents", label: "Agents" },
  { href: "/chat", label: "Chat" },
  { href: "/calendar", label: "Calendar" },
  { href: "/analytics", label: "Analytics" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export default function AppFrame({
  children,
  userName,
  initialNotifications,
}: {
  children: React.ReactNode;
  userName: string;
  initialNotifications: Notification[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: colors.obsidian }}>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 30 }}
        />
      )}

      <aside
        className={"asteam-sidebar" + (mobileOpen ? " open" : "")}
        style={{
          width: 232,
          flex: "none",
          borderRight: "1px solid " + colors.graphite,
          background: colors.obsidian,
          padding: "24px 18px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            fontFamily: fonts.serif,
            fontSize: 19,
            fontWeight: 500,
            letterSpacing: "0.01em",
            color: colors.paperWhite,
            marginBottom: 30,
          }}
        >
          Agentic Sales Team
        </Link>
        <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", color: colors.smoke, textTransform: "uppercase", margin: "0 12px 10px" }}>
          Menu
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={"asteam-nav-link" + (active ? " active" : "")}
                style={{ fontSize: 14, fontWeight: 500, padding: "9px 12px", borderRadius: 8 }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div
          style={{
            borderTop: "1px solid " + colors.graphite,
            paddingTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <UserButton />
          <span style={{ fontSize: 13.5, color: colors.bone, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName}
          </span>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 28px",
            borderBottom: "1px solid " + colors.graphite,
          }}
        >
          <button
            type="button"
            className="asteam-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            style={{
              background: "transparent",
              border: "1px solid " + colors.steel,
              borderRadius: 8,
              padding: "8px 10px",
              color: colors.bone,
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <GlobalSearch />
          <div style={{ marginLeft: "auto" }}>
            <NotificationBell initial={initialNotifications} />
          </div>
        </header>
        <main style={{ flex: 1, padding: "28px" }}>{children}</main>
      </div>
    </div>
  );
}
