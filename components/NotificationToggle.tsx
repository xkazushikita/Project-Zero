"use client";
import { useState, useTransition } from "react";
import { colors } from "@/lib/theme";
import { updateNotification } from "@/lib/settings/actions";
import type { NotificationPrefs } from "@/lib/settings/types";

export default function NotificationToggle({
  id,
  label,
  description,
  initial,
}: {
  id: keyof NotificationPrefs;
  label: string;
  description: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(() => {
      updateNotification(id, next);
    });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        padding: "16px 0",
        borderBottom: "1px solid " + colors.graphite,
      }}
    >
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: colors.bone }}>{label}</div>
        <div style={{ fontSize: 13, color: colors.fog, marginTop: 3 }}>{description}</div>
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={label}
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          border: "1px solid " + (on ? colors.copper : colors.steel),
          background: on ? "rgba(204,145,102,.22)" : "transparent",
          position: "relative",
          cursor: "pointer",
          flex: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: on ? colors.copper : colors.steel,
            transition: "left .15s ease",
          }}
        />
      </button>
    </div>
  );
}
