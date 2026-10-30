#!/usr/bin/env python3
"""One-off patch (Match panel):
1. Remove the Live/Result/Open button from the card header.
2. Tapping the card header opens the form instead.
3. Swipe only triggers on a FULL swipe (left = delete, right = next step).
"""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

BTN_OLD = """                        <button
                          onClick={() => {
                            setExpandedMatch(t.id);
                            const next =
                              t.status === "upcoming"
                                ? "live"
                                : t.status === "live"
                                  ? "ended"
                                  : "upcoming";
                            setTournaments(
                              patchAt(tournaments, index, {
                                status: next,
                                ...(next === "live" ? { liveAt: Date.now() } : {}),
                                ...(next === "ended" ? { endedAt: Date.now() } : {}),
                              }),
                            );
                            window.dispatchEvent(new Event("admin_config_updated"));
                          }}
                          className="shrink-0 text-[12px] font-bold text-white bg-[#2563eb] px-3 py-1.5 rounded-lg"
                        >
                          {t.status === "upcoming"
                            ? "Live"
                            : t.status === "live"
                              ? "Result"
                              : "Open"}
                        </button>
"""

HDR_OLD = """                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] text-[#111] truncate">
                            {t.title || "Untitled match"}"""

HDR_NEW = """                      <div
                        className="flex items-start justify-between gap-2 cursor-pointer"
                        onClick={() => setExpandedMatch(expandedMatch === t.id ? null : t.id)}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] text-[#111] truncate">
                            {t.title || "Untitled match"}"""

SWIPE_OLD = """      dragConstraints={{ left: -120, right: onAdvance ? 120 : 0 }}
      dragElastic={0.08}
      onDragEnd={(_, info) => {
        // Far enough, or a decisive flick — otherwise framer snaps it back.
        if (onAdvance && (info.offset.x > 72 || info.velocity.x > 450)) {
          onAdvance();
          return;
        }
        if (info.offset.x < -72 || info.velocity.x < -450) onDelete();
      }}"""

SWIPE_NEW = """      dragConstraints={{ left: -180, right: onAdvance ? 180 : 0 }}
      dragElastic={0.08}
      onDragEnd={(_, info) => {
        // Only a full swipe counts — a half drag snaps back.
        if (onAdvance && info.offset.x >= 160) {
          onAdvance();
          return;
        }
        if (info.offset.x <= -160) onDelete();
      }}"""

BTN_CRICKET_OLD = """                        <button
                          onClick={() => {
                            if (expandedMatch === match.id) {
                              setExpandedMatch(null);
                              return;
                            }
                            setExpandedMatch(match.id);
                            const next =
                              match.status === "upcoming"
                                ? "live"
                                : match.status === "live"
                                  ? "ended"
                                  : "upcoming";
                            setCricketMatches(patchAt(cricketMatches, index, { status: next }));
                            window.dispatchEvent(new Event("admin_config_updated"));
                          }}
                          className="shrink-0 text-[12px] font-bold text-white bg-[#2563eb] px-3 py-1.5 rounded-lg"
                        >
                          {expandedMatch === match.id
                            ? "Close"
                            : match.status === "upcoming"
                              ? "Live"
                              : match.status === "live"
                                ? "Result"
                                : "Open"}
                        </button>
"""

HDR_CRICKET_OLD = """                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] text-[#111] truncate">
                            {match.title || "Untitled match"}"""

HDR_CRICKET_NEW = """                      <div
                        className="flex items-start justify-between gap-2 cursor-pointer"
                        onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] text-[#111] truncate">
                            {match.title || "Untitled match"}"""

EDITS = [
    (SWIPE_OLD, SWIPE_NEW, 1),
    (BTN_OLD, "", 1),
    (HDR_OLD, HDR_NEW, 1),
    (BTN_CRICKET_OLD, "", 1),
    (HDR_CRICKET_OLD, HDR_CRICKET_NEW, 1),
]


def main() -> int:
    path = ROOT / "components" / "AdminDashboard.tsx"
    src = path.read_text(encoding="utf-8")

    for old, new, expected in EDITS:
        found = src.count(old)
        if found != expected:
            problems.append(f"expected {expected}, found {found}: {old[:70]!r}")
        else:
            src = src.replace(old, new)

    if problems:
        print("PATCH ABORTED - no file written")
        for p in problems:
            print("  -", p)
        return 1

    path.write_text(src, encoding="utf-8")
    print("Patched: header button removed, tap-to-open, full-swipe only.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
