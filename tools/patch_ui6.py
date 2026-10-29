#!/usr/bin/env python3
"""One-off patch:
1. Withdrawal requests live under Payment (not Dashboard).
2. Create gets sub-tabs: Product | Match | Cricket | Quiz.
3. Cricket + Match cards get one-click Go Live / End Match, and the score box
   stays visible after the match ends so the final score can be entered.
"""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

CRICKET_ANCHOR = """                          onChange={(e) => {
                            setCricketMatches(patchAt(cricketMatches, index, { status: e.target.value }));
                            window.dispatchEvent(
                              new Event("admin_config_updated"),
                            );
                          }}
                        >
                          <option value="upcoming">UPCOMING</option>
                          <option value="live">LIVE</option>
                          <option value="ended">ENDED</option>
                        </select>
                      </div>"""

CRICKET_NEW = CRICKET_ANCHOR + """

                      <div className="flex gap-2 mb-3">
                        {match.status !== "live" && match.status !== "ended" && (
                          <button
                            onClick={() => {
                              setCricketMatches(patchAt(cricketMatches, index, { status: "live" }));
                              window.dispatchEvent(new Event("admin_config_updated"));
                            }}
                            className="flex-1 bg-red-600 text-white font-bold py-1.5 rounded text-xs"
                          >
                            Go Live
                          </button>
                        )}
                        {match.status === "live" && (
                          <button
                            onClick={() => {
                              setCricketMatches(patchAt(cricketMatches, index, { status: "ended" }));
                              window.dispatchEvent(new Event("admin_config_updated"));
                            }}
                            className="flex-1 bg-gray-800 text-white font-bold py-1.5 rounded text-xs"
                          >
                            End Match - enter score
                          </button>
                        )}
                        {match.status === "ended" && (
                          <p className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1.5 w-full text-center">
                            Match ended - pick the winning team below to pay out.
                          </p>
                        )}
                      </div>"""

ESPORTS_ANCHOR = """                          onChange={(e) => {
                            setTournaments(
                              patchAt(tournaments, index, {
                                status: e.target.value,
                                ...(e.target.value === "live" ? { liveAt: Date.now() } : {}),
                                ...(e.target.value === "ended" ? { endedAt: Date.now() } : {}),
                              }),
                            );
                            window.dispatchEvent(
                              new Event("admin_config_updated"),
                            );
                          }}
                        >
                          <option value="upcoming">UPCOMING</option>
                          <option value="live">LIVE</option>
                          <option value="ended">ENDED</option>
                        </select>
                      </div>"""

ESPORTS_NEW = ESPORTS_ANCHOR + """

                      <div className="flex gap-2 mb-3">
                        {t.status !== "live" && t.status !== "ended" && (
                          <button
                            onClick={() => {
                              setTournaments(patchAt(tournaments, index, { status: "live", liveAt: Date.now() }));
                              window.dispatchEvent(new Event("admin_config_updated"));
                            }}
                            className="flex-1 bg-red-600 text-white font-bold py-1.5 rounded text-xs"
                          >
                            Go Live
                          </button>
                        )}
                        {t.status === "live" && (
                          <button
                            onClick={() => {
                              setTournaments(patchAt(tournaments, index, { status: "ended", endedAt: Date.now() }));
                              window.dispatchEvent(new Event("admin_config_updated"));
                            }}
                            className="flex-1 bg-gray-800 text-white font-bold py-1.5 rounded text-xs"
                          >
                            End Match
                          </button>
                        )}
                        {t.status === "ended" && (
                          <p className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1.5 w-full text-center">
                            Match ended - open the Result tab to enter kills and pay out.
                          </p>
                        )}
                      </div>"""

