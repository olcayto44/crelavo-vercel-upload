type Kind = "build" | "media" | "growth" | "brand" | "video";

export default function CatIcon({ kind }: { kind: Kind }) {
  return (
    <div className="cl-icon-tile" aria-hidden="true">
      {kind === "build" ? (
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
          <rect x="1" y="1" width="34" height="26" rx="4" stroke="#14110e" strokeWidth="1.6" />
          <path d="M1 8h34" stroke="#14110e" strokeWidth="1.6" />
          <circle cx="6" cy="4.5" r="1.1" fill="#14110e" />
          <circle cx="10" cy="4.5" r="1.1" fill="#14110e" />
          <rect x="6" y="12" width="10" height="8" rx="1.5" stroke="#14110e" strokeWidth="1.4" />
          <path d="M20 13h10M20 17h8M20 21h6" stroke="#14110e" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ) : null}
      {kind === "media" ? (
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
          <rect x="2" y="8" width="22" height="16" rx="3" stroke="#14110e" strokeWidth="1.6" />
          <path d="M24 14l10-5v16l-10-5" stroke="#14110e" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="10" cy="6" r="3" stroke="#14110e" strokeWidth="1.6" />
        </svg>
      ) : null}
      {kind === "growth" ? (
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
          <path d="M4 24V6M4 24h28" stroke="#14110e" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8 18l7-7 5 4 8-9" stroke="#14110e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 6h6v6" stroke="#14110e" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : null}
      {kind === "brand" ? (
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
          <path
            d="M6 10h10l2 3h12v12H6V10Z"
            stroke="#14110e"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M14 8h-4V6h12v2" stroke="#14110e" strokeWidth="1.6" />
        </svg>
      ) : null}
      {kind === "video" ? (
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
          <rect x="3" y="8" width="22" height="16" rx="2" stroke="#14110e" strokeWidth="1.6" />
          <path d="M8 8V4h8l2 4" stroke="#14110e" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M25 8l8-3v22l-8-3" stroke="#14110e" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
  );
}
