require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = Number(process.env.PORT || 8787);
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);

app.use(
  express.json({
    limit: "512kb",
  })
);

// ============================================================
// CONFIGURATION
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/` +
  `${GEMINI_MODEL}:generateContent`;

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

const CODE_STYLES = [
  "Modern Standard",
  "Legacy Turbo C",
];

// ============================================================
// AI SYSTEM PROMPT
// ============================================================

const SYSTEM_PROMPT = `
You are CodeMentor AI, an expert programming teacher.

Teach C, C++, Python, Java and JavaScript accurately.

Always use easy beginner-friendly language when teaching.

The website has these features:
1. AI Teacher
2. Code Generator
3. Algorithm Learning
4. Algorithm Generator
5. Code Lab
6. Algorithm Code Runner
7. Programming Practice
8. Algorithm Practice

IMPORTANT:

Never claim that code was actually executed unless the execution
result is provided by the real Judge0 execution service.

Never invent execution results.

The Code Lab and Algorithm Code Runner use Judge0.

============================================================
LEGACY TURBO C
============================================================

When Legacy Turbo C is selected for C, the VISIBLE SOURCE CODE
must look like classic educational Turbo C source.

Preferred structure:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    /* program */

    getch();
}

For C Legacy Turbo C:
- Use void main()
- Use #include <conio.h>
- Use clrscr();
- Use getch();
- Use classic educational syntax
- Use #define where appropriate
- Do not silently produce modern int main()

============================================================
LEGACY TURBO C++
============================================================

When Legacy Turbo C is selected for C++, the visible source code
must look like classic Turbo C++ educational source.

Preferred structure:

#include <iostream.h>
#include <conio.h>

void main()
{
    clrscr();

    /* program */

    getch();
}

For C++ Legacy Turbo C:
- Use void main()
- Use #include <conio.h>
- Use #include <iostream.h> when appropriate
- Use clrscr();
- Use getch();
- Use classic educational syntax
- Use #define where appropriate

============================================================
MODERN C
============================================================

Modern C must use normal standard C.

Use:
#include <stdio.h>
int main(void)

Do not use:
conio.h
clrscr()
getch()
void main()

============================================================
MODERN C++
============================================================

Modern C++ must use normal standard C++.

Use:
#include <iostream>
int main()

Do not use:
conio.h
clrscr()
getch()
void main()
iostream.h

============================================================
OTHER LANGUAGES
============================================================

Python:
Use normal valid Python.

Java:
Use normal valid Java and public class Main.

JavaScript:
Use Node.js.
Use standard input when input is required.
Do not use external packages.

============================================================
GENERAL
============================================================

Generated code must be complete.

Use standard input for input-based programs.

Do not invent real execution output.

Be accurate, practical and educational.
`;

// ============================================================
// COMMENT RULES
// ============================================================

const COMMENT_RULE = `
COMMENT RULES FOR C/C++/JAVA/JAVASCRIPT:

Add useful beginner-friendly comments to important statements.

Comments should explain important:
- includes/imports
- declarations
- variables
- input
- assignments
- calculations
- conditions
- loops
- functions/classes
- output
- important return statements

Comments must be short.

Do not add meaningless comments.

Keep the program valid.
`;

const PYTHON_NO_COMMENT_RULE = `
PYTHON COMMENT RULE:

Generate Python code WITHOUT comments.

Do not add:
#
triple-quoted explanation blocks
long explanatory strings

Return clean executable Python only.
`;

// ============================================================
// AI HELPERS
// ============================================================

function requireAI() {
  if (!GEMINI_API_KEY) {
    const error = new Error(
      "Gemini AI is not configured. Add GEMINI_API_KEY to .env."
    );

    error.status = 503;

    throw error;
  }
}

async function askAI(instruction) {
  requireAI();

  const response = await fetch(GEMINI_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
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
        temperature: 0.1,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        `Gemini API request failed (${response.status}).`
    );

    error.status = response.status;

    throw error;
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";

  if (!text.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return text.trim();
}

// ============================================================
// TEXT / CODE CLEANING
// ============================================================

function cleanSourceCode(code) {
  return String(code || "")
    .replace(/^```[a-zA-Z0-9_+#.-]*\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractFirstCodeBlock(text) {
  if (!text) {
    return "";
  }

  const match = text.match(
    /```(?:[a-zA-Z0-9_+#.-]+)?\s*([\s\S]*?)```/i
  );

  if (match?.[1]) {
    return match[1].trim();
  }

  return cleanSourceCode(text);
}

