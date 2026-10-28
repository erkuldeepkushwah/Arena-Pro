#!/usr/bin/env python3
"""One-off patch:
1. Admin: app settings section with Logo + Coin Icon upload (saved to global/siteConfig).
2. App: logo on login/signup, coin icon everywhere from site config (fallback local asset).
3. Play: cricket tab gets a bat icon; Room Details join text/button removed.
"""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

IMAGE_UPLOAD_TS = '''/**
 * Read a picked image file and return a downscaled PNG data URL. Used for
 * settings images (app logo, coin icon) stored on the global site config.
 */
export const fileToImageDataUrl = (file: File, max = 256): Promise<string> =>
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
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process that image."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
'''

SITE_CONFIG_HOOK = '''
/** Global app settings saved by the admin (logo, coin icon, QR, banners...). */
export const useSiteConfig = () => {
  const [config, setConfig] = useState<any>(null);
  useEffect(() => {
    return onValue(
      ref(rtdb, "global/siteConfig"),
      (snap) => setConfig(snap.exists() ? snap.val() : null),
      console.error,
    );
  }, []);
  return config;
};
'''

ACCORDION_TEMPLATE = '''            <div
              className={`border border-gray-200 rounded-lg ${__EXP__ ? "shadow-sm" : ""}`}
            >
              <button
                onClick={() => __SET__(!__EXP__)}
                className={`w-full p-4 flex justify-between items-center font-bold text-[15px] text-[#374151] ${__EXP__ ? "bg-[#f8f9fa] border-b border-gray-200 rounded-t-lg" : "bg-white rounded-lg"}`}
              >
                __LABEL__
                {__EXP__ ? (
                  <ChevronUp className="text-gray-500 w-5 h-5" />
                ) : (
                  <ChevronDown className="text-gray-500 w-5 h-5" />
                )}
              </button>

              {__EXP__ && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => __REF__.current?.click()}
                      className="w-16 h-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0"
                    >
                      {siteCfg.__KEY__ ? (
                        <img src={siteCfg.__KEY__} alt="__LABEL__" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400">Upload</span>
                      )}
                    </button>
                    <div className="text-[12px] text-gray-500 leading-snug">
                      Tap the box to pick an image.
                      {siteCfg.__KEY__ && (
                        <button
                          onClick={() => saveSiteConfig({ __KEY__: "" })}
                          className="block text-red-600 font-bold mt-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={__REF__}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSettingImage(e, "__KEY__")}
                  />
                </div>
              )}
            </div>

'''


def accordion(key: str, label: str, ref_name: str, expanded: str, setter: str) -> str:
    return (
        ACCORDION_TEMPLATE
        .replace("__KEY__", key)
        .replace("__LABEL__", label)
        .replace("__REF__", ref_name)
        .replace("__EXP__", expanded)
        .replace("__SET__", setter)
    )


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


QR_ANCHOR = '''            <div
              className={`border border-gray-200 rounded-lg ${uiExpanded ? "shadow-sm" : ""}`}
            >
              <button
                onClick={() => setUiExpanded(!uiExpanded)}'''

# ------------------------------------------------------------- AdminDashboard
apply(
    "components/AdminDashboard.tsx",
    [
        (
            'import { logTransaction } from "../utils/transactions";',
            'import { logTransaction } from "../utils/transactions";\n'
            'import { fileToImageDataUrl } from "../utils/imageUpload";',
            1,
        ),
        (
            "  const [uiExpanded, setUiExpanded] = useState(false);",
            "  const [uiExpanded, setUiExpanded] = useState(false);\n"
            "  const [logoExpanded, setLogoExpanded] = useState(false);\n"
            "  const [coinExpanded, setCoinExpanded] = useState(false);",
            1,
        ),
        (
            "  const [siteCfg, setSiteCfg] = useState<any>({\n"
            '    redeemCode: "",\n'
            '    redeemAmount: "",\n'
            '    paymentQr: "",\n'
            "    banners: [],\n"
            "  });",
            "  const [siteCfg, setSiteCfg] = useState<any>({\n"
            '    redeemCode: "",\n'
            '    redeemAmount: "",\n'
            '    paymentQr: "",\n'
            '    logoUrl: "",\n'
            '    coinIcon: "",\n'
            "    banners: [],\n"
            "  });",
            1,
        ),
        (
            '      notify("Could not save.", "error");\n'
            "    }\n"
            "  };",
            '      notify("Could not save.", "error");\n'
            "    }\n"
            "  };\n"
            "\n"
            "  const logoInputRef = useRef<HTMLInputElement>(null);\n"
            "  const coinInputRef = useRef<HTMLInputElement>(null);\n"
            "\n"
            "  const handleSettingImage = async (\n"
            "    e: React.ChangeEvent<HTMLInputElement>,\n"
            '    key: "logoUrl" | "coinIcon",\n'
            "  ) => {\n"
            "    const file = e.target.files?.[0];\n"
            '    e.target.value = "";\n'
            "    if (!file) return;\n"
            "    try {\n"
            "      const dataUrl = await fileToImageDataUrl(file, 256);\n"
            "      await saveSiteConfig({ [key]: dataUrl });\n"
            "    } catch (err: any) {\n"
            '      alert(err?.message || "Could not upload that image.");\n'
            "    }\n"
            "  };",
            1,
        ),
        (
            QR_ANCHOR,
            accordion("logoUrl", "App Logo", "logoInputRef", "logoExpanded", "setLogoExpanded")
            + accordion("coinIcon", "Coin Icon", "coinInputRef", "coinExpanded", "setCoinExpanded")
            + QR_ANCHOR,
            1,
        ),
    ],
)

