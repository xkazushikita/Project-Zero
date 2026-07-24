"use client";
import React, { useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";

export type Style = string | CSSProperties;

export function css(input?: Style): CSSProperties {
  if (!input) return {};
  if (typeof input !== "string") return input;
  const o: Record<string, string> = {};
  for (const decl of input.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop) continue;
    const key = prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
    const bm = key === "border" && val.match(/^(\S+)\s+(solid|dashed|dotted|double|none)(?:\s+(.+))?$/);
    if (bm) {
      o.borderWidth = bm[1];
      o.borderStyle = bm[2];
      if (bm[3]) o.borderColor = bm[3];
      continue;
    }
    o[key] = val;
  }
  return o as CSSProperties;
}

interface BoxProps {
  as?: "div" | "span";
  style?: Style;
  styleHover?: Style;
  onClick?: (e: MouseEvent | KeyboardEvent) => void;
  noButton?: boolean;
  children?: ReactNode;
  [key: string]: unknown;
}
export function Box({ as = "div", style, styleHover, onClick, noButton, children, ...rest }: BoxProps) {
  const [hover, setHover] = useState(false);
  const Tag = as;
  const merged: CSSProperties = { ...css(style), ...(hover && styleHover ? css(styleHover) : {}) };
  const hoverProps = styleHover ? { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) } : {};
  const a11y =
    onClick && !noButton
      ? {
          role: "button" as const,
          tabIndex: 0,
          onKeyDown: (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick(e);
            }
          },
        }
      : {};
  return (
    <Tag style={merged} onClick={onClick} {...hoverProps} {...a11y} {...(rest as Record<string, unknown>)}>
      {children}
    </Tag>
  );
}
