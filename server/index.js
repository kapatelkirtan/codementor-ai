require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = Number(process.env.PORT || 8787);

const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "http://localhost:5173";

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);

// ======================================================
// JSON
// ======================================================

app.use(
  express.json({
    limit: "512kb",
  })
);

// ======================================================
// GEMINI
// ======================================================

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.5-flash-lite";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ======================================================
// LANGUAGES
// ======================================================

const LANGUAGES = {
  C: {
    id: 50,
    name: "C",
  },

  "C++": {
    id: 54,
    name: "C++",
  },

  Python: {
    id: 71,
    name: "Python",
  },

  Java: {
    id: 62,
    name: "Java",
  },

  JavaScript: {
    id: 63,
    name: "JavaScript",
  },
};

// ======================================================
// LEVELS
// ======================================================

const LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const ALGORITHM_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advance",
];

const STYLES = [
  "Modern Standard",
  "Legacy Turbo C",
];

// ======================================================
// AI SYSTEM PROMPT
// ======================================================

const SYSTEM_PROMPT = `
You are CodeMentor AI, an expert programming and
algorithm teacher.

Supported programming languages:

C
C++
Python
Java
JavaScript

==================================================
PROGRAMMING TEACHER
==================================================

Explain programming concepts clearly and simply.

==================================================
ALGORITHM TEACHER
==================================================

When teaching algorithms:

- Explain the meaning.
- Explain the purpose.
- Explain the simple idea.
- Explain variables.
- Explain steps.
- Give a small example.
- Explain complexity when useful.
- Give important exam points.
- Use very easy language for beginners.

==================================================
ALGORITHM GENERATOR
==================================================

When generating an algorithm, generate ONLY the
algorithm.

The output should resemble a college algorithm
notebook/exam format.

Preferred structure:

Algorithm: <algorithm name>

Algorithm:

<ALGORITHM-NAME>(parameters)
- Short one-line description.

Variables:

(i) VARIABLE : Meaning
(ii) VARIABLE : Meaning
(iii) VARIABLE : Meaning

Steps:

Step-1: [Short description]

<compact pseudocode or algorithm statements>

Step-2: [Short description]

...

Step-last: [Finish]

RETURN

Use simple notation such as:

IF ... THEN
END IF

FOR ... DO
END FOR

WHILE ... DO
END WHILE

ARR[i] <- VALUE

RETURN
FINISH

Do not automatically add long sections such as:
Purpose
Example
Expected Result
Time Complexity
Space Complexity
Important Points

unless the user specifically asks for them.

Keep the generated algorithm concise and exam-ready.

==================================================
CODE GENERATOR
==================================================

When generating code, return ONLY the complete
program source code.

Do NOT return:

- explanation
- how it works
- example input
- expected output
- important points
- headings
- Markdown code fences
- text before the code
- text after the code

For C, C++, Java and JavaScript:
include useful beginner-friendly comments.

For Python:
DO NOT include comments.

==================================================
LEGACY TURBO C
==================================================

When Legacy Turbo C is selected for C, the displayed
source must visibly use classic Turbo C style.

Use:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    ...

    getch();
}

Do not use int main(void) or int main().

==================================================
LEGACY TURBO C++
==================================================

When Legacy Turbo C is selected for C++, the displayed
source must visibly use classic Turbo C++ style.

Use:

#include <iostream.h>
#include <conio.h>

void main()
{
    clrscr();

    ...

    getch();
}

Do not use modern int main().

==================================================
MODERN C / C++
==================================================

Modern Standard C and C++ must not use:

conio.h
clrscr()
getch()
void main()

==================================================
OTHER LANGUAGES
==================================================

Python:
normal valid Python with NO comments.

Java:
normal valid Java with useful comments.

JavaScript:
normal Node.js JavaScript with useful comments.

==================================================
EXECUTION
==================================================

Never invent compiler output.

Judge0 performs actual execution.
`;

// ======================================================
// AI CHECK
// ======================================================

function requireAI() {
  if (!GEMINI_API_KEY) {
    const error = new Error(
      "Gemini AI is not configured. Add GEMINI_API_KEY to .env."
    );

    error.status = 503;

    throw error;
  }
}

