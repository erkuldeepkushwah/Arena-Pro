#!/usr/bin/env python3
"""One-off patch (Match panel):
1. Room ID/Password + Live stream URL show only on the Upcoming tab.
2. Add a 5 / 10 minute countdown option.
3. Remove the Delete Match and Close buttons.
4. Swipe right to move a match to its next step (Upcoming -> Live -> Result).
"""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

SWIPE_OLD = """/** Swipe a match row to the left to reveal Delete. */
const SwipeToDelete: React.FC<{ onDelete: () => void; children: React.ReactNode }> = ({ onDelete, children }) => (
  <div className="relative rounded-xl overflow-hidden mb-3">
    <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-5">
      <span className="text-white font-bold text-[13px] flex items-center gap-1.5">
        <Trash2 className="w-4 h-4" /> Delete
      </span>
    </div>
    <motion.div
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: -120, right: 0 }}
      dragElastic={0.08}
      onDragEnd={(_, info) => {
        // Far enough, or a decisive flick — otherwise framer snaps it back.
        if (info.offset.x < -72 || info.velocity.x < -450) onDelete();
      }}"""

SWIPE_NEW = """/** Swipe left to delete, swipe right to move the match to its next step. */
const SwipeToDelete: React.FC<{ onDelete: () => void; onAdvance?: () => void; children: React.ReactNode }> = ({ onDelete, onAdvance, children }) => (
  <div className="relative rounded-xl overflow-hidden mb-3">
    <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-5">
      <span className="text-white font-bold text-[13px] flex items-center gap-1.5">
        <Trash2 className="w-4 h-4" /> Delete
      </span>
    </div>
    {onAdvance && (
      <div className="absolute inset-0 bg-green-600 flex items-center justify-start pl-5">
        <span className="text-white font-bold text-[13px]">Next step</span>
      </div>
    )}
    <motion.div
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: -120, right: onAdvance ? 120 : 0 }}
      dragElastic={0.08}
      onDragEnd={(_, info) => {
        // Far enough, or a decisive flick — otherwise framer snaps it back.
        if (onAdvance && (info.offset.x > 72 || info.velocity.x > 450)) {
          onAdvance();
          return;
        }
        if (info.offset.x < -72 || info.velocity.x < -450) onDelete();
      }}"""

DELETE_FOOT_OLD = """                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-3">
                        <span className="text-xs text-gray-500"></span>
                        <button
                          onClick={() => {
                            const n = tournaments.filter((_, i) => i !== index);
                            setTournaments(n);
                            saveMatchRooms(n);
                            window.dispatchEvent(
                              new Event("admin_config_updated"),
                            );
                          }}
                          className="text-red-500 hover:bg-red-50 px-3 py-1.5 font-bold text-xs rounded border border-red-200"
                        >
                          <Trash2 className="w-4 h-4 inline-block mr-1" /> Delete Match
                        </button>
                      </div>
"""

EDITS = [
    (SWIPE_OLD, SWIPE_NEW, 1),
    (
        "                    <SwipeToDelete\n"
        "                      key={t.id}\n"
        "                      onDelete={() => {\n"
        '                        if (!window.confirm("Delete this match?")) return;',
        "                    <SwipeToDelete\n"
        "                      key={t.id}\n"
        "                      onAdvance={() => {\n"
        "                        const next =\n"
        '                          t.status === "upcoming" ? "live" : t.status === "live" ? "ended" : "upcoming";\n'
        "                        setTournaments(\n"
        "                          patchAt(tournaments, index, {\n"
        "                            status: next,\n"
        '                            ...(next === "live" ? { liveAt: Date.now() } : {}),\n'
        '                            ...(next === "ended" ? { endedAt: Date.now() } : {}),\n'
        "                          }),\n"
        "                        );\n"
        '                        setEsportsTab(next === "ended" ? "result" : next === "live" ? "live" : "upcoming");\n'
        '                        window.dispatchEvent(new Event("admin_config_updated"));\n'
        "                      }}\n"
        "                      onDelete={() => {\n"
        '                        if (!window.confirm("Delete this match?")) return;',
        1,
    ),
    (
        '                      {((esportsTab === "upcoming" || esportsTab === "new") || esportsTab === "live") && (',
        '                      {esportsTab === "upcoming" && (',
        1,
    ),
    (
        '                          <input\n'
        '                            className="w-full border border-blue-200 rounded p-1 text-xs"\n'
        '                            placeholder="Live Stream URL (optional)"',
        '                          <div className="mb-2">\n'
        '                            <label className="text-[10px] text-blue-700 font-bold block mb-1">\n'
        "                              COUNTDOWN (MINUTES)\n"
        "                            </label>\n"
        "                            <select\n"
        '                              className="w-full border border-blue-200 rounded p-1 text-xs"\n'
        "                              value={t.countdownMin || 5}\n"
        "                              onChange={(e) => {\n"
        "                                setTournaments(patchAt(tournaments, index, { countdownMin: Number(e.target.value) }));\n"
        '                                window.dispatchEvent(new Event("admin_config_updated"));\n'
        "                              }}\n"
        "                            >\n"
        "                              <option value={5}>5 minutes</option>\n"
        "                              <option value={10}>10 minutes</option>\n"
        "                            </select>\n"
        "                          </div>\n"
        '                          <input\n'
        '                            className="w-full border border-blue-200 rounded p-1 text-xs"\n'
        '                            placeholder="Live Stream URL (optional)"',
        1,
    ),
    (
        "                        <button\n"
        "                          onClick={() => {\n"
        "                            if (expandedMatch === t.id) {\n"
        "                              setExpandedMatch(null);\n"
        "                              return;\n"
        "                            }\n"
        "                            setExpandedMatch(t.id);",
        "                        <button\n"
        "                          onClick={() => {\n"
        "                            setExpandedMatch(t.id);",
        1,
    ),
    (
        "                          {expandedMatch === t.id\n"
        '                            ? "Close"\n'
        '                            : t.status === "upcoming"\n'
        '                              ? "Live"\n'
        '                              : t.status === "live"\n'
        '                                ? "Result"\n'
        '                                : "Open"}',
        '                          {t.status === "upcoming"\n'
        '                            ? "Live"\n'
        '                            : t.status === "live"\n'
        '                              ? "Result"\n'
        '                              : "Open"}',
        1,
    ),
    (DELETE_FOOT_OLD, "", 1),
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
    print("Patched match panel: upcoming-only room details, countdown, swipe next.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
