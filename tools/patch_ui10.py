#!/usr/bin/env python3
"""One-off patch: Task becomes a sidebar dropdown with Reward / Promotion /
Target / Redeem, each showing its own part of the Daily panel."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

NAV_OLD = """              {[
                { id: "task", label: "Task", Icon: CheckCircle2 },
                { id: "settings", label: "Settings", Icon: Settings },
              ].map((item) => ("""

NAV_NEW = """              <button
                onClick={() => setTaskMenuOpen(!taskMenuOpen)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium ${activeSection === "task" ? "bg-white/15 text-white" : "text-white/85"} hover:bg-white/10`}
              >
                <CheckCircle2 className="w-5 h-5" />
                Task
                <ChevronDown
                  className={`w-4 h-4 ml-auto transition-transform ${taskMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {taskMenuOpen && (
                <div className="pb-1">
                  {(["reward", "promotion", "target", "redeem"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => goToTaskTab(tab)}
                      className={`w-full flex items-center gap-3 pl-12 pr-5 py-2.5 text-[14px] font-medium capitalize ${activeSection === "task" && taskTab === tab ? "bg-white/10 text-white" : "text-white/70"} hover:bg-white/10`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}

              {[
                { id: "settings", label: "Settings", Icon: Settings },
              ].map((item) => ("""

EDITS = [
    # state
    (
        "  const [createMenuOpen, setCreateMenuOpen] = useState(false);",
        "  const [createMenuOpen, setCreateMenuOpen] = useState(false);\n"
        "  const [taskMenuOpen, setTaskMenuOpen] = useState(false);\n"
        '  const [taskTab, setTaskTab] = useState<\n'
        '    "reward" | "promotion" | "target" | "redeem"\n'
        '  >("reward");',
        1,
    ),
    # open the task dropdown when Task is chosen
    (
        '    if (id === "create") setCreateMenuOpen(true);',
        '    if (id === "create") setCreateMenuOpen(true);\n'
        '    if (id === "task") setTaskMenuOpen(true);',
        1,
    ),
    # goToTaskTab
    (
        '  const goToCreateTab = (tab: "product" | "match" | "cricket" | "quiz" | "earn") => {\n'
        "    setCreateTab(tab);\n"
        '    setActiveSection("create");\n'
        "    setCreateMenuOpen(true);\n"
        "    setSidebarOpen(false);\n"
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n'
        "  };",
        '  const goToCreateTab = (tab: "product" | "match" | "cricket" | "quiz" | "earn") => {\n'
        "    setCreateTab(tab);\n"
        '    setActiveSection("create");\n'
        "    setCreateMenuOpen(true);\n"
        "    setSidebarOpen(false);\n"
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n'
        "  };\n"
        "\n"
        '  const goToTaskTab = (tab: "reward" | "promotion" | "target" | "redeem") => {\n'
        "    setTaskTab(tab);\n"
        '    setActiveSection("task");\n'
        "    setRewardsExpanded(true);\n"
        "    setTaskMenuOpen(true);\n"
        "    setSidebarOpen(false);\n"
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n'
        "  };",
        1,
    ),
    # sidebar: Task becomes a dropdown
    (NAV_OLD, NAV_NEW, 1),
    # ---- Redeem view ----
    (
        '                  <div className="pt-2">\n'
        '                    <h3 className="font-bold text-[#4b5563] text-[15px] mb-3">\n'
        "                      Daily Redeem Code",
        '                  <div className={`pt-2 ${taskTab === "redeem" ? "" : "hidden"}`}>\n'
        '                    <h3 className="font-bold text-[#4b5563] text-[15px] mb-3">\n'
        "                      Daily Redeem Code",
        1,
    ),
    # ---- the progress / promotion / task block ----
    (
        '                  <div className="border-t border-gray-200 pt-7">\n'
        '                    <h3 className="font-bold text-[#4b5563] text-[15px] mb-3">\n'
        "                      System Date: {new Date().toISOString().slice(0, 10)}\n"
        "                    </h3>",
        '                  <div className={`border-t border-gray-200 pt-7 ${taskTab === "redeem" ? "hidden" : ""}`}>\n'
        '                    <h3 className={`font-bold text-[#4b5563] text-[15px] mb-3 ${taskTab === "reward" ? "" : "hidden"}`}>\n'
        "                      System Date: {new Date().toISOString().slice(0, 10)}\n"
        "                    </h3>",
        1,
    ),
    # Progress button -> Reward
    (
        '                        className="flex-1 bg-[#ea580c] text-white font-bold py-3 px-2 rounded flex items-center justify-center text-[13px] shadow-sm active:bg-orange-700"',
        '                        className={`flex-1 bg-[#ea580c] text-white font-bold py-3 px-2 rounded flex items-center justify-center text-[13px] shadow-sm active:bg-orange-700 ${taskTab === "reward" ? "" : "hidden"}`}',
        1,
    ),
    # Promotion button -> Promotion
    (
        '                        className="flex-1 bg-[#eab308] text-white font-bold py-3 px-2 rounded flex flex-col items-center justify-center gap-1 text-[13px] shadow-sm active:bg-yellow-600">',
        '                        className={`flex-1 bg-[#eab308] text-white font-bold py-3 px-2 rounded flex flex-col items-center justify-center gap-1 text-[13px] shadow-sm active:bg-yellow-600 ${taskTab === "promotion" ? "" : "hidden"}`}>',
        1,
    ),
    # promotion explainer note
    (
        '                    <p className="text-[11px] text-gray-500 mt-2 font-medium">\n'
        '                      "Promotion" distributes prizes to Top 10 (₹100, ₹50, ₹20, and ₹5 for 4th-10th)\n'
        "                    </p>",
        '                    <p className={`text-[11px] text-gray-500 mt-2 font-medium ${taskTab === "promotion" ? "" : "hidden"}`}>\n'
        '                      "Promotion" distributes prizes to Top 10 (₹100, ₹50, ₹20, and ₹5 for 4th-10th)\n'
        "                    </p>",
        1,
    ),
    # Task (renew tasks) button -> Target
    (
        '                      className="w-full bg-[#f59e0b] hover:bg-orange-600 text-white font-bold py-3 mt-4 rounded flex items-center justify-center text-sm shadow-sm transition-colors"\n'
        "                    >\n"
        "                      Task\n"
        "                    </button>",
        '                      className={`w-full bg-[#f59e0b] hover:bg-orange-600 text-white font-bold py-3 mt-4 rounded flex items-center justify-center text-sm shadow-sm transition-colors ${taskTab === "target" ? "" : "hidden"}`}\n'
        "                    >\n"
        "                      Task\n"
        "                    </button>",
        1,
    ),
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
    print("Patched: Task dropdown with Reward / Promotion / Target / Redeem.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
