#!/usr/bin/env python3
"""One-off UI patch:
- avatar photo upload on Home + Profile
- drop the eye icon and the trailing ".00" on Total Balance
- use one coin icon (assets/coin.png) everywhere
"""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

AVATAR_TS = '''import { rtdb, auth } from "../firebase";
import { ref, update } from "firebase/database";

/**
 * Downscale a picked image to a square JPEG data URL. Avatars are stored on the
 * user's Realtime Database record, so they need to stay small.
 */
export const fileToAvatarDataUrl = (file: File, max = 256): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load that image."));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = max;
        canvas.height = max;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process that image."));
          return;
        }
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          max,
          max,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

export const saveAvatar = async (dataUrl: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("You need to be signed in.");
  await update(ref(rtdb, `users/${user.uid}`), { photoURL: dataUrl });
};
'''


def apply(rel: str, pairs) -> None:
    path = ROOT / rel
    src = path.read_text(encoding="utf-8")
    for old, new, expected in pairs:
        found = src.count(old)
        if found != expected:
            problems.append(f"{rel}: expected {expected}, found {found}: {old[:60]!r}")
            return
        src = src.replace(old, new)
    path.write_text(src, encoding="utf-8")


# ---------------------------------------------------------------- HomeScreen
apply(
    "components/HomeScreen.tsx",
    [
        ("import {\n  Eye,\n  Megaphone,", "import {\n  Megaphone,", 1),
        (
            'import coinIcon from "../assets/coin.png";',
            'import coinIcon from "../assets/coin.png";\n'
            'import { fileToAvatarDataUrl, saveAvatar } from "../utils/avatar";',
            1,
        ),
        (
            "  const userProfile = useUserProfile();\n  const notifications = useNotifications();",
            "  const userProfile = useUserProfile();\n"
            "  const notifications = useNotifications();\n"
            "\n"
            "  const avatarInputRef = useRef<HTMLInputElement>(null);\n"
            "  const [avatarUploading, setAvatarUploading] = useState(false);\n"
            "\n"
            "  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {\n"
            "    const file = e.target.files?.[0];\n"
            '    e.target.value = "";\n'
            "    if (!file) return;\n"
            "    try {\n"
            "      setAvatarUploading(true);\n"
            "      const dataUrl = await fileToAvatarDataUrl(file);\n"
            "      await saveAvatar(dataUrl);\n"
            "    } catch (err: any) {\n"
            '      alert(err?.message || "Could not update your photo.");\n'
            "    } finally {\n"
            "      setAvatarUploading(false);\n"
            "    }\n"
            "  };",
            1,
        ),
        (
            '          <div className="w-[46px] h-[46px] rounded-full bg-[#5b21b6] flex items-center justify-center text-white font-semibold text-lg shadow-sm">\n'
            "            {userName.charAt(0).toUpperCase()}\n"
            "          </div>",
            '          <button\n'
            "            type=\"button\"\n"
            "            onClick={() => avatarInputRef.current?.click()}\n"
            '            title="Change photo"\n'
            '            className="relative w-[46px] h-[46px] rounded-full bg-[#5b21b6] flex items-center justify-center text-white font-semibold text-lg shadow-sm overflow-hidden active:scale-95 transition-transform"\n'
            "          >\n"
            "            {userProfile?.photoURL ? (\n"
            '              <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />\n'
            "            ) : (\n"
            "              userName.charAt(0).toUpperCase()\n"
            "            )}\n"
            "            {avatarUploading && (\n"
            '              <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-[9px] font-bold">\n'
            "                ...\n"
            "              </span>\n"
            "            )}\n"
            "          </button>\n"
            "          <input\n"
            "            ref={avatarInputRef}\n"
            '            type="file"\n'
            '            accept="image/*"\n'
            '            className="hidden"\n'
            "            onChange={handleAvatarChange}\n"
            "          />",
            1,
        ),
        (
            '              <span className="text-sm font-medium">Total Balance</span>\n'
            '              <Eye className="w-4 h-4" />\n',
            '              <span className="text-sm font-medium">Total Balance</span>\n',
            1,
        ),
        (
            "₹ {Number(userProfile?.balance || 0).toFixed(2)}",
            '₹ {Number(userProfile?.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}',
            1,
        ),
    ],
)

