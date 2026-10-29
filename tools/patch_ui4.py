#!/usr/bin/env python3
"""One-off patch: give the admin panel a slide-out sidebar (Users, Payment,
Create, Task, Settings, Logout) instead of the plain header."""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

OLD_IMPORT = """import {
  ChevronDown,
  ChevronUp,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Play,
  Check,
} from "lucide-react";"""

NEW_IMPORT = """import {
  ChevronDown,
  ChevronUp,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Play,
  Check,
  Menu,
  Users,
  Wallet,
  LayoutGrid,
  CheckCircle2,
  Settings,
  LogOut,
} from "lucide-react";"""

OLD_HEADER = """      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-sm border-b border-gray-200 z-10 sticky top-0">
        <h1 className="text-[22px] font-bold text-[#1f2937] tracking-tight">
          Admin Dashboard
        </h1>
        <button
          onClick={onLogout}
          className="bg-[#ef4444] text-white px-5 py-1.5 rounded font-medium shadow-sm transition-colors active:bg-red-600"
        >
          Exit
        </button>
      </div>"""

NEW_HEADER = """      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-sm border-b border-gray-200 z-20 sticky top-0">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center active:bg-gray-50"
        >
          <Menu className="w-5 h-5 text-[#1f2937]" />
        </button>
        <h1 className="text-[18px] font-bold text-[#1f2937] tracking-tight">
          Admin Panel
        </h1>
        <div className="w-10 h-10 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center font-bold">
          A
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[200] flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-[265px] max-w-[82%] h-full bg-[#0b1b3f] text-white flex flex-col shadow-2xl">
            <div className="px-5 py-5 border-b border-white/10">
              <p className="text-[17px] font-bold">Arena Pro</p>
              <p className="text-[12px] text-white/60">Admin panel</p>
            </div>
            <nav className="flex-1 py-3 overflow-y-auto">
              {[
                { id: "admin-top", label: "Dashboard", Icon: LayoutGrid },
                { id: "admin-users", label: "Users", Icon: Users },
                { id: "admin-payments", label: "Payment", Icon: Wallet },
                { id: "admin-create", label: "Create", Icon: Plus },
                { id: "admin-task", label: "Task", Icon: CheckCircle2 },
                { id: "admin-settings", label: "Settings", Icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium text-white/85 hover:bg-white/10 active:bg-white/15"
                >
                  <item.Icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-5 py-5 text-[15px] font-medium text-red-300 border-t border-white/10"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </aside>
        </div>
      )}"""

EDITS = [
    (OLD_IMPORT, NEW_IMPORT, 1),
    (
        "  const [coinExpanded, setCoinExpanded] = useState(false);",
        "  const [coinExpanded, setCoinExpanded] = useState(false);\n"
        "  const [sidebarOpen, setSidebarOpen] = useState(false);\n"
        "\n"
        "  const goToSection = (id: string) => {\n"
        "    setSidebarOpen(false);\n"
        '    if (id === "admin-users") setUsersExpanded(true);\n'
        "    requestAnimationFrame(() => {\n"
        '      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });\n'
        "    });\n"
        "  };",
        1,
    ),
    (OLD_HEADER, NEW_HEADER, 1),
    (
        '<div className="min-h-screen bg-[#f4f5f7] pb-10 text-[#1f2937]">',
        '<div id="admin-top" className="min-h-screen bg-[#f4f5f7] pb-10 text-[#1f2937]">',
        1,
    ),
    (
        "        {/* Requests */}\n        <div>",
        '        {/* Requests */}\n        <div id="admin-payments" className="scroll-mt-24">',
        1,
    ),
    (
        '        {/* Manage Play Games */}\n        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">',
        '        {/* Manage Play Games */}\n        <div id="admin-create" className="scroll-mt-24 bg-white border border-gray-200 rounded-lg shadow-sm">',
        1,
    ),
    (
        '        {/* Earn Tasks */}\n        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">',
        '        {/* Earn Tasks */}\n        <div id="admin-task" className="scroll-mt-24 bg-white border border-gray-200 rounded-lg shadow-sm mb-6">',
        1,
    ),
    (
        '        {/* General Settings */}\n        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 pb-2">',
        '        {/* General Settings */}\n        <div id="admin-settings" className="scroll-mt-24 bg-white border border-gray-200 rounded-lg shadow-sm mb-6 pb-2">',
        1,
    ),
    (
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${usersExpanded ? "shadow-sm" : ""}`}\n'
        "            >",
        "            <div\n"
        '              id="admin-users"\n'
        '              className={`scroll-mt-24 border border-gray-200 rounded-lg ${usersExpanded ? "shadow-sm" : ""}`}\n'
        "            >",
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
    print("Patched AdminDashboard with sidebar navigation.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