EDITS = [
    # 1. withdrawal requests belong to Payment
    (
        "        <div>\n"
        '          <div className="bg-[#e5e7eb] px-4 py-3 rounded-t-lg">\n'
        '            <h2 className="font-bold text-[#1f2937] text-[15px]">\n'
        "              Withdrawal Requests",
        '        <div className={activeSection === "payment" ? "" : "hidden"}>\n'
        '          <div className="bg-[#e5e7eb] px-4 py-3 rounded-t-lg">\n'
        '            <h2 className="font-bold text-[#1f2937] text-[15px]">\n'
        "              Withdrawal Requests",
        1,
    ),
    # 2a. createTab state
    (
        '    "dashboard" | "users" | "payment" | "create" | "task" | "settings"\n'
        '  >("dashboard");',
        '    "dashboard" | "users" | "payment" | "create" | "task" | "settings"\n'
        '  >("dashboard");\n'
        '  const [createTab, setCreateTab] = useState<\n'
        '    "product" | "match" | "cricket" | "quiz"\n'
        '  >("product");',
        1,
    ),
    # 2b. Create sub-tab bar
    (
        "        {/* Requests */}\n"
        '        <div id="admin-payments"',
        '        {activeSection === "create" && (\n'
        '          <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">\n'
        '            {(["product", "match", "cricket", "quiz"] as const).map((tab) => (\n'
        "              <button\n"
        "                key={tab}\n"
        "                onClick={() => setCreateTab(tab)}\n"
        '                className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg capitalize transition-all ${createTab === tab ? "bg-[#5e35b1] text-white shadow-sm" : "text-gray-600"}`}\n'
        "              >\n"
        "                {tab}\n"
        "              </button>\n"
        "            ))}\n"
        "          </div>\n"
        "        )}\n"
        "        {/* Requests */}\n"
        '        <div id="admin-payments"',
        1,
    ),
    # 2c. Product only on the product tab
    (
        "        {/* Manage Products */}\n"
        '        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${activeSection === "create" ? "" : "hidden"}`}>',
        "        {/* Manage Products */}\n"
        '        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${activeSection === "create" && createTab === "product" ? "" : "hidden"}`}>',
        1,
    ),
    # 2d. Play shell only for match/cricket/quiz
    (
        '<div id="admin-create" className={`bg-white border border-gray-200 rounded-lg shadow-sm ${activeSection === "create" ? "" : "hidden"}`}>',
        '<div id="admin-create" className={`bg-white border border-gray-200 rounded-lg shadow-sm ${activeSection === "create" && createTab !== "product" ? "" : "hidden"}`}>',
        1,
    ),
    # 2e. one accordion per tab
    (
        "            {/* Cricket Matches Accordion */}\n"
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${cricketExpanded ? "shadow-sm" : ""}`}\n'
        "            >",
        "            {/* Cricket Matches Accordion */}\n"
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${cricketExpanded ? "shadow-sm" : ""} ${createTab === "cricket" ? "" : "hidden"}`}\n'
        "            >",
        1,
    ),
    (
        "            {/* eSports Tournaments Accordion */}\n"
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${esportsExpanded ? "shadow-sm" : ""}`}\n'
        "            >",
        "            {/* eSports Tournaments Accordion */}\n"
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${esportsExpanded ? "shadow-sm" : ""} ${createTab === "match" ? "" : "hidden"}`}\n'
        "            >",
        1,
    ),
    (
        "            {/* Quiz Settings Accordion */}\n"
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${quizExpanded ? "shadow-sm" : ""}`}\n'
        "            >",
        "            {/* Quiz Settings Accordion */}\n"
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${quizExpanded ? "shadow-sm" : ""} ${createTab === "quiz" ? "" : "hidden"}`}\n'
        "            >",
        1,
    ),
    # 3a. keep the cricket score box visible after the match ends
    (
        '                      {match.status === "live" && (\n'
        '                        <div className="bg-blue-50 border border-blue-200 p-2 rounded mb-3">',
        '                      {(match.status === "live" || match.status === "ended") && (\n'
        '                        <div className="bg-blue-50 border border-blue-200 p-2 rounded mb-3">',
        1,
    ),
    # 3b. one-click lifecycle for cricket
    (CRICKET_ANCHOR, CRICKET_NEW, 1),
    # 3c. one-click lifecycle for match
    (ESPORTS_ANCHOR, ESPORTS_NEW, 1),
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
    print("Patched: payment requests, Create tabs, match lifecycle buttons.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