# ------------------------------------------------------------- ProfileScreen
apply(
    "components/ProfileScreen.tsx",
    [
        (
            'import React, { useState, useEffect } from "react";',
            'import React, { useRef, useState, useEffect } from "react";',
            1,
        ),
        (
            'import { useUserProfile } from "../hooks/useFirebaseData";',
            'import { useUserProfile } from "../hooks/useFirebaseData";\n'
            'import coinIcon from "../assets/coin.png";\n'
            'import { fileToAvatarDataUrl, saveAvatar } from "../utils/avatar";',
            1,
        ),
        (
            "  const userProfile = useUserProfile();\n  const coins = userProfile?.coins || 0;",
            "  const userProfile = useUserProfile();\n"
            "  const coins = userProfile?.coins || 0;\n"
            "\n"
            "  const avatarInputRef = useRef<HTMLInputElement>(null);\n"
            "  const [avatarUploading, setAvatarUploading] = useState(false);\n"
            "\n"
            "  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {\n"
            "    const file = e.target.files?.[0];\n"
            '    e.target.value = "";\n'
            "    if (!file) return;\n"
            "    try {\n"
            "      setAvatarUploading(true);\n"
            "      const dataUrl = await fileToAvatarDataUrl(file);\n"
            "      await saveAvatar(dataUrl);\n"
            "    } catch (err: any) {\n"
            '      alert(err?.message || "Could not update your photo.");\n'
            "    } finally {\n"
            "      setAvatarUploading(false);\n"
            "    }\n"
            "  };",
            1,
        ),
        (
            '          <div className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center bg-transparent">\n'
            '            <span className="text-white text-xl font-bold">U</span>\n'
            "          </div>",
            '          <button\n'
            "            type=\"button\"\n"
            "            onClick={() => avatarInputRef.current?.click()}\n"
            '            title="Change photo"\n'
            '            className="relative w-14 h-14 rounded-full border border-white/30 flex items-center justify-center bg-transparent overflow-hidden active:scale-95 transition-transform"\n'
            "          >\n"
            "            {userProfile?.photoURL ? (\n"
            '              <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />\n'
            "            ) : (\n"
            '              <span className="text-white text-xl font-bold">\n'
            '                {(userProfile?.displayName || "U").charAt(0).toUpperCase()}\n'
            "              </span>\n"
            "            )}\n"
            "            {avatarUploading && (\n"
            '              <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-[9px] font-bold text-white">\n'
            "                ...\n"
            "              </span>\n"
            "            )}\n"
            "          </button>\n"
            "          <input\n"
            "            ref={avatarInputRef}\n"
            '            type="file"\n'
            '            accept="image/*"\n'
            '            className="hidden"\n'
            "            onChange={handleAvatarChange}\n"
            "          />",
            1,
        ),
        (
            '              <span className="text-yellow-400 text-xl">🪙</span>',
            '              <img src={coinIcon} alt="" aria-hidden="true" className="w-5 h-5 object-contain" />',
            1,
        ),
    ],
)

# ---------------------------------------------------------------- PlayScreen
apply(
    "components/PlayScreen.tsx",
    [
        (
            'import { auth } from "../firebase";',
            'import { auth } from "../firebase";\nimport coinIcon from "../assets/coin.png";',
            1,
        ),
        (
            '                  <span className="text-xs">🪙</span>',
            '                  <img src={coinIcon} alt="" aria-hidden="true" className="w-3.5 h-3.5 object-contain" />',
            1,
        ),
        (
            '                        <span className="text-sm">🪙</span> {selectedCricketMatch.entryFee}',
            '                        <img src={coinIcon} alt="" aria-hidden="true" className="w-4 h-4 object-contain" /> {selectedCricketMatch.entryFee}',
            1,
        ),
    ],
)

# -------------------------------------------------------------- OffersScreen
apply(
    "components/OffersScreen.tsx",
    [
        (
            'import { rtdb, auth } from "../firebase";',
            'import { rtdb, auth } from "../firebase";\nimport coinIcon from "../assets/coin.png";',
            1,
        ),
        (
            '              <div className="relative text-[65px] sm:text-[85px] leading-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] translate-x-2 -translate-y-2">🪙</div>',
            '              <img src={coinIcon} alt="" aria-hidden="true" className="relative w-[65px] h-[65px] sm:w-[85px] sm:h-[85px] object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] translate-x-2 -translate-y-2" />',
            1,
        ),
        (
            '                <div className="text-[36px] sm:text-[40px] leading-none mb-2 drop-shadow-md">🪙</div>',
            '                <img src={coinIcon} alt="" aria-hidden="true" className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] object-contain mb-2 drop-shadow-md" />',
            1,
        ),
    ],
)

# --------------------------------------------------------------- SalesRecord
apply(
    "components/SalesRecord.tsx",
    [
        (
            "import { useUserProfile } from '../hooks/useFirebaseData';",
            "import { useUserProfile } from '../hooks/useFirebaseData';\nimport coinIcon from '../assets/coin.png';",
            1,
        ),
        (
            'src="https://cdn3d.iconscout.com/3d/premium/thumb/stack-of-gold-coins-6421319-5309657.png"',
            "src={coinIcon}",
            1,
        ),
    ],
)


def main() -> int:
    if problems:
        print("PATCH ABORTED - no files written")
        for p in problems:
            print("  -", p)
        return 1

    avatar_path = ROOT / "utils" / "avatar.ts"
    avatar_path.parent.mkdir(parents=True, exist_ok=True)
    avatar_path.write_text(AVATAR_TS, encoding="utf-8")

    print("Patched: HomeScreen, ProfileScreen, PlayScreen, OffersScreen, SalesRecord")
    print("Created: Arena/src/utils/avatar.ts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