function cleanAlgorithmResponse(text) {
  if (!text) {
    return "";
  }

  let result = String(text);

  result = result.replace(
    /^```[a-zA-Z0-9_+#.-]*\s*/gim,
    ""
  );

  result = result.replace(/```/g, "");

  result = result.replace(
    /^===\s*ALGORITHM\s*===\s*$/gim,
    ""
  );

  result = result.trim();

  return result;
}

// ============================================================
// FORCE LEGACY TURBO C
// ============================================================

function forceLegacyTurboC(code) {
  let result = cleanSourceCode(code);

  // Remove conio first so it can be re-added cleanly.
  result = result.replace(
    /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
    ""
  );

  // Ensure stdio.h where needed.
  const usesStdio =
    /\bprintf\s*\(/i.test(result) ||
    /\bscanf\s*\(/i.test(result) ||
    /\bfprintf\s*\(/i.test(result) ||
    /\bfscanf\s*\(/i.test(result);

  if (
    usesStdio &&
    !/#include\s*<stdio\.h>/i.test(result)
  ) {
    result = `#include <stdio.h>\n${result}`;
  }

  // Add conio.h.
  if (!/#include\s*<conio\.h>/i.test(result)) {
    const includeBlock = result.match(
      /^(?:\s*#include[^\n]*\r?\n)+/i
    );

    if (includeBlock) {
      result =
        includeBlock[0] +
        "#include <conio.h>\n" +
        result.slice(includeBlock[0].length);
    } else {
      result =
        "#include <conio.h>\n" +
        result;
    }
  }

  // Convert main.
  result = result.replace(
    /\bint\s+main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  result = result.replace(
    /\bint\s+main\s*\(\s*int\s+argc\s*,[\s\S]*?\)/i,
    "void main()"
  );

  result = result.replace(
    /(?<!\w)main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  // Ensure clrscr().
  if (!/\bclrscr\s*\(\s*\)\s*;/i.test(result)) {
    const mainPattern =
      /void\s+main\s*\(\s*\)\s*\{/i;

    if (mainPattern.test(result)) {
      result = result.replace(
        mainPattern,
        "void main()\n{\n    clrscr();"
      );
    }
  }

  // Remove return 0.
  result = result.replace(
    /^\s*return\s+0\s*;\s*$/gim,
    ""
  );

  // Ensure getch().
  if (!/\bgetch\s*\(\s*\)\s*;/i.test(result)) {
    const lastBrace = result.lastIndexOf("}");

    if (lastBrace !== -1) {
      result =
        result.slice(0, lastBrace) +
        "\n    getch();\n" +
        result.slice(lastBrace);
    }
  }

  return result
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ============================================================
// FORCE LEGACY TURBO C++
// ============================================================

function forceLegacyTurboCpp(code) {
  let result = cleanSourceCode(code);

  // Modern iostream -> old iostream.h.
  result = result.replace(
    /#include\s*<iostream>/gi,
    "#include <iostream.h>"
  );

  // Add iostream.h when cin/cout are used.
  const usesIO =
    /\bcin\s*>>/i.test(result) ||
    /\bcout\s*<</i.test(result) ||
    /\bstd::cin\b/i.test(result) ||
    /\bstd::cout\b/i.test(result);

  if (
    usesIO &&
    !/#include\s*<iostream\.h>/i.test(result)
  ) {
    result =
      "#include <iostream.h>\n" +
      result;
  }

  // Remove modern conio header first.
  result = result.replace(
    /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
    ""
  );

  // Add conio.
  if (!/#include\s*<conio\.h>/i.test(result)) {
    const includeBlock = result.match(
      /^(?:\s*#include[^\n]*\r?\n)+/i
    );

    if (includeBlock) {
      result =
        includeBlock[0] +
        "#include <conio.h>\n" +
        result.slice(includeBlock[0].length);
    } else {
      result =
        "#include <conio.h>\n" +
        result;
    }
  }

  // Convert main.
  result = result.replace(
    /\bint\s+main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  result = result.replace(
    /\bint\s+main\s*\(\s*\)/i,
    "void main()"
  );

  result = result.replace(
    /(?<!\w)main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  // Ensure clrscr.
  if (!/\bclrscr\s*\(\s*\)\s*;/i.test(result)) {
    const mainPattern =
      /void\s+main\s*\(\s*\)\s*\{/i;

    if (mainPattern.test(result)) {
      result = result.replace(
        mainPattern,
        "void main()\n{\n    clrscr();"
      );
    }
  }

  // Remove return 0.
  result = result.replace(
    /^\s*return\s+0\s*;\s*$/gim,
    ""
  );

  // Ensure getch.
  if (!/\bgetch\s*\(\s*\)\s*;/i.test(result)) {
    const lastBrace = result.lastIndexOf("}");

    if (lastBrace !== -1) {
      result =
        result.slice(0, lastBrace) +
        "\n    getch();\n" +
        result.slice(lastBrace);
    }
  }

  return result
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ============================================================
// APPLY CODE GENERATION STYLE
// ============================================================

function applyCodeGenerationStyle(
  language,
  code,
  codeStyle
) {
  const cleaned = cleanSourceCode(code);

  if (
    codeStyle !== "Legacy Turbo C"
  ) {
    return cleaned;
  }

  if (language === "C") {
    return forceLegacyTurboC(cleaned);
  }

  if (language === "C++") {
    return forceLegacyTurboCpp(cleaned);
  }

  return cleaned;
}

// ============================================================
// AUTO LANGUAGE DETECTION
// ============================================================

function detectCodeLanguage(code) {
  const source = String(code || "").trim();

  if (!source) {
    throw new Error(
      "Code is required."
    );
  }

  // ----------------------------------------------------------
  // C++
  // ----------------------------------------------------------

  const cppSignals = [
    /#include\s*<iostream(\.h)?>/i,
    /\busing\s+namespace\s+std\b/i,
    /\bstd::/i,
    /\bcout\s*<</i,
    /\bcin\s*>>/i,
    /\bvector\s*</i,
    /\bstring\s+\w+\s*;/i,
  ];

  const cppScore = cppSignals.filter(
    (regex) => regex.test(source)
  ).length;

  // ----------------------------------------------------------
  // C
  // ----------------------------------------------------------

  const cSignals = [
    /#include\s*<stdio\.h>/i,
    /\bprintf\s*\(/i,
    /\bscanf\s*\(/i,
    /\bmalloc\s*\(/i,
    /\bfree\s*\(/i,
  ];

  const cScore = cSignals.filter(
    (regex) => regex.test(source)
  ).length;

  // Legacy C++ must win over C when iostream.h exists.
  if (
    /#include\s*<iostream\.h>/i.test(source) ||
    /\busing\s+namespace\s+std\b/i.test(source) ||
    /\bcout\s*<</i.test(source) ||
    /\bcin\s*>>/i.test(source)
  ) {
    return "C++";
  }

  // C legacy or normal.
  if (
    /#include\s*<stdio\.h>/i.test(source) ||
    /\bprintf\s*\(/i.test(source) ||
    /\bscanf\s*\(/i.test(source)
  ) {
    return "C";
  }

  // ----------------------------------------------------------
  // Java
  // ----------------------------------------------------------

  const javaSignals = [
    /\bpublic\s+class\s+[A-Za-z_]\w*/i,
    /\bclass\s+Main\b/i,
    /\bpublic\s+static\s+void\s+main\s*\(/i,
    /\bSystem\.out\.(println|print)\s*\(/i,
    /\bimport\s+java\./i,
    /\bScanner\s+\w+/i,
  ];

  const javaScore = javaSignals.filter(
    (regex) => regex.test(source)
  ).length;

  if (javaScore >= 2) {
    return "Java";
  }

  // ----------------------------------------------------------
  // JavaScript
  // ----------------------------------------------------------

  const jsSignals = [
    /\bconsole\.(log|error|warn)\s*\(/i,
    /\bprocess\.stdin\b/i,
    /\brequire\s*\(\s*["']node:/i,
    /\brequire\s*\(\s*["'][^"']+["']\s*\)/i,
    /\b(?:const|let|var)\s+[A-Za-z_$]\w*\s*=/i,
    /=>/i,
    /\bfunction\s+[A-Za-z_$]\w*\s*\(/i,
  ];

  const jsScore = jsSignals.filter(
    (regex) => regex.test(source)
  ).length;

  // ----------------------------------------------------------
  // Python
  // ----------------------------------------------------------

  const pythonSignals = [
    /\bdef\s+[A-Za-z_]\w*\s*\(/i,
    /\bimport\s+[A-Za-z_]\w*/i,
    /\bfrom\s+[A-Za-z_]\w*\s+import\b/i,
    /\bprint\s*\(/i,
    /\binput\s*\(/i,
    /^\s*for\s+.+\s+in\s+.+:/m,
    /^\s*if\s+.+:/m,
    /^\s*elif\s+.+:/m,
    /^\s*else\s*:/m,
  ];

  const pythonScore = pythonSignals.filter(
    (regex) => regex.test(source)
  ).length;

  // Strong JavaScript cases.
  if (
    /\bconsole\.(log|error|warn)\s*\(/i.test(source) ||
    /\bprocess\.stdin\b/i.test(source)
  ) {
    return "JavaScript";
  }

  // Strong Python cases.
  if (
    /\bdef\s+[A-Za-z_]\w*\s*\(/i.test(source) ||
    /^\s*for\s+.+\s+in\s+.+:/m.test(source) ||
    /^\s*if\s+.+:/m.test(source)
  ) {
    return "Python";
  }

  const scores = [
    {
      language: "C++",
      score: cppScore,
    },
    {
      language: "C",
      score: cScore,
    },
    {
      language: "Java",
      score: javaScore,
    },
    {
      language: "JavaScript",
      score: jsScore,
    },
    {
      language: "Python",
      score: pythonScore,
    },
  ];

  scores.sort(
    (a, b) => b.score - a.score
  );

  if (
    scores[0].score > 0
  ) {
    return scores[0].language;
  }

  throw new Error(
    "Unable to automatically detect the programming language. Please enter valid C, C++, Python, Java or JavaScript code."
  );
}

// ============================================================
// AUTO CODE STYLE DETECTION
// ============================================================

function detectCodeStyle(
  language,
  code
) {
  const source = String(code || "");

  if (
    language === "C" ||
    language === "C++"
  ) {
    const legacyMarkers = [
      /#include\s*<conio\.h>/i,
      /\bclrscr\s*\(\s*\)/i,
      /\bgetch\s*\(\s*\)/i,
      /\bvoid\s+main\s*\(/i,
      /#include\s*<iostream\.h>/i,
    ];

    const isLegacy =
      legacyMarkers.some(
        (regex) => regex.test(source)
      );

    return isLegacy
      ? "Legacy Turbo C"
      : "Modern Standard";
  }

  return "Modern Standard";
}

// ============================================================
// LEGACY CODE -> JUDGE0 COMPATIBLE CODE
// ============================================================

function prepareLegacyTurboCode(
  language,
  code,
  codeStyle
) {
  if (
    codeStyle !==
      "Legacy Turbo C" ||
    (language !== "C" &&
      language !== "C++")
  ) {
    return code;
  }

  let runnable = String(code || "");

  // Remove conio.
  runnable = runnable.replace(
    /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
    ""
  );

  // C++ iostream.h -> iostream.
  if (language === "C++") {
    runnable = runnable.replace(
      /#include\s*<iostream\.h>/gi,
      "#include <iostream>"
    );
  }

  // Remove clrscr.
  runnable = runnable.replace(
    /\bclrscr\s*\(\s*\)\s*;?/gi,
    ""
  );

  // Remove getch.
  runnable = runnable.replace(
    /\bgetch\s*\(\s*\)\s*;?/gi,
    ""
  );

  // void main() -> int main()
  runnable = runnable.replace(
    /\bvoid\s+main\s*\(\s*\)/i,
    "int main()"
  );

  // Remove accidental duplicate return values.
  runnable = runnable.replace(
    /^\s*return\s+0\s*;\s*$/gim,
    ""
  );

  // Ensure return 0 at end of main.
  const lastBrace =
    runnable.lastIndexOf("}");

  if (
    lastBrace !== -1 &&
    language === "C"
  ) {
    runnable =
      runnable.slice(0, lastBrace) +
      "\n    return 0;\n" +
      runnable.slice(lastBrace);
  }

  if (
    lastBrace !== -1 &&
    language === "C++"
  ) {
    runnable =
      runnable.slice(0, lastBrace) +
      "\n    return 0;\n" +
      runnable.slice(lastBrace);
  }

  return runnable
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ============================================================
// HEALTH
// ============================================================

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,
      aiProvider: "Gemini",
      aiConfigured:
        Boolean(GEMINI_API_KEY),
      model: GEMINI_MODEL,
      judge0Configured:
        Boolean(process.env.JUDGE0_URL),

      features: {
        legacyTurboC: true,
        algorithmSystem: true,
        algorithmGenerator: true,
        algorithmCodeRunner: true,
        automaticCodeDetection: true,
      },
    });
  }
);

// ============================================================
// AI TEACHER
// ============================================================

app.post(
  "/api/ai/teach",
  async (req, res) => {
    try {
      const {
        language,
        level,
        question,
      } = req.body;

      if (
        !question ||
        typeof question !== "string" ||
        !question.trim()
      ) {
        return res.status(400).json({
          error:
            "Enter a programming question.",
        });
      }

      if (question.length > 6000) {
        return res.status(400).json({
          error:
            "Question is too long. Maximum 6000 characters.",
        });
      }

      const instruction = `
Programming language:
${language || "General programming"}

Learner level:
${level || "Beginner"}

Student question:
${question.trim()}

Teach the student clearly.

Use very easy language.

If the student asks for code:
- provide complete valid code
- use the requested language
- add useful comments except for Python
- explain the code after it
- show example input where useful
- show EXPECTED OUTPUT, not fake actual output

Never claim that you executed the code.
`;

      const answer = await askAI(
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
          "Gemini AI request failed.",
      });
    }
  }
);

// ============================================================
// AI ALGORITHM TEACHER
// ============================================================

app.post(
  "/api/ai/algorithm",
  async (req, res) => {
    try {
      const {
        level,
        question,
      } = req.body;

      if (
        !question ||
        typeof question !== "string" ||
        !question.trim()
      ) {
        return res.status(400).json({
          error:
            "Enter an algorithm topic or question.",
        });
      }

      if (question.length > 6000) {
        return res.status(400).json({
          error:
            "Algorithm question is too long.",
        });
      }

      const instruction = `
This is an ALGORITHM LEARNING question.

Learner level:
${level || "Beginner"}

Student question:
${question.trim()}

Teach the algorithm or data-structure topic
in very easy beginner-friendly language.

Explain:
1. Meaning
2. Purpose
3. Main idea
4. Variables when useful
5. Simple steps
6. Small example when useful
7. Time complexity when appropriate
8. Exam points when useful

Do not make the explanation unnecessarily complicated.

Do not claim that you executed anything.
`;

      const answer = await askAI(
        instruction
      );

      res.json({
        answer,
      });
    } catch (error) {
      console.error(
        "Algorithm Teacher Error:",
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          "Algorithm teaching failed.",
      });
    }
  }
);

// ============================================================
// AI CODE ANALYSIS
// ============================================================

app.post(
  "/api/ai/code",
  async (req, res) => {
    try {
      const {
        action,
        language,
        code,
      } = req.body;

      if (
        !code ||
        typeof code !== "string"
      ) {
        return res.status(400).json({
          error:
            "Code is required.",
        });
      }

      if (code.length > 20000) {
        return res.status(400).json({
          error:
            "Code is too large.",
        });
      }

      const instruction = `
Programming language:
${language || "Unknown"}

Task:
${action || "Explain this code"}

Analyze only this code.

Do not claim that you executed it.

CODE:

${code}

Explain it in easy beginner-friendly language.

If there is an error:
1. Identify it.
2. Explain why it happens.
3. Show corrected code when useful.
`;

      const answer = await askAI(
        instruction
      );

      res.json({
        answer,
      });
    } catch (error) {
      console.error(
        "AI Code Error:",
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          "Code analysis failed.",
      });
    }
  }
);

// ============================================================
// CODE GENERATOR
// ============================================================

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

      if (!LANGUAGES[language]) {
        return res.status(400).json({
          error:
            "Choose a supported programming language.",
        });
      }

      if (!LEVELS.includes(level)) {
        return res.status(400).json({
          error:
            "Choose a valid learning level.",
        });
      }

      const effectiveStyle =
        language === "C" ||
        language === "C++"
          ? codeStyle
          : "Modern Standard";

      if (
        !CODE_STYLES.includes(
          effectiveStyle
        )
      ) {
        return res.status(400).json({
          error:
            "Choose a valid code style.",
        });
      }

      if (
        !topic ||
        typeof topic !== "string" ||
        !topic.trim()
      ) {
        return res.status(400).json({
          error:
            "Enter a programming problem or topic.",
        });
      }

      if (topic.length > 6000) {
        return res.status(400).json({
          error:
            "Programming request is too long.",
        });
      }

      let styleInstructions = "";

      // --------------------------------------------------------
      // C
      // --------------------------------------------------------

      if (language === "C") {
        if (
          effectiveStyle ===
          "Legacy Turbo C"
        ) {
          styleInstructions = `
LEGACY TURBO C SOURCE REQUIREMENTS:

Generate visible classic Turbo C educational code.

Use:
#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    ...
    
    getch();
}

Important:
- Use void main()
- Use conio.h
- Use clrscr()
- Use getch()
- Use #define where appropriate
- Use a clear program-title comment
- Use useful comments before important sections
- Make the structure resemble a college handwritten programming practical

Do NOT use int main(void).
Do NOT silently generate modern standard C.
`;
        } else {
          styleInstructions = `
MODERN STANDARD C REQUIREMENTS:

Use standard modern C.

Use:
#include <stdio.h>
int main(void)

Do not use:
conio.h
clrscr()
getch()
void main()
`;
        }
      }

      // --------------------------------------------------------
      // C++
      // --------------------------------------------------------

      if (language === "C++") {
        if (
          effectiveStyle ===
          "Legacy Turbo C"
        ) {
          styleInstructions = `
LEGACY TURBO C++ SOURCE REQUIREMENTS:

Generate visible classic Turbo C++ educational code.

Use classic style such as:

#include <iostream.h>
#include <conio.h>

void main()
{
    clrscr();

    ...

    getch();
}

Important:
- Use void main()
- Use conio.h
- Use clrscr()
- Use getch()
- Use iostream.h where appropriate
- Use #define where appropriate
- Add a clear program-title comment
- Add useful comments before important sections
- Make it resemble a traditional college practical notebook program

Do NOT use modern int main().
Do NOT silently return modern C++.
`;
        } else {
          styleInstructions = `
MODERN STANDARD C++ REQUIREMENTS:

Use standard modern C++.

Use:
#include <iostream>
int main()

Do not use:
conio.h
clrscr()
getch()
void main()
iostream.h
`;
        }
      }

      // --------------------------------------------------------
      // Python
      // --------------------------------------------------------

      if (language === "Python") {
        styleInstructions = `
PYTHON REQUIREMENTS:

Use normal valid Python.

IMPORTANT:
Generate NO comments.

Return only clean runnable Python source.

Do not add explanatory text.
`;
      }

      // --------------------------------------------------------
      // Java
      // --------------------------------------------------------

      if (language === "Java") {
        styleInstructions = `
JAVA REQUIREMENTS:

Use normal valid Java.

Use:
public class Main

Use standard Java input such as Scanner when required.

Add useful comments.

Do not use Turbo C syntax.
`;
      }

      // --------------------------------------------------------
      // JavaScript
      // --------------------------------------------------------

      if (
        language === "JavaScript"
      ) {
        styleInstructions = `
JAVASCRIPT REQUIREMENTS:

Use Node.js.

Use standard input when required.

Do not use:
prompt()
prompt-sync
external npm packages

Use Node.js built-ins only.

Add useful comments.
`;
      }

      const commentInstructions =
        language === "Python"
          ? PYTHON_NO_COMMENT_RULE
          : COMMENT_RULE;

      const instruction = `
Generate ONE complete working program.

==================================================
LANGUAGE
==================================================

${language}

==================================================
LEVEL
==================================================

${level}

==================================================
CODE STYLE
==================================================

${effectiveStyle}

==================================================
PROGRAMMING PROBLEM
==================================================

${topic.trim()}

==================================================
STYLE REQUIREMENTS
==================================================

${styleInstructions}

==================================================
COMMENT REQUIREMENTS
==================================================

${commentInstructions}

==================================================
IMPORTANT RULES
==================================================

1. Generate ONLY ${language}.
2. Solve exactly the requested problem.
3. Generate a complete program.
4. Use standard input where input is required.
5. Make it appropriate for ${level}.
6. Keep the syntax valid.
7. Do not generate pseudocode.
8. Do not generate explanations outside the code.
9. Do not generate example input/output.
10. Do not generate headings outside the program.
11. Do not add Markdown fences.
12. Python must contain no comments.
13. C/C++/Java/JavaScript should contain useful comments.
14. C/C++ Legacy Turbo C must visibly use the requested old style.
15. Do not claim that the program was executed.

Return ONLY the COMPLETE SOURCE CODE.
`;

      const answer = await askAI(
        instruction
      );

      let code =
        extractFirstCodeBlock(answer);

      if (!code) {
        throw new Error(
          "Gemini did not return program code."
        );
      }

      code =
        applyCodeGenerationStyle(
          language,
          code,
          effectiveStyle
        );

      res.json({
        code,
        language,
        level,
        codeStyle: effectiveStyle,
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

// ============================================================
// ALGORITHM GENERATOR
// ============================================================

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
        typeof topic !== "string" ||
        !topic.trim()
      ) {
        return res.status(400).json({
          error:
            "Enter an algorithm problem or instruction.",
        });
      }

      if (!ALGORITHM_LEVELS.includes(level)) {
        return res.status(400).json({
          error:
            "Choose a valid algorithm learning level.",
        });
      }

      if (topic.length > 6000) {
        return res.status(400).json({
          error:
            "Algorithm request is too long.",
        });
      }

      const instruction = `
You are generating an exam-ready COLLEGE ALGORITHM.

Learner level:
${level}

Student request:
${topic.trim()}

IMPORTANT:

Generate ONLY the algorithm.

Do NOT generate:
- programming-language code
- C code
- C++ code
- Python code
- Java code
- JavaScript code
- long explanations
- example input
- example output
- time complexity
- space complexity
- important points
unless explicitly requested by the student's input.

The output must be compact and suitable for writing in a college notebook/exam.

Use this structure:

Algorithm: <topic>

Algorithm:

<ALGORITHM-NAME>(...)

- One short sentence describing what it does.

Variables:

(i) NAME : Meaning
(ii) NAME : Meaning
(iii) NAME : Meaning

Steps:

Step-1: [Short action]

PSEUDOCODE / ALGORITHM STATEMENTS

Step-2: [Short action]

RETURN

Use simple algorithm notation such as:

IF
THEN
END IF
FOR
DO
END FOR
WHILE
END WHILE
RETURN
FINISH
ARR[i] <- VALUE

Use numbered steps.

Keep it concise.

Do not use Markdown code fences.

Do not wrap the answer in long prose.
`;

      const answer = await askAI(
        instruction
      );

      const algorithm =
        cleanAlgorithmResponse(
          answer
        );

      if (!algorithm) {
        throw new Error(
          "Gemini returned an empty algorithm."
        );
      }

      res.json({
        algorithm,
        level,
      });
    } catch (error) {
      console.error(
        "Algorithm Generation Error:",
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

// ============================================================
// ALGORITHM PRACTICE
// ============================================================

app.post(
  "/api/ai/algorithm-practice",
  async (req, res) => {
    try {
      const {
        level,
        topic,
        studentAnswer,
      } = req.body;

      if (
        !topic ||
        typeof topic !== "string"
      ) {
        return res.status(400).json({
          error:
            "Algorithm topic is required.",
        });
      }

      const instruction = `
This is algorithm practice evaluation.

Learning level:
${level || "Beginner"}

Algorithm topic:
${topic}

Student answer:
${studentAnswer || "(No answer provided)"}

Evaluate the student's answer.

Use easy language.

Return:
1. Correct / Needs Improvement
2. What is correct
3. What is wrong or missing
4. Correct algorithm structure when useful
5. One short suggestion

Do not claim actual program execution.
`;

      const answer = await askAI(
        instruction
      );

      res.json({
        answer,
      });
    } catch (error) {
      console.error(
        "Algorithm Practice Error:",
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          "Algorithm practice failed.",
      });
    }
  }
);

// ============================================================
// JUDGE0
// ============================================================

function judgeHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  if (process.env.JUDGE0_API_KEY) {
    headers["X-Auth-Token"] =
      process.env.JUDGE0_API_KEY;
  }

  if (process.env.JUDGE0_AUTH_USER) {
    headers["X-Auth-User"] =
      process.env.JUDGE0_AUTH_USER;
  }

  return headers;
}

async function judgeFetch(
  path,
  options = {}
) {
  const base = (
    process.env.JUDGE0_URL || ""
  ).replace(/\/$/, "");

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

async function runJudge0(
  language,
  code,
  stdin,
  codeStyle
) {
  const lang =
    LANGUAGES[language];

  if (!lang) {
    throw new Error(
      "Unsupported programming language."
    );
  }

  if (code.length > 20000) {
    throw new Error(
      "Code is too large."
    );
  }

  if (
    (stdin || "").length >
    10000
  ) {
    throw new Error(
      "Input is too large."
    );
  }

  const sourceCode =
    prepareLegacyTurboCode(
      language,
      code,
      codeStyle
    );

  const submit =
    await judgeFetch(
      "/submissions/?base64_encoded=false&wait=false",
      {
        method: "POST",

        body: JSON.stringify({
          language_id: lang.id,
          source_code: sourceCode,
          stdin: stdin || "",

          cpu_time_limit: 3,
          wall_time_limit: 5,
          memory_limit: 128000,

          max_processes_and_or_threads: 30,
          max_file_size: 1024,
        }),
      }
    );

  if (!submit.ok) {
    const body =
      await submit.text();

    throw new Error(
      `Judge0 submission failed (${submit.status}): ${body.slice(
        0,
        500
      )}`
    );
  }

  const submitData =
    await submit.json();

  const token =
    submitData?.token;

  if (!token) {
    throw new Error(
      "Judge0 did not return a submission token."
    );
  }

  for (
    let attempt = 0;
    attempt < 30;
    attempt++
  ) {
    await new Promise(
      (resolve) =>
        setTimeout(resolve, 500)
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

    if (!result.ok) {
      throw new Error(
        `Judge0 result failed (${result.status}).`
      );
    }

    const data =
      await result.json();

    if (
      data.status?.id > 2
    ) {
      return data;
    }
  }

  throw new Error(
    "Execution timed out while waiting for Judge0."
  );
}

// ============================================================
// FORMAT EXECUTION RESPONSE
// ============================================================

function buildExecutionResponse(
  result,
  language,
  codeStyle
) {
  return {
    language,
    codeStyle,

    status:
      result.status?.description ||
      "Unknown",

    stdout:
      result.stdout || "",

    stderr:
      result.stderr || "",

    compileOutput:
      result.compile_output || "",

    message:
      result.message || "",

    time:
      result.time || null,

    memory:
      result.memory || null,

    token:
      result.token || null,
  };
}

// ============================================================
// CODE LAB
// AUTOMATIC LANGUAGE + STYLE DETECTION
// ============================================================

app.post(
  "/api/code/run",
  async (req, res) => {
    try {
      const {
        code,
        stdin,
      } = req.body;

      if (
        !code ||
        typeof code !== "string" ||
        !code.trim()
      ) {
        return res.status(400).json({
          error:
            "Code is required.",
        });
      }

      const detectedLanguage =
        detectCodeLanguage(code);

      const detectedStyle =
        detectCodeStyle(
          detectedLanguage,
          code
        );

      const result =
        await runJudge0(
          detectedLanguage,
          code,
          typeof stdin === "string"
            ? stdin
            : "",
          detectedStyle
        );

      res.json(
        buildExecutionResponse(
          result,
          detectedLanguage,
          detectedStyle
        )
      );
    } catch (error) {
      console.error(
        "Code Lab Execution Error:",
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          "Code execution failed.",
      });
    }
  }
);

// ============================================================
// ALGORITHM CODE RUNNER
// COMPLETELY SEPARATE EXECUTION ROUTE
// ============================================================

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
        typeof code !== "string" ||
        !code.trim()
      ) {
        return res.status(400).json({
          error:
            "Algorithm code is required.",
        });
      }

      const detectedLanguage =
        detectCodeLanguage(code);

      const detectedStyle =
        detectCodeStyle(
          detectedLanguage,
          code
        );

      const result =
        await runJudge0(
          detectedLanguage,
          code,
          typeof stdin === "string"
            ? stdin
            : "",
          detectedStyle
        );

      res.json(
        buildExecutionResponse(
          result,
          detectedLanguage,
          detectedStyle
        )
      );
    } catch (error) {
      console.error(
        "Algorithm Runner Error:",
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          "Algorithm code execution failed.",
      });
    }
  }
);

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  () => {
    console.log(
      `Backend: http://localhost:${PORT}`
    );

    console.log(
      `Gemini Configured: ${Boolean(
        GEMINI_API_KEY
      )}`
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
      "Code Lab Auto-Detection: ENABLED"
    );
  }
);