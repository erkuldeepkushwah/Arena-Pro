#!/usr/bin/env python3
"""One-off: make the Match and Cricket match cards compact, and give the Quiz
tab a real icon (the old one pointed at a dead external PNG)."""

import sys
from pathlib import Path

TARGET = Path("Arena/src/components/PlayScreen.tsx")

# (old, new, expected_occurrences)
EDITS = [
    # ---- Quiz tab icon (external PNG -> lucide Lightbulb) ----
    ('  Calendar,\n  X,\n} from "lucide-react";',
     '  Calendar,\n  X,\n  Lightbulb,\n} from "lucide-react";', 1),
    ('''            <img
              src="https://uploads.onecompiler.io/44pbfr3gy/44pbfr8db/ideas.png"
              alt="Quiz"
              className={`w-4 h-4 object-contain ${activeTab === "quiz" ? "brightness-0 invert" : ""}`}
            />''',
     '            <Lightbulb className="w-4 h-4" strokeWidth={2.5} />', 1),

    # ---- Match tab: room card ----
    ("rounded-[20px] sm:rounded-[28px] p-4 sm:p-5 shadow-[0_3px_12px_rgba(0,0,0,0.06)]",
     "rounded-[16px] sm:rounded-[20px] p-3.5 sm:p-4 shadow-[0_3px_12px_rgba(0,0,0,0.06)]", 1),
    ("flex justify-between items-start gap-2 mb-5",
     "flex justify-between items-start gap-2 mb-3", 1),
    ("w-[54px] h-[54px] rounded-full object-cover border-[2px] border-yellow-400 p-[2px]",
     "w-[44px] h-[44px] rounded-full object-cover border-[2px] border-yellow-400 p-[2px]", 1),
    ("w-[54px] h-[54px] rounded-full border-[2px] border-yellow-400 p-[2px]",
     "w-[44px] h-[44px] rounded-full border-[2px] border-yellow-400 p-[2px]", 1),
    ("text-white font-black text-[15px] uppercase",
     "text-white font-black text-[13px] uppercase", 1),
    ("font-bold text-[#111] text-[17px] mb-1.5 leading-tight truncate",
     "font-bold text-[#111] text-[15px] mb-1 leading-tight truncate", 1),
    ("flex flex-wrap items-center gap-1.5 mb-1.5",
     "flex flex-wrap items-center gap-1.5 mb-1", 1),
    ("flex items-center gap-1 text-[#666] font-medium text-[13px]",
     "flex items-center gap-1 text-[#666] font-medium text-[12px]", 1),
    ('<Calendar className="w-[14px] h-[14px] text-[#666]" />',
     '<Calendar className="w-[12px] h-[12px] text-[#666]" />', 1),
    ("text-[#6D28D9] font-bold text-[14px] underline decoration-[#c4b5fd]",
     "text-[#6D28D9] font-bold text-[13px] underline decoration-[#c4b5fd]", 1),
    ("rounded-[14px] py-4 mb-6 relative bg-white shadow-[0_2px_8px_rgba(0,0,0,0.015)]",
     "rounded-[12px] py-2.5 mb-3 relative bg-white shadow-[0_2px_8px_rgba(0,0,0,0.015)]", 1),
    ("text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1",
     "text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1", 3),
    ("font-black text-[#111] text-[18px] sm:text-[20px] tracking-tight",
     "font-black text-[#111] text-[14px] sm:text-[15px] tracking-tight", 3),
    ("w-[1px] h-[40px] bg-gray-100 shrink-0",
     "w-[1px] h-[26px] bg-gray-100 shrink-0", 2),
    ("w-full bg-[#f3f4f6] h-[10px] rounded-full overflow-hidden mb-2 relative",
     "w-full bg-[#f3f4f6] h-[7px] rounded-full overflow-hidden mb-1.5 relative", 1),
    ("text-center font-bold text-[13px] text-[#111]",
     "text-center font-bold text-[12px] text-[#111]", 1),
    ("bg-green-50 text-green-700 font-bold text-[14px] px-8 py-2.5 rounded-[12px]",
     "bg-green-50 text-green-700 font-bold text-[13px] px-5 py-2 rounded-[12px]", 1),
    ("bg-red-50 text-red-600 font-bold text-[14px] px-8 py-2.5 rounded-[12px]",
     "bg-red-50 text-red-600 font-bold text-[13px] px-5 py-2 rounded-[12px]", 1),
    ("bg-gray-100 text-gray-500 font-bold text-[14px] px-8 py-2.5 rounded-[12px]",
     "bg-gray-100 text-gray-500 font-bold text-[13px] px-5 py-2 rounded-[12px]", 1),
    ("bg-[#6D28D9] text-white opacity-50 font-bold text-[14px] px-8 py-2.5 rounded-[12px]",
     "bg-[#6D28D9] text-white opacity-50 font-bold text-[13px] px-5 py-2 rounded-[12px]", 1),
    ('className="font-bold text-[14px] px-8 py-2.5 rounded-[12px] transition-transform active:scale-95 tracking-wide shadow-sm"',
     'className="font-bold text-[13px] px-5 py-2 rounded-[12px] transition-transform active:scale-95 tracking-wide shadow-sm"', 2),
    ('<div className="flex items-center justify-between gap-4">',
     '<div className="flex items-center justify-between gap-3">', 1),

    # ---- Cricket tab: match card ----
    ("rounded-[20px] sm:rounded-[28px] p-[16px] sm:p-[28px] shadow-[0_3px_12px_rgba(0,0,0,0.08)] flex flex-col mb-4 sm:mb-5",
     "rounded-[16px] sm:rounded-[20px] p-3.5 sm:p-4 shadow-[0_3px_12px_rgba(0,0,0,0.08)] flex flex-col mb-3", 1),
    ("absolute top-4 right-4 sm:top-6 sm:right-6 text-[12px] sm:text-[14px] font-bold px-3 py-1.5 rounded-lg",
     "absolute top-3 right-3 text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-lg", 1),
    ("flex justify-between items-center relative mb-4 sm:mb-6 mt-1 sm:mt-2",
     "flex justify-between items-center relative mb-3 mt-0.5", 1),
    ("flex flex-col items-center shrink-0 w-[50px] sm:w-[80px]",
     "flex flex-col items-center shrink-0 w-[42px] sm:w-[46px]", 2),
    ("w-[45px] h-[45px] sm:w-[80px] sm:h-[80px] object-contain mb-1 sm:mb-2",
     "w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] object-contain mb-1", 2),
    ("w-[45px] h-[45px] sm:w-[80px] sm:h-[80px] bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-[14px] sm:text-2xl mb-1 sm:mb-2 shadow-sm object-contain",
     "w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-[12px] sm:text-sm mb-1 shadow-sm object-contain", 1),
    ("w-[45px] h-[45px] sm:w-[80px] sm:h-[80px] bg-green-50 border border-green-100 rounded-full flex items-center justify-center font-bold text-green-700 text-[14px] sm:text-2xl mb-1 sm:mb-2 shadow-sm object-contain",
     "w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] bg-green-50 border border-green-100 rounded-full flex items-center justify-center font-bold text-green-700 text-[12px] sm:text-sm mb-1 shadow-sm object-contain", 1),
    ("text-[12px] sm:text-[20px] font-bold text-[#111] text-center uppercase tracking-wide",
     "text-[10px] sm:text-[11px] font-bold text-[#111] text-center uppercase tracking-wide", 2),
    ("flex flex-col items-center flex-1 px-1 sm:px-4 text-center",
     "flex flex-col items-center flex-1 px-1 sm:px-2 text-center", 1),
    ("text-gray-500 font-medium text-[13px] sm:text-[32px] mb-1 sm:mb-2 leading-none whitespace-nowrap overflow-hidden text-ellipsis w-full",
     "text-gray-500 font-medium text-[11px] sm:text-[12px] mb-0.5 leading-none whitespace-nowrap overflow-hidden text-ellipsis w-full", 1),
    ("font-bold text-[#111] text-[18px] sm:text-[48px] leading-tight mb-1 tracking-tight",
     "font-bold text-[#111] text-[15px] sm:text-[16px] leading-tight mb-0.5 tracking-tight", 1),
    ("text-gray-500 font-medium text-[12px] sm:text-[20px] mt-0.5 sm:mt-1",
     "text-gray-500 font-medium text-[10px] sm:text-[11px] mt-0.5", 1),
    ("flex items-center gap-6 sm:gap-12",
     "flex items-center gap-4 sm:gap-6", 1),
    ("text-[11px] sm:text-[14px] font-bold text-gray-500 uppercase tracking-wide",
     "text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wide", 2),
    ("font-bold text-black text-[15px] sm:text-[20px] leading-none",
     "font-bold text-black text-[13px] sm:text-[14px] leading-none", 2),
    ("border-gray-200 w-full mt-4 sm:mt-6 mb-3 sm:mb-5",
     "border-gray-200 w-full mt-3 mb-2", 1),
    ("font-bold text-[#111] text-[14px] sm:text-[22px] shrink-0",
     "font-bold text-[#111] text-[12px] sm:text-[13px] shrink-0", 1),
    ("bg-[#d8f2d8] text-[#1c6426] text-[11px] sm:text-[18px] font-bold px-3 sm:px-5 py-1.5 sm:py-2 rounded-[8px] sm:rounded-[18px]",
     "bg-[#d8f2d8] text-[#1c6426] text-[10px] sm:text-[11px] font-bold px-2 sm:px-3 py-1 rounded-[8px]", 1),
]


def main() -> int:
    src = TARGET.read_text(encoding="utf-8")
    original = src
    problems = []

    for old, new, expected in EDITS:
        found = src.count(old)
        if found != expected:
            problems.append(f"expected {expected}, found {found}: {old[:70]!r}")
            continue
        src = src.replace(old, new)

    if problems:
        print("PATCH ABORTED - no file written")
        for p in problems:
            print("  -", p)
        return 1

    if src == original:
        print("No changes needed (already patched).")
        return 0

    TARGET.write_text(src, encoding="utf-8")
    print(f"Patched {TARGET}: {len(EDITS)} edit groups applied.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
