#!/usr/bin/env python3
"""One-off patch:
1. Panel headers read the tab name (Cricket / Match / Quiz) instead of "Play".
2. Match + Cricket cards show a "Live" button instead of "Edit".
3. Quiz questions and Earn tasks become collapsible cards.
"""

import sys
from pathlib import Path

ROOT = Path("Arena/src")
problems = []

QUIZ_OPEN_OLD = """                        <div
                          key={qIndex}
                          className="bg-white border text-sm border-gray-200 rounded p-2 shadow-sm relative pt-4"
                        >
                          <span className="absolute top-1 left-2 text-[10px] font-bold text-gray-400">
                            Q{qIndex + 1}
                          </span>
                          <input"""

QUIZ_OPEN_NEW = """                        <div
                          key={qIndex}
                          className="bg-white border text-sm border-gray-200 rounded-lg p-3 shadow-sm relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-gray-400">Q{qIndex + 1}</span>
                              <p className="font-semibold text-[13px] text-[#111] truncate">{q.q || "Untitled question"}</p>
                            </div>
                            <button
                              onClick={() => setExpandedQuizQ(expandedQuizQ === qIndex ? null : qIndex)}
                              className="shrink-0 text-[11px] font-bold text-[#5e35b1] border border-purple-200 bg-white px-2.5 py-1 rounded-lg"
                            >
                              {expandedQuizQ === qIndex ? "Close" : "Edit"}
                            </button>
                          </div>
                          {expandedQuizQ === qIndex && (
                          <div className="mt-2">
                          <input"""

QUIZ_CLOSE_OLD = """                            ))}
                          </div>
                        </div>
                      ))}"""

QUIZ_CLOSE_NEW = """                            ))}
                          </div>
                          </div>
                          )}
                        </div>
                      ))}"""

EARN_OPEN_OLD = """                      <div key={task.id} className="border border-gray-200 p-3 rounded-lg bg-gray-50 flex flex-col gap-2">
                         <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">{task.title}</span>
                         </div>"""

EARN_OPEN_NEW = """                      <div key={task.id} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex flex-col gap-2">
                         <div className="flex justify-between items-center gap-2">
                            <span className="font-bold text-sm truncate">{task.title || "Untitled task"}</span>
                            <button
                              onClick={() => setExpandedEarnTask(expandedEarnTask === index ? null : index)}
                              className="shrink-0 text-[11px] font-bold text-[#5e35b1] border border-purple-200 bg-white px-2.5 py-1 rounded-lg"
                            >
                              {expandedEarnTask === index ? "Close" : "Edit"}
                            </button>
                         </div>
                         {expandedEarnTask === index && (
                         <div className="flex flex-col gap-2">"""

EARN_CLOSE_OLD = """                         </div>
                       </div>
                    ))}"""

EARN_CLOSE_NEW = """                         </div>
                         </div>
                         )}
                       </div>
                    ))}"""

EDITS = [
    # states
    (
        '  const [taskTab, setTaskTab] = useState<\n'
        '    "reward" | "promotion" | "target" | "redeem"\n'
        '  >("reward");',
        '  const [taskTab, setTaskTab] = useState<\n'
        '    "reward" | "promotion" | "target" | "redeem"\n'
        '  >("reward");\n'
        "  const [expandedQuizQ, setExpandedQuizQ] = useState<number | null>(null);\n"
        "  const [expandedEarnTask, setExpandedEarnTask] = useState<number | null>(null);",
        1,
    ),
    # panel header shows the tab name
    (
        '            <h2 className="font-bold text-[17px]">Play</h2>',
        '            <h2 className="font-bold text-[17px] capitalize">\n'
        '              {createTab === "cricket" ? "Cricket" : createTab === "match" ? "Match" : "Quiz"}\n'
        "            </h2>",
        1,
    ),
    # inner accordion labels no longer duplicate the panel title
    (
        "                  Cricket\n"
        "                  {cricketExpanded ? (",
        "                  Matches\n"
        "                  {cricketExpanded ? (",
        1,
    ),
    (
        "                  Quiz\n"
        "                  {quizExpanded ? (",
        "                  Questions\n"
        "                  {quizExpanded ? (",
        1,
    ),
    # Live instead of Edit
    (
        '{expandedMatch === match.id ? "Close" : "Edit"}',
        '{expandedMatch === match.id ? "Close" : "Live"}',
        1,
    ),
    (
        '{expandedMatch === t.id ? "Close" : "Edit"}',
        '{expandedMatch === t.id ? "Close" : "Live"}',
        1,
    ),
    # collapsible quiz questions
    (QUIZ_OPEN_OLD, QUIZ_OPEN_NEW, 1),
    (QUIZ_CLOSE_OLD, QUIZ_CLOSE_NEW, 1),
    # collapsible earn tasks
    (EARN_OPEN_OLD, EARN_OPEN_NEW, 1),
    (EARN_CLOSE_OLD, EARN_CLOSE_NEW, 1),
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
    print("Patched: headers, Live button, collapsible quiz/earn cards.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
