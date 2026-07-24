"use client";
import { useEffect, useRef, useState } from "react";
import { colors } from "@/lib/theme";
import { listNotifications, dismissNotification, dismissAllNotifications, type Notification } from "@/lib/activity/store";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

export default function NotificationBell({ initial }: { initial: Notification[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      listNotifications().then(setItems);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function clearOne(id: string) {
    setItems((cur) => cur.filter((n) => n.id !== id));
    await dismissNotification(id);
  }

  async function clearAll() {
    setItems([]);
    await dismissAllNotifications();
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "transparent",
          border: "1px solid " + colors.steel,
          borderRadius: 8,
          padding: "8px 10px",
          color: colors.bone,
          cursor: "pointer",
          display: "inline-flex",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {items.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: 999,
              background: colors.copper,
              color: "#000",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            maxHeight: 400,
            overflowY: "auto",
            background: colors.onyx,
            border: "1px solid " + colors.graphite,
            borderRadius: 12,
            zIndex: 20,
            boxShadow: "0 12px 28px rgba(0,0,0,.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid " + colors.graphite }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.bone }}>Notifications</div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                style={{ background: "transparent", border: "none", color: colors.copper, fontSize: 12, cursor: "pointer" }}
              >
                Clear all
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div style={{ padding: "20px 14px", fontSize: 13, color: colors.fog }}>You&apos;re all caught up.</div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "10px 14px",
                  borderBottom: "1px solid " + colors.graphite,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: colors.bone, lineHeight: 1.4 }}>{n.text}</div>
                  <div style={{ fontSize: 11, color: colors.fog, marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => clearOne(n.id)}
                  aria-label="Dismiss"
                  style={{ background: "transparent", border: "none", color: colors.fog, cursor: "pointer", fontSize: 14, lineHeight: 1, flex: "none" }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