// ======================================================
// GEMINI REQUEST
// ======================================================

async function askAI(instruction) {
  requireAI();

  const response = await fetch(
    GEMINI_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "x-goog-api-key":
          GEMINI_API_KEY,
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_PROMPT,
            },
          ],
        },

        contents: [
          {
            role: "user",

            parts: [
              {
                text: instruction,
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.15,
        },
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        `Gemini API request failed (${response.status}).`
    );

    error.status =
      response.status;

    throw error;
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map(
        (part) =>
          part.text || ""
      )
      .join("") || "";

  if (!text.trim()) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return text.trim();
}

// ======================================================
// CLEAN MARKDOWN
// ======================================================

function removeMarkdownCode(text) {
  return String(text || "")
    .replace(
      /```[a-zA-Z0-9_+#.-]*\s*/g,
      ""
    )
    .replace(
      /```/g,
      ""
    )
    .trim();
}

// ======================================================
// EXTRACT CODE
// ======================================================

function extractCode(text) {
  if (!text) {
    return "";
  }

  const source =
    String(text);

  const fencedMatch =
    source.match(
      /```(?:[a-zA-Z0-9_+#.-]+)?\s*([\s\S]*?)```/
    );

  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const codeMarker =
    source.match(
      /===\s*CODE\s*===([\s\S]*?)(?:===\s*HOW IT WORKS\s*===|===\s*EXPLANATION\s*===|$)/i
    );

  if (codeMarker) {
    return removeMarkdownCode(
      codeMarker[1]
    );
  }

  return removeMarkdownCode(
    source
  )
    .replace(
      /^===\s*CODE\s*===/i,
      ""
    )
    .trim();
}

// ======================================================
// CLEAN SOURCE
// ======================================================

function cleanSourceCode(code) {
  return removeMarkdownCode(
    code
  )
    .replace(
      /^===\s*CODE\s*===/i,
      ""
    )
    .trim();
}

// ======================================================
// MAIN CONVERSION
// ======================================================

function convertMainToVoidMain(
  code
) {
  let result = code;

  result =
    result.replace(
      /\bint\s+main\s*\(\s*void\s*\)/i,
      "void main()"
    );

  result =
    result.replace(
      /\bint\s+main\s*\(\s*\)/i,
      "void main()"
    );

  result =
    result.replace(
      /\bint\s+main\s*\(\s*int[\s\S]*?\)/i,
      "void main()"
    );

  return result;
}

// ======================================================
// ADD TURBO STATEMENTS
// ======================================================

function addLegacyMainStatements(
  code
) {
  let result =
    code;

  const mainMatch =
    /void\s+main\s*\(\s*\)\s*\{/i.exec(
      result
    );

  if (!mainMatch) {
    return result;
  }

  const openBrace =
    result.indexOf(
      "{",
      mainMatch.index
    );

  if (openBrace === -1) {
    return result;
  }

  let depth = 0;
  let closeBrace = -1;

  for (
    let i = openBrace;
    i < result.length;
    i++
  ) {
    if (
      result[i] === "{"
    ) {
      depth++;
    }

    if (
      result[i] === "}"
    ) {
      depth--;

      if (depth === 0) {
        closeBrace = i;
        break;
      }
    }
  }

  if (
    closeBrace === -1
  ) {
    return result;
  }

  let body =
    result.slice(
      openBrace + 1,
      closeBrace
    );

  body =
    body.replace(
      /^\s*return\s+[0-9]+\s*;\s*$/gim,
      ""
    );

  if (
    !/\bclrscr\s*\(\s*\)\s*;/i.test(
      body
    )
  ) {
    body =
      "\n    clrscr();\n" +
      body.trimStart();
  }

  if (
    !/\bgetch\s*\(\s*\)\s*;/i.test(
      body
    )
  ) {
    body =
      body.trimEnd() +
      "\n\n    getch();\n";
  }

  result =
    result.slice(
      0,
      openBrace + 1
    ) +
    body +
    result.slice(
      closeBrace
    );

  return result;
}

// ======================================================
// FORCE LEGACY C
// ======================================================

function forceLegacyTurboC(
  code
) {
  let result =
    cleanSourceCode(code);

  result =
    result.replace(
      /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
      ""
    );

  const usesStdio =
    /\bprintf\s*\(/i.test(
      result
    ) ||
    /\bscanf\s*\(/i.test(
      result
    ) ||
    /\bfprintf\s*\(/i.test(
      result
    ) ||
    /\bfscanf\s*\(/i.test(
      result
    );

  if (
    usesStdio &&
    !/#include\s*<stdio\.h>/i.test(
      result
    )
  ) {
    result =
      "#include <stdio.h>\n" +
      result;
  }

  if (
    !/#include\s*<conio\.h>/i.test(
      result
    )
  ) {
    const includes = [
      ...result.matchAll(
        /^#include[^\r\n]*(?:\r?\n|$)/gim
      ),
    ];

    if (includes.length) {
      const last =
        includes[
          includes.length - 1
        ];

      const insertAt =
        last.index +
        last[0].length;

      result =
        result.slice(
          0,
          insertAt
        ) +
        "#include <conio.h>\n" +
        result.slice(
          insertAt
        );
    } else {
      result =
        "#include <conio.h>\n" +
        result;
    }
  }

  result =
    convertMainToVoidMain(
      result
    );

  result =
    addLegacyMainStatements(
      result
    );

  return result
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

// ======================================================
// FORCE LEGACY C++
// ======================================================

function forceLegacyTurboCpp(
  code
) {
  let result =
    cleanSourceCode(code);

  result =
    result.replace(
      /#include\s*<iostream>/gi,
      "#include <iostream.h>"
    );

  result =
    result.replace(
      /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
      ""
    );

  const usesIO =
    /\bcout\s*<</i.test(
      result
    ) ||
    /\bcin\s*>>/i.test(
      result
    ) ||
    /\bendl\b/i.test(
      result
    );

  if (
    usesIO &&
    !/#include\s*<iostream\.h>/i.test(
      result
    )
  ) {
    result =
      "#include <iostream.h>\n" +
      result;
  }

  if (
    !/#include\s*<conio\.h>/i.test(
      result
    )
  ) {
    const includes = [
      ...result.matchAll(
        /^#include[^\r\n]*(?:\r?\n|$)/gim
      ),
    ];

    if (includes.length) {
      const last =
        includes[
          includes.length - 1
        ];

      const insertAt =
        last.index +
        last[0].length;

      result =
        result.slice(
          0,
          insertAt
        ) +
        "#include <conio.h>\n" +
        result.slice(
          insertAt
        );
    } else {
      result =
        "#include <conio.h>\n" +
        result;
    }
  }

  result =
    convertMainToVoidMain(
      result
    );

  result =
    addLegacyMainStatements(
      result
    );

  return result
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

// ======================================================
// APPLY STYLE
// ======================================================

function applySelectedCodeStyle(
  language,
  code,
  codeStyle
) {
  const cleaned =
    cleanSourceCode(code);

  if (
    codeStyle !==
    "Legacy Turbo C"
  ) {
    return cleaned;
  }

  if (
    language === "C"
  ) {
    return forceLegacyTurboC(
      cleaned
    );
  }

  if (
    language === "C++"
  ) {
    return forceLegacyTurboCpp(
      cleaned
    );
  }

  return cleaned;
}

// ======================================================
// AUTOMATIC LANGUAGE DETECTION
// ======================================================
//
// Algorithm Code Runner intentionally has NO language
// selector in the UI.
//
// The server detects the language from the source code.
// ======================================================

function detectLanguage(code) {
  const source =
    String(code || "").trim();

  // ----------------------------------------------------
  // JavaScript
  // ----------------------------------------------------

  if (
    /require\s*\(\s*['"](?:fs|readline)['"]\s*\)/i.test(
      source
    ) ||
    /\bconsole\.log\s*\(/i.test(
      source
    ) ||
    /\bprocess\.stdin\b/i.test(
      source
    ) ||
    /\bconst\s+\w+\s*=/.test(
      source
    ) ||
    /\blet\s+\w+\s*=/.test(
      source
    )
  ) {
    return "JavaScript";
  }

  // ----------------------------------------------------
  // Java
  // ----------------------------------------------------

  if (
    /\bpublic\s+class\s+\w+/i.test(
      source
    ) ||
    /\bpublic\s+static\s+void\s+main\s*\(/i.test(
      source
    ) ||
    /\bSystem\.out\.(?:print|println)\s*\(/i.test(
      source
    ) ||
    /\bimport\s+java\./i.test(
      source
    )
  ) {
    return "Java";
  }

  // ----------------------------------------------------
  // Python
  // ----------------------------------------------------

  if (
    /^#!/m.test(source) &&
    /python/i.test(source)
  ) {
    return "Python";
  }

  if (
    /\bdef\s+\w+\s*\(/i.test(
      source
    ) ||
    /\bprint\s*\(/i.test(
      source
    ) ||
    /\binput\s*\(/i.test(
      source
    ) ||
    /\bimport\s+\w+/i.test(
      source
    )
  ) {
    return "Python";
  }

  // ----------------------------------------------------
  // C++
  // ----------------------------------------------------

  if (
    /#include\s*<iostream(?:\.h)?>/i.test(
      source
    ) ||
    /\busing\s+namespace\s+std\s*;/i.test(
      source
    ) ||
    /\bcout\s*<</i.test(
      source
    ) ||
    /\bcin\s*>>/i.test(
      source
    ) ||
    /\bstd::(cout|cin|vector|string)\b/i.test(
      source
    )
  ) {
    return "C++";
  }

  // ----------------------------------------------------
  // C
  // ----------------------------------------------------

  if (
    /#include\s*<stdio\.h>/i.test(
      source
    ) ||
    /#include\s*<conio\.h>/i.test(
      source
    ) ||
    /\bprintf\s*\(/i.test(
      source
    ) ||
    /\bscanf\s*\(/i.test(
      source
    ) ||
    /\bvoid\s+main\s*\(/i.test(
      source
    ) ||
    /\bint\s+main\s*\(/i.test(
      source
    )
  ) {
    return "C";
  }

  // Default.
  return "C";
}

// ======================================================
// HEALTH
// ======================================================

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,
      aiProvider: "Gemini",
      aiConfigured:
        Boolean(
          GEMINI_API_KEY
        ),
      model:
        GEMINI_MODEL,
      judge0Configured:
        Boolean(
          process.env.JUDGE0_URL
        ),
      legacyTurboCFix:
        true,
      algorithmSystem:
        true,
      algorithmGenerator:
        true,
      algorithmCodeRunner:
        true,
      algorithmRunnerAutoDetect:
        true,
    });
  }
);

// ======================================================
// AI TEACHER
// ======================================================

app.post(
  "/api/ai/teach",
  async (req, res) => {
    try {
      const {
        language,
        level,
        question,
        algorithmMode,
      } = req.body;

      if (
        !question ||
        typeof question !==
          "string" ||
        !question.trim()
      ) {
        return res.status(400).json({
          error:
            "Enter a question.",
        });
      }

      if (
        question.length >
        6000
      ) {
        return res.status(400).json({
          error:
            "Question is too long.",
        });
      }

      const instruction = `
Learning level:
${level || "Beginner"}

Language:
${language || "General"}

Algorithm Teacher:
${
  algorithmMode
    ? "YES"
    : "NO"
}

Student question:
${question.trim()}

${
  algorithmMode
    ? `
Teach this algorithm/topic in very easy language.

Include:

ALGORITHM NAME
WHAT IS IT?
WHY IS IT USED?
SIMPLE IDEA
VARIABLES
STEPS
EXAMPLE
TIME COMPLEXITY
SPACE COMPLEXITY
IMPORTANT EXAM POINTS

Use short and clear explanations.
`
    : `
Teach the programming topic clearly and simply.
`
}

Do not claim that you executed any program.
`;

      const answer =
        await askAI(
          instruction
        );

      res.json({
        answer,
      });
    } catch (error) {
      console.error(
        "AI Teacher Error:",
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          "AI Teacher request failed.",
      });
    }
  }
);

// ======================================================
// ALGORITHM LEARNING / PRACTICE
// ======================================================

app.post(
  "/api/ai/algorithm",
  async (req, res) => {
    try {
      const {
        topic,
        level,
        mode,
        userAnswer,
      } = req.body;

      if (
        !topic ||
        typeof topic !==
          "string" ||
        !topic.trim()
      ) {
        return res.status(400).json({
          error:
            "Enter an algorithm topic.",
        });
      }

      const validModes = [
        "teach",
        "explain",
        "practice",
      ];

      if (
        !validModes.includes(
          mode
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid algorithm mode.",
        });
      }

      let instruction = "";

      if (
        mode === "teach"
      ) {
        instruction = `
Teach this algorithm to a
${level || "Beginner"} student:

${topic.trim()}

Use extremely easy language.

Explain:
1. What it means
2. Why it is used
3. Simple idea
4. Variables
5. Steps
6. Example
7. Time complexity
8. Space complexity
9. Important exam points
`;
      }

      if (
        mode === "explain"
      ) {
        instruction = `
Explain this algorithm in very easy language:

${topic.trim()}

Learning level:
${level || "Beginner"}

Give a small example.
`;
      }

      if (
        mode === "practice"
      ) {
        instruction = `
Create an algorithm practice question about:

${topic.trim()}

Learning level:
${level || "Beginner"}

Give:

PRACTICE QUESTION
INPUT
TASK
HINT

Student answer:

${userAnswer || "No answer supplied."}

If a student answer exists, evaluate it and explain
what is correct and what needs improvement.
`;
      }

      const answer =
        await askAI(
          instruction
        );

      res.json({
        answer,
        topic:
          topic.trim(),
        level:
          level || "Beginner",
        mode,
      });
    } catch (error) {
      console.error(
        "Algorithm AI Error:",
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          "Algorithm request failed.",
      });
    }
  }
);

// ======================================================
// ALGORITHM GENERATOR
// ======================================================

app.post(
  "/api/ai/generate-algorithm",
  async (req, res) => {
    try {
      const {
        topic,
        level,
      } = req.body;

      if (
        !topic ||
        typeof topic !==
          "string" ||
        !topic.trim()
      ) {
        return res.status(400).json({
          error:
            "Enter an algorithm problem or instructions.",
        });
      }

      const selectedLevel =
        ALGORITHM_LEVELS.includes(
          level
        )
          ? level
          : "Beginner";

      const instruction = `
Generate an exam-ready algorithm.

Learning level:
${selectedLevel}

Algorithm problem / instructions:
${topic.trim()}

IMPORTANT:

Generate ONLY the algorithm.

Do not generate C, C++, Python, Java or JavaScript.

Do not generate a programming-language program.

Do not write a long explanation.

Follow this exact overall style:

Algorithm: <algorithm name>

Algorithm:

<ALGORITHM-NAME>(parameters)
- One short description.

Variables:

(i) VARIABLE : Meaning
(ii) VARIABLE : Meaning
(iii) VARIABLE : Meaning
(iv) VARIABLE : Meaning

Steps:

Step-1: [Short description]

<algorithm statements / pseudocode>

Step-2: [Short description]

<algorithm statements / pseudocode>

Step-last: [Finish]

RETURN

Important rules:

- Keep it short.
- Make it exam-ready.
- Use easy language.
- Clearly explain variables.
- Use numbered steps.
- Use compact pseudocode.
- Use notation such as IF, THEN, FOR, DO,
  END IF, END FOR, RETURN and FINISH.
- Do not automatically add long Purpose,
  Example, Expected Result, Complexity or
  Important Points sections.
- Add only information necessary for the requested
  algorithm.
`;

      const answer =
        await askAI(
          instruction
        );

      let algorithm =
        String(
          answer || ""
        )
          .replace(
            /```[a-zA-Z0-9_+#.-]*\s*/g,
            ""
          )
          .replace(
            /```/g,
            ""
          )
          .trim();

      algorithm =
        algorithm.replace(
          /^===\s*ALGORITHM\s*===/i,
          ""
        ).trim();

      res.json({
        algorithm,
        level:
          selectedLevel,
      });
    } catch (error) {
      console.error(
        "Algorithm Generator Error:",
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          "Algorithm generation failed.",
      });
    }
  }
);

// ======================================================
// CODE GENERATOR
// ======================================================

app.post(
  "/api/ai/generate-code",
  async (req, res) => {
    try {
      const {
        language,
        level,
        codeStyle,
        topic,
      } = req.body;

      if (
        !LANGUAGES[language]
      ) {
        return res.status(400).json({
          error:
            "Choose a supported programming language.",
        });
      }

      if (
        !LEVELS.includes(
          level
        )
      ) {
        return res.status(400).json({
          error:
            "Choose a valid learning level.",
        });
      }

      // C/C++ need a style.
      if (
        (
          language === "C" ||
          language === "C++"
        ) &&
        !STYLES.includes(
          codeStyle
        )
      ) {
        return res.status(400).json({
          error:
            "Choose a valid C/C++ code style.",
        });
      }

      // Non-C/C++ ignore code style.
      const effectiveStyle =
        language === "C" ||
        language === "C++"
          ? codeStyle
          : "Modern Standard";

      if (
        !topic ||
        typeof topic !==
          "string" ||
        !topic.trim()
      ) {
        return res.status(400).json({
          error:
            "Enter a programming problem.",
        });
      }

      if (
        topic.length >
        6000
      ) {
        return res.status(400).json({
          error:
            "Programming request is too long.",
        });
      }

      let styleRules = "";

      if (
        language === "C"
      ) {
        if (
          effectiveStyle ===
          "Legacy Turbo C"
        ) {
          styleRules = `
Use classic Turbo C source structure:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

The source MUST visibly contain:
conio.h
void main()
clrscr()
getch()
`;
        } else {
          styleRules = `
Use Modern Standard C.

Use standard headers and:

int main(void)

Do not use:
conio.h
clrscr()
getch()
void main()
`;
        }
      }

      if (
        language === "C++"
      ) {
        if (
          effectiveStyle ===
          "Legacy Turbo C"
        ) {
          styleRules = `
Use classic Turbo C++ source structure:

#include <iostream.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

The source MUST visibly contain:
conio.h
void main()
clrscr()
getch()
`;
        } else {
          styleRules = `
Use Modern Standard C++.

Use:
#include <iostream>
int main()

Do not use:
conio.h
clrscr()
getch()
void main()
`;
        }
      }

      if (
        language === "Python"
      ) {
        styleRules = `
Generate normal valid Python.

IMPORTANT:
Do NOT include Python comments.
No lines beginning with #.
`;
      }

      if (
        language === "Java"
      ) {
        styleRules = `
Generate normal valid Java.

Include useful beginner-friendly comments.

Use:

public class Main
`;
      }

      if (
        language === "JavaScript"
      ) {
        styleRules = `
Generate normal Node.js JavaScript.

Include useful beginner-friendly comments.

Use standard input when required.
Do not use external packages.
`;
      }

      const commentRules =
        language === "Python"
          ? `
PYTHON COMMENT RULE:

DO NOT write comments.

Return executable Python code only.
`
          : `
COMMENTS:

Include useful beginner-friendly comments
inside the ${language} program.

Do not write any explanation outside the code.
`;

      const instruction = `
Generate ONE complete ${language} program.

Learning level:
${level}

Code style:
${effectiveStyle}

Programming problem:
${topic.trim()}

Style requirements:
${styleRules}

${commentRules}

VERY IMPORTANT OUTPUT RULE:

Return ONLY the complete program source code.

Do NOT return:

- explanation
- how it works
- example input
- expected output
- important points
- headings
- Markdown code fences
- text before the code
- text after the code

The response must contain ONLY valid ${language}
source code.
`;

      const answer =
        await askAI(
          instruction
        );

      let code =
        extractCode(answer);

      if (!code) {
        throw new Error(
          "Gemini did not return code."
        );
      }

      code =
        applySelectedCodeStyle(
          language,
          code,
          effectiveStyle
        );

      // Extra Python cleanup.
      if (
        language ===
        "Python"
      ) {
        code =
          code.replace(
            /^\s*#.*$/gm,
            ""
          )
          .replace(
            /\n{3,}/g,
            "\n\n"
          )
          .trim();
      }

      res.json({
        code,
        language,
        level,
        codeStyle:
          effectiveStyle,
      });
    } catch (error) {
      console.error(
        "Code Generation Error:",
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          "Code generation failed.",
      });
    }
  }
);

// ======================================================
// JUDGE0 HEADERS
// ======================================================

function judgeHeaders() {
  const headers = {
    "Content-Type":
      "application/json",
  };

  if (
    process.env.JUDGE0_API_KEY
  ) {
    headers["X-Auth-Token"] =
      process.env.JUDGE0_API_KEY;
  }

  if (
    process.env.JUDGE0_AUTH_USER
  ) {
    headers["X-Auth-User"] =
      process.env.JUDGE0_AUTH_USER;
  }

  return headers;
}

// ======================================================
// JUDGE0 FETCH
// ======================================================

async function judgeFetch(
  path,
  options = {}
) {
  const base = (
    process.env.JUDGE0_URL ||
    ""
  ).replace(
    /\/$/,
    ""
  );

  if (!base) {
    throw new Error(
      "JUDGE0_URL is not configured."
    );
  }

  return fetch(
    base + path,
    {
      ...options,

      headers: {
        ...judgeHeaders(),
        ...(options.headers || {}),
      },
    }
  );
}

// ======================================================
// PREPARE LEGACY CODE FOR JUDGE0
// ======================================================

function prepareLegacyTurboCode(
  language,
  code,
  codeStyle
) {
  if (
    codeStyle !==
    "Legacy Turbo C"
  ) {
    return code;
  }

  if (
    language !== "C" &&
    language !== "C++"
  ) {
    return code;
  }

  let runnable =
    code;

  runnable =
    runnable.replace(
      /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
      ""
    );

  runnable =
    runnable.replace(
      /\bclrscr\s*\(\s*\)\s*;?/gi,
      ""
    );

  runnable =
    runnable.replace(
      /\bgetch\s*\(\s*\)\s*;?/gi,
      ""
    );

  if (
    language ===
    "C++"
  ) {
    runnable =
      runnable.replace(
        /#include\s*<iostream\.h>/gi,
        "#include <iostream>"
      );
  }

  runnable =
    runnable.replace(
      /\bvoid\s+main\s*\(\s*\)/i,
      "int main()"
    );

  runnable =
    runnable.replace(
      /^\s*return\s+[0-9]+\s*;\s*$/gim,
      ""
    );

  const lastBrace =
    runnable.lastIndexOf("}");

  if (
    lastBrace !== -1
  ) {
    runnable =
      runnable.slice(
        0,
        lastBrace
      ) +
      "\n    return 0;\n" +
      runnable.slice(
        lastBrace
      );
  }

  return runnable
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

// ======================================================
// RUN JUDGE0
// ======================================================

async function runJudge0(
  language,
  code,
  stdin,
  codeStyle
) {
  const lang =
    LANGUAGES[
      language
    ];

  if (!lang) {
    throw new Error(
      "Unsupported programming language."
    );
  }

  const sourceCode =
    prepareLegacyTurboCode(
      language,
      code,
      codeStyle ||
        "Modern Standard"
    );

  const submit =
    await judgeFetch(
      "/submissions/?base64_encoded=false&wait=false",
      {
        method: "POST",

        body:
          JSON.stringify({
            language_id:
              lang.id,

            source_code:
              sourceCode,

            stdin:
              stdin || "",

            cpu_time_limit:
              3,

            wall_time_limit:
              5,

            memory_limit:
              128000,

            max_processes_and_or_threads:
              30,

            max_file_size:
              1024,
          }),
      }
    );

  if (
    !submit.ok
  ) {
    const body =
      await submit.text();

    throw new Error(
      `Judge0 submission failed (${submit.status}): ${body.slice(
        0,
        500
      )}`
    );
  }

  const {
    token,
  } =
    await submit.json();

  if (!token) {
    throw new Error(
      "Judge0 did not return a submission token."
    );
  }

  for (
    let i = 0;
    i < 30;
    i++
  ) {
    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          500
        )
    );

    const result =
      await judgeFetch(
        `/submissions/${encodeURIComponent(
          token
        )}?base64_encoded=false`,
        {
          method: "GET",
        }
      );

    if (
      !result.ok
    ) {
      throw new Error(
        `Judge0 result failed (${result.status}).`
      );
    }

    const data =
      await result.json();

    if (
      data.status?.id >
      2
    ) {
      return data;
    }
  }

  throw new Error(
    "Execution timed out."
  );
}

// ======================================================
// CODE EXECUTION
// ======================================================

app.post(
  "/api/code/run",
  async (req, res) => {
    try {
      const {
        language,
        code,
        stdin,
        codeStyle,
      } = req.body;

      if (
        !code ||
        typeof code !==
          "string"
      ) {
        return res.status(400).json({
          error:
            "Code is required.",
        });
      }

      const result =
        await runJudge0(
          language,
          code,
          typeof stdin ===
          "string"
            ? stdin
            : "",
          codeStyle ||
            "Modern Standard"
        );

      res.json({
        status:
          result.status?.description ||
          "Unknown",

        stdout:
          result.stdout ||
          "",

        stderr:
          result.stderr ||
          "",

        compileOutput:
          result.compile_output ||
          "",

        message:
          result.message ||
          "",

        time:
          result.time ||
          null,

        memory:
          result.memory ||
          null,

        token:
          result.token ||
          null,
      });
    } catch (error) {
      console.error(
        "Code Execution Error:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "Code execution failed.",
      });
    }
  }
);

// ======================================================
// ALGORITHM CODE RUNNER
// ======================================================
//
// No language is supplied by the frontend.
// The backend detects it automatically.
// ======================================================

app.post(
  "/api/algorithm/run",
  async (req, res) => {
    try {
      const {
        code,
        stdin,
      } = req.body;

      if (
        !code ||
        typeof code !==
          "string" ||
        !code.trim()
      ) {
        return res.status(400).json({
          error:
            "Algorithm program code is required.",
        });
      }

      const detectedLanguage =
        detectLanguage(
          code
        );

      // Automatically determine legacy style
      // for C/C++ if classic Turbo C syntax is present.
      let detectedStyle =
        "Modern Standard";

      if (
        detectedLanguage ===
          "C" ||
        detectedLanguage ===
          "C++"
      ) {
        if (
          /#include\s*<conio\.h>/i.test(
            code
          ) ||
          /\bclrscr\s*\(/i.test(
            code
          ) ||
          /\bgetch\s*\(/i.test(
            code
          ) ||
          /\bvoid\s+main\s*\(/i.test(
            code
          ) ||
          /#include\s*<iostream\.h>/i.test(
            code
          )
        ) {
          detectedStyle =
            "Legacy Turbo C";
        }
      }

      const result =
        await runJudge0(
          detectedLanguage,
          code,
          typeof stdin ===
          "string"
            ? stdin
            : "",
          detectedStyle
        );

      res.json({
        detectedLanguage,
        detectedStyle,

        status:
          result.status?.description ||
          "Unknown",

        stdout:
          result.stdout ||
          "",

        stderr:
          result.stderr ||
          "",

        compileOutput:
          result.compile_output ||
          "",

        message:
          result.message ||
          "",

        time:
          result.time ||
          null,

        memory:
          result.memory ||
          null,

        token:
          result.token ||
          null,
      });
    } catch (error) {
      console.error(
        "Algorithm Runner Error:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "Algorithm code execution failed.",
      });
    }
  }
);

// ======================================================
// SERVER
// ======================================================

app.listen(
  PORT,
  () => {
    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      "            CODEMENTOR AI"
    );

    console.log(
      "=========================================="
    );

    console.log(
      `Backend: http://localhost:${PORT}`
    );

    console.log(
      "AI Provider: Google Gemini"
    );

    console.log(
      `Gemini Model: ${GEMINI_MODEL}`
    );

    console.log(
      `Gemini Configured: ${Boolean(
        GEMINI_API_KEY
      )}`
    );

    console.log(
      `Judge0 URL: ${
        process.env.JUDGE0_URL ||
        "Not configured"
      }`
    );

    console.log(
      "Legacy Turbo C Fix: ENABLED"
    );

    console.log(
      "Algorithm System: ENABLED"
    );

    console.log(
      "Algorithm Generator: ENABLED"
    );

    console.log(
      "Algorithm Code Runner: ENABLED"
    );

    console.log(
      "Algorithm Runner Auto-Detection: ENABLED"
    );

    console.log(
      "=========================================="
    );

    console.log("");
  }
);