#!/usr/bin/env python3
"""One-off patch: turn the admin sidebar into real section switching.

Dashboard  -> welcome card only
Users      -> Users block
Payment    -> Recharge + Withdrawal requests
Create     -> Product + Play (match / cricket / quiz)
Task       -> Daily + Earn
Settings   -> Banner + General (logo, coin icon, QR)
"""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

EDITS = [
    # ---- state + navigation ----
    (
        "  const [sidebarOpen, setSidebarOpen] = useState(false);\n"
        "\n"
        "  const goToSection = (id: string) => {\n"
        "    setSidebarOpen(false);\n"
        '    if (id === "admin-users") setUsersExpanded(true);\n'
        "    requestAnimationFrame(() => {\n"
        '      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });\n'
        "    });\n"
        "  };",
        "  const [sidebarOpen, setSidebarOpen] = useState(false);\n"
        "  const [activeSection, setActiveSection] = useState<\n"
        '    "dashboard" | "users" | "payment" | "create" | "task" | "settings"\n'
        '  >("dashboard");\n'
        "\n"
        "  const goToSection = (id: string) => {\n"
        "    setSidebarOpen(false);\n"
        "    setActiveSection(id as typeof activeSection);\n"
        '    if (id === "users") setUsersExpanded(true);\n'
        '    window.scrollTo({ top: 0, behavior: "smooth" });\n'
        "  };",
        1,
    ),
    # ---- nav items use section keys + active highlight ----
    (
        '              {[\n'
        '                { id: "admin-top", label: "Dashboard", Icon: LayoutGrid },\n'
        '                { id: "admin-users", label: "Users", Icon: Users },\n'
        '                { id: "admin-payments", label: "Payment", Icon: Wallet },\n'
        '                { id: "admin-create", label: "Create", Icon: Plus },\n'
        '                { id: "admin-task", label: "Task", Icon: CheckCircle2 },\n'
        '                { id: "admin-settings", label: "Settings", Icon: Settings },\n'
        "              ].map((item) => (",
        '              {[\n'
        '                { id: "dashboard", label: "Dashboard", Icon: LayoutGrid },\n'
        '                { id: "users", label: "Users", Icon: Users },\n'
        '                { id: "payment", label: "Payment", Icon: Wallet },\n'
        '                { id: "create", label: "Create", Icon: Plus },\n'
        '                { id: "task", label: "Task", Icon: CheckCircle2 },\n'
        '                { id: "settings", label: "Settings", Icon: Settings },\n'
        "              ].map((item) => (",
        1,
    ),
    (
        '                  className="w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium text-white/85 hover:bg-white/10 active:bg-white/15"',
        '                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium ${activeSection === item.id ? "bg-white/15 text-white" : "text-white/85"} hover:bg-white/10`}',
        1,
    ),
    # ---- dashboard placeholder ----
    (
        '      <div className="px-4 mt-6 space-y-6">',
        '      <div className="px-4 mt-6 space-y-6">\n'
        '        {activeSection === "dashboard" && (\n'
        '          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">\n'
        '            <p className="text-[16px] font-bold text-[#1f2937]">Welcome, admin</p>\n'
        '            <p className="text-[13px] text-gray-500 mt-1">Choose a section from the menu.</p>\n'
        "          </div>\n"
        "        )}",
        1,
    ),
    # ---- section visibility ----
    (
        '        <div id="admin-payments" className="scroll-mt-24">',
        '        <div id="admin-payments" className={activeSection === "payment" ? "" : "hidden"}>',
        1,
    ),
    (
        "        {/* Daily Operations */}\n"
        '        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">',
        "        {/* Daily Operations */}\n"
        '        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${activeSection === "task" ? "" : "hidden"}`}>',
        1,
    ),
    (
        "        {/* Manage Products */}\n"
        '        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">',
        "        {/* Manage Products */}\n"
        '        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${activeSection === "create" ? "" : "hidden"}`}>',
        1,
    ),
    (
        '        <div id="admin-create" className="scroll-mt-24 bg-white border border-gray-200 rounded-lg shadow-sm">',
        '        <div id="admin-create" className={`bg-white border border-gray-200 rounded-lg shadow-sm ${activeSection === "create" ? "" : "hidden"}`}>',
        1,
    ),
    (
        '        <div id="admin-task" className="scroll-mt-24 bg-white border border-gray-200 rounded-lg shadow-sm mb-6">',
        '        <div id="admin-task" className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-6 ${activeSection === "task" ? "" : "hidden"}`}>',
        1,
    ),
    (
        "        {/* Banner Section */}\n"
        '        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">',
        "        {/* Banner Section */}\n"
        '        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-6 ${activeSection === "settings" ? "" : "hidden"}`}>',
        1,
    ),
    # ---- General wrapper: settings + users both live inside it ----
    (
        '        <div id="admin-settings" className="scroll-mt-24 bg-white border border-gray-200 rounded-lg shadow-sm mb-6 pb-2">',
        '        <div id="admin-settings" className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-6 pb-2 ${activeSection === "settings" || activeSection === "users" ? "" : "hidden"}`}>',
        1,
    ),
    (
        '          <div className="p-4 border-b border-gray-100">\n'
        '            <h2 className="font-bold text-[17px]">General</h2>',
        '          <div className={activeSection === "settings" ? "p-4 border-b border-gray-100" : "hidden"}>\n'
        '            <h2 className="font-bold text-[17px]">General</h2>',
        1,
    ),
    (
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${logoExpanded ? "shadow-sm" : ""}`}\n'
        "            >",
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${logoExpanded ? "shadow-sm" : ""} ${activeSection === "settings" ? "" : "hidden"}`}\n'
        "            >",
        1,
    ),
    (
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${coinExpanded ? "shadow-sm" : ""}`}\n'
        "            >",
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${coinExpanded ? "shadow-sm" : ""} ${activeSection === "settings" ? "" : "hidden"}`}\n'
        "            >",
        1,
    ),
    (
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${uiExpanded ? "shadow-sm" : ""}`}\n'
        "            >",
        "            <div\n"
        '              className={`border border-gray-200 rounded-lg ${uiExpanded ? "shadow-sm" : ""} ${activeSection === "settings" ? "" : "hidden"}`}\n'
        "            >",
        1,
    ),
    (
        "            <div\n"
        '              id="admin-users"\n'
        '              className={`scroll-mt-24 border border-gray-200 rounded-lg ${usersExpanded ? "shadow-sm" : ""}`}\n'
        "            >",
        "            <div\n"
        '              id="admin-users"\n'
        '              className={`border border-gray-200 rounded-lg ${usersExpanded ? "shadow-sm" : ""} ${activeSection === "users" ? "" : "hidden"}`}\n'
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
    print("Patched AdminDashboard: sidebar now switches sections.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