# --------------------------------------------------------------- AuthScreen
apply(
    "components/AuthScreen.tsx",
    [
        (
            "import { SignUpScreen } from './SignUpScreen';",
            "import { SignUpScreen } from './SignUpScreen';\n"
            "import { useSiteConfig } from '../hooks/useFirebaseData';",
            1,
        ),
        (
            "  const [loading, setLoading] = useState(false);",
            "  const [loading, setLoading] = useState(false);\n"
            "  const siteCfg = useSiteConfig();",
            1,
        ),
        (
            '        <div className="bg-[#6D28D9] rounded-[1.7rem] px-8 py-3 mb-4 shadow-sm">\n'
            '          <span className="text-white text-[28px] font-bold tracking-wide">Arena Pro</span>\n'
            "        </div>",
            "        {siteCfg?.logoUrl ? (\n"
            '          <img src={siteCfg.logoUrl} alt="Arena Pro" className="h-16 mb-4 object-contain" />\n'
            "        ) : (\n"
            '          <div className="bg-[#6D28D9] rounded-[1.7rem] px-8 py-3 mb-4 shadow-sm">\n'
            '            <span className="text-white text-[28px] font-bold tracking-wide">Arena Pro</span>\n'
            "          </div>\n"
            "        )}",
            1,
        ),
    ],
)

# ------------------------------------------------------------- SignUpScreen
apply(
    "components/SignUpScreen.tsx",
    [
        (
            "import { emailForNumber, friendlyAuthError } from '../utils/authErrors';",
            "import { emailForNumber, friendlyAuthError } from '../utils/authErrors';\n"
            "import { useSiteConfig } from '../hooks/useFirebaseData';",
            1,
        ),
        (
            "  const [touched, setTouched] = useState<Record<string, boolean>>({});",
            "  const [touched, setTouched] = useState<Record<string, boolean>>({});\n"
            "  const siteCfg = useSiteConfig();",
            1,
        ),
        (
            '        <div className="bg-[#6D28D9] rounded-[1.7rem] px-8 py-3 mb-4 shadow-sm">\n'
            '          <span className="text-white text-[26px] font-bold tracking-wide">Arena Pro</span>\n'
            "        </div>",
            "        {siteCfg?.logoUrl ? (\n"
            '          <img src={siteCfg.logoUrl} alt="Arena Pro" className="h-14 mb-4 object-contain" />\n'
            "        ) : (\n"
            '          <div className="bg-[#6D28D9] rounded-[1.7rem] px-8 py-3 mb-4 shadow-sm">\n'
            '            <span className="text-white text-[26px] font-bold tracking-wide">Arena Pro</span>\n'
            "          </div>\n"
            "        )}",
            1,
        ),
    ],
)

# ---------------------------------------------------------------- HomeScreen
apply(
    "components/HomeScreen.tsx",
    [
        (
            'import { useUserProfile, useTopPromotions } from "../hooks/useFirebaseData";',
            'import { useUserProfile, useTopPromotions, useSiteConfig } from "../hooks/useFirebaseData";',
            1,
        ),
        (
            "  const coins = userProfile?.coins || 0;",
            "  const coins = userProfile?.coins || 0;\n"
            "  const siteCfg = useSiteConfig();\n"
            "  const coinSrc = siteCfg?.coinIcon || coinIcon;",
            1,
        ),
        ("src={coinIcon}", "src={coinSrc}", 1),
    ],
)

