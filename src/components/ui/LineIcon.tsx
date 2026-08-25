import type { SVGProps } from "react";

export type IconName =
  | "arrow-up"
  | "bell"
  | "chevron-down"
  | "code"
  | "filter"
  | "folder"
  | "grid"
  | "library"
  | "menu"
  | "mic"
  | "monitor"
  | "paperclip"
  | "panel"
  | "plug"
  | "plus"
  | "rocket"
  | "search"
  | "settings"
  | "sun"
  | "tools"
  | "users";

type LineIconProps = SVGProps<SVGSVGElement> & { name: IconName };

export function LineIcon({ name, ...props }: LineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <IconPath name={name} />
    </svg>
  );
}

function IconPath({ name }: { name: IconName }) {
  switch (name) {
    case "arrow-up":
      return (
        <>
          <path d="m6 10 6-6 6 6" />
          <path d="M12 4v16" />
        </>
      );
    case "bell":
      return (
        <>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </>
      );
    case "chevron-down":
      return <path d="m7 10 5 5 5-5" />;
    case "code":
      return (
        <>
          <path d="m8 9-3 3 3 3" />
          <path d="m16 9 3 3-3 3" />
          <path d="m14 5-4 14" />
        </>
      );
    case "filter":
      return (
        <>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </>
      );
    case "folder":
      return (
        <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
      );
    case "grid":
      return (
        <>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </>
      );
    case "library":
      return (
        <>
          <path d="M5 4v16" />
          <path d="M9 4v16" />
          <path d="m13 5 4-1 3 15-4 1z" />
        </>
      );
    case "menu":
      return (
        <>
          <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
        </>
      );
    case "mic":
      return (
        <>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </>
      );
    case "monitor":
      return (
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </>
      );
    case "paperclip":
      return (
        <path d="m20.5 11.5-8.2 8.2a5 5 0 0 1-7.1-7.1l9-9a3.5 3.5 0 0 1 5 5l-9.1 9.1a2 2 0 0 1-2.8-2.8l8.2-8.2" />
      );
    case "panel":
      return (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
          <path d="m14 9 3 3-3 3" />
        </>
      );
    case "plug":
      return (
        <>
          <path d="M8 3v5" />
          <path d="M16 3v5" />
          <path d="M6 8h12v2a6 6 0 0 1-6 6 6 6 0 0 1-6-6z" />
          <path d="M12 16v5" />
        </>
      );
    case "plus":
      return (
        <>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </>
      );
    case "rocket":
      return (
        <>
          <path d="M14 5c3-3 6-2 6-2s1 3-2 6l-6 6-4-4z" />
          <path d="m9 14-2 5-2-2 1-4" />
          <path d="m11 7-4 1-2 2 5 1" />
          <circle cx="15.5" cy="7.5" r="1.5" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </>
      );
    case "settings":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7L0 10.5v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2.3h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7z"
            transform="translate(1.5 0) scale(.875)"
          />
        </>
      );
    case "sun":
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      );
    case "tools":
      return (
        <>
          <path d="m14 7 3-3 3 3-3 3" />
          <path d="M17 4v6" />
          <path d="m4 20 7-7" />
          <path d="M6.5 4a4 4 0 0 0 4.8 5.9L20 18.6 18.6 20l-8.7-8.7A4 4 0 0 1 4 6.5z" />
        </>
      );
    case "users":
      return (
        <>
          <circle cx="9" cy="8" r="4" />
          <path d="M2 21a7 7 0 0 1 14 0" />
          <path d="M16 4a4 4 0 0 1 0 8" />
          <path d="M18 15a6 6 0 0 1 4 6" />
        </>
      );
  }
}

export function MagicaMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block size-7 text-[#6d58ff] ${className}`}
    >
      <span className="absolute top-0 left-[10px] h-7 w-1.5 rotate-45 rounded-full bg-current" />
      <span className="absolute top-0 left-[10px] h-7 w-1.5 -rotate-45 rounded-full bg-current" />
      <span className="absolute top-[10px] left-0 h-1.5 w-7 rotate-45 rounded-full bg-current" />
      <span className="absolute top-[10px] left-0 h-1.5 w-7 -rotate-45 rounded-full bg-current" />
    </span>
  );
}
