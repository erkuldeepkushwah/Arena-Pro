#!/usr/bin/env python3
"""One-off: drop the 'About This Match' subtitle under the Room Details heading."""

import sys
from pathlib import Path

TARGET = Path("Arena/src/components/PlayScreen.tsx")

OLD = '''              <h4 className="text-[16px] font-bold text-[#111] mb-1">Room Details</h4>
              <p className="text-gray-500 text-[13px] font-medium mb-6">About This Match</p>'''

NEW = '''              <h4 className="text-[16px] font-bold text-[#111] mb-6">Room Details</h4>'''


def main() -> int:
    src = TARGET.read_text(encoding="utf-8")
    found = src.count(OLD)
    if found != 1:
        print(f"ABORT: expected 1 occurrence, found {found}")
        return 1
    TARGET.write_text(src.replace(OLD, NEW), encoding="utf-8")
    print("Patched: removed 'About This Match' line.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
