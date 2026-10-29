#!/usr/bin/env python3
"""One-off patch: move the Create sub-navigation into the sidebar as a
dropdown (Product / Match / Cricket / Quiz) and drop the in-page tab bar."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

NAV_OLD = """            <nav className="flex-1 py-3 overflow-y-auto">
              {[
                { id: "dashboard", label: "Dashboard", Icon: LayoutGrid },
                { id: "users", label: "Users", Icon: Users },
                { id: "payment", label: "Payment", Icon: Wallet },
                { id: "create", label: "Create", Icon: Plus },
                { id: "task", label: "Task", Icon: CheckCircle2 },
                { id: "settings", label: "Settings", Icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium ${activeSection === item.id ? "bg-white/15 text-white" : "text-white/85"} hover:bg-white/10`}
                >
                  <item.Icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>"""

NAV_NEW = """            <nav className="flex-1 py-3 overflow-y-auto">
              {[
                { id: "dashboard", label: "Dashboard", Icon: LayoutGrid },
                { id: "users", label: "Users", Icon: Users },
                { id: "payment", label: "Payment", Icon: Wallet },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium ${activeSection === item.id ? "bg-white/15 text-white" : "text-white/85"} hover:bg-white/10`}
                >
                  <item.Icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium ${activeSection === "create" ? "bg-white/15 text-white" : "text-white/85"} hover:bg-white/10`}
              >
                <Plus className="w-5 h-5" />
                Create
                <ChevronDown
                  className={`w-4 h-4 ml-auto transition-transform ${createMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {createMenuOpen && (
                <div className="pb-1">
                  {(["product", "match", "cricket", "quiz"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => goToCreateTab(tab)}
                      className={`w-full flex items-center gap-3 pl-12 pr-5 py-2.5 text-[14px] font-medium capitalize ${activeSection === "create" && createTab === tab ? "bg-white/10 text-white" : "text-white/70"} hover:bg-white/10`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}

              {[
                { id: "task", label: "Task", Icon: CheckCircle2 },
                { id: "settings", label: "Settings", Icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium ${activeSection === item.id ? "bg-white/15 text-white" : "text-white/85"} hover:bg-white/10`}
                >
                  <item.Icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>"""

TABBAR_OLD = """        {activeSection === "create" && (
          <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
            {(["product", "match", "cricket", "quiz"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCreateTab(tab)}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg capitalize transition-all ${createTab === tab ? "bg-[#5e35b1] text-white shadow-sm" : "text-gray-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
"""

EDITS = [
    (
        "  const [expandedMatch, setExpandedMatch] = useState<any>(null);",
        "  const [expandedMatch, setExpandedMatch] = useState<any>(null);\n"
        "  const [createMenuOpen, setCreateMenuOpen] = useState(false);",
        1,
    ),
    (
        "  const goToSection = (id: string) => {\n"
        "    setSidebarOpen(false);\n"
        "    setActiveSection(id as typeof activeSection);\n"
        '    if (id === "users") setUsersExpanded(true);\n'
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n'
        "  };",
        "  const goToSection = (id: string) => {\n"
        "    setSidebarOpen(false);\n"
        "    setActiveSection(id as typeof activeSection);\n"
        '    if (id === "users") setUsersExpanded(true);\n'
        '    if (id === "create") setCreateMenuOpen(true);\n'
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n'
        "  };\n"
        "\n"
        '  const goToCreateTab = (tab: "product" | "match" | "cricket" | "quiz") => {\n'
        "    setCreateTab(tab);\n"
        '    setActiveSection("create");\n'
        "    setCreateMenuOpen(true);\n"
        "    setSidebarOpen(false);\n"
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n'
        "  };",
        1,
    ),
    (NAV_OLD, NAV_NEW, 1),
    (TABBAR_OLD, "", 1),
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
    print("Patched: Create dropdown in the sidebar.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