# ------------------------------------------------------------- ProfileScreen
apply(
    "components/ProfileScreen.tsx",
    [
        (
            'import { useUserProfile } from "../hooks/useFirebaseData";',
            'import { useUserProfile, useSiteConfig } from "../hooks/useFirebaseData";',
            1,
        ),
        (
            "  const coins = userProfile?.coins || 0;",
            "  const coins = userProfile?.coins || 0;\n"
            "  const siteCfg = useSiteConfig();\n"
            "  const coinSrc = siteCfg?.coinIcon || coinIcon;",
            1,
        ),
        ("src={coinIcon}", "src={coinSrc}", 1),
    ],
)

# ---------------------------------------------------------------- PlayScreen
apply(
    "components/PlayScreen.tsx",
    [
        (
            "  useUserProfile,\n} from \"../hooks/useFirebaseData\";",
            "  useUserProfile,\n  useSiteConfig,\n} from \"../hooks/useFirebaseData\";",
            1,
        ),
        (
            "  const QUIZ_CONFIG = useQuizConfig();\n  const CRICKET_MATCHES = useCricketMatches();",
            "  const QUIZ_CONFIG = useQuizConfig();\n"
            "  const CRICKET_MATCHES = useCricketMatches();\n"
            "  const siteCfg = useSiteConfig();\n"
            "  const coinSrc = siteCfg?.coinIcon || coinIcon;",
            1,
        ),
        ("src={coinIcon}", "src={coinSrc}", 2),
        (
            '            <img\n'
            '              src="https://uploads.onecompiler.io/44pbfr3gy/44pbfr8db/cricket-ball.png"\n'
            '              alt="Cricket"\n'
            '              className={`w-4 h-4 object-contain ${activeTab === "cricket" ? "brightness-0 invert" : ""}`}\n'
            "            />",
            '            <span className="text-[15px] leading-none">🏏</span>',
            1,
        ),
        (
            "                ) : (\n"
            "                   <>\n"
            '                     <p className="text-[14px] font-bold text-[#111] mb-6">\n'
            "                       Join the match to check room Id\n"
            "                     </p>\n"
            '                     <div className="flex justify-center mb-6">\n'
            "                       <button\n"
            "                         onClick={() => setJoinModal({ show: true, room: selectedRoom })}\n"
            '                         className="bg-[#5e35b1] hover:bg-[#4b2a8d] text-white font-bold py-3 px-12 rounded-[25px] transition-colors shadow-md shadow-purple-200"\n'
            "                       >\n"
            "                         Join\n"
            "                       </button>\n"
            "                     </div>\n"
            "                   </>\n"
            "                )}",
            "                ) : null}",
            1,
        ),
    ],
)

# -------------------------------------------------------------- OffersScreen
apply(
    "components/OffersScreen.tsx",
    [
        (
            'import { useUserProfile } from "../hooks/useFirebaseData";',
            'import { useUserProfile, useSiteConfig } from "../hooks/useFirebaseData";',
            1,
        ),
        (
            "  const profile = useUserProfile();",
            "  const profile = useUserProfile();\n"
            "  const siteCfg = useSiteConfig();\n"
            "  const coinSrc = siteCfg?.coinIcon || coinIcon;",
            1,
        ),
        ("src={coinIcon}", "src={coinSrc}", 2),
    ],
)

# --------------------------------------------------------------- SalesRecord
apply(
    "components/SalesRecord.tsx",
    [
        (
            "import { useUserProfile } from '../hooks/useFirebaseData';",
            "import { useUserProfile, useSiteConfig } from '../hooks/useFirebaseData';",
            1,
        ),
        (
            "  const profile = useUserProfile();",
            "  const profile = useUserProfile();\n"
            "  const siteCfg = useSiteConfig();\n"
            "  const coinSrc = siteCfg?.coinIcon || coinIcon;",
            1,
        ),
        ("src={coinIcon}", "src={coinSrc}", 1),
    ],
)


def main() -> int:
    if problems:
        print("PATCH ABORTED - no files written")
        for p in problems:
            print("  -", p)
        return 1

    (ROOT / "utils" / "imageUpload.ts").write_text(IMAGE_UPLOAD_TS, encoding="utf-8")

    hooks = ROOT / "hooks" / "useFirebaseData.ts"
    text = hooks.read_text(encoding="utf-8")
    if "export const useSiteConfig" not in text:
        hooks.write_text(text.rstrip("\n") + "\n" + SITE_CONFIG_HOOK, encoding="utf-8")

    print("Patched admin settings, logo, coin icon, cricket icon, room details.")
    print("Created: Arena/src/utils/imageUpload.ts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
