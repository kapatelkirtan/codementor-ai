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
  "https://generativelanguage.googleapis.com/v1beta/models/" +
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
6. Programming Practice
7. Algorithm Practice

IMPORTANT:

Never claim that code was actually executed unless the execution
result is provided by the real Judge0 execution service.

Never invent execution results.

The Code Lab uses Judge0.

============================================================
CODE GENERATOR
============================================================

When the user asks the Code Generator to solve a programming
problem, always generate ACTUAL PROGRAM SOURCE CODE.

This includes algorithmic and data-structure requests such as:

- Linear Search
- Binary Search
- Bubble Sort
- Selection Sort
- Insertion Sort
- Array Insertion
- Array Deletion
- Array Update
- Stack
- Queue
- Linked List
- Recursion
- Trees
- Graphs
- Maximum/minimum array value
- Searching
- Sorting
- String operations
- Mathematical algorithms

Do NOT return pseudocode when the Code Generator is requested.

Do NOT return an English algorithm instead of program code.

Always implement the requested problem as a complete program
in the selected programming language.

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
- Use a clear program-title comment
- Use useful comments before important sections
- NEVER generate void void main()
- NEVER generate int void main()
- NEVER generate void int main()
- Do NOT generate int main() when Legacy Turbo C is selected

============================================================
LEGACY TURBO C++
============================================================

When Legacy Turbo C++ is selected for C++, the VISIBLE SOURCE
CODE must look like classic Turbo C++ educational source.

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
- Use a clear program-title comment
- Use useful comments before important sections
- NEVER generate void void main()
- NEVER generate int void main()
- NEVER generate void int main()

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
PYTHON
============================================================

Use normal valid Python.

Do not add comments.

Do not add Markdown code fences.

Return complete executable Python source.

============================================================
JAVA
============================================================

Use normal valid Java.

Use:

public class Main

Use Scanner when input is required.

Use standard Java syntax.

============================================================
JAVASCRIPT
============================================================

Use Node.js.

Use standard input when required.

Use only Node.js built-ins.

Do not use external packages.

============================================================
GENERAL
============================================================

Generated code must be complete.

Use standard input for input-based programs.

Never invent execution output.

Never claim that generated code was executed.

When solving algorithmic problems, implement the algorithm as
real source code in the selected language.
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

  const source = String(text).trim();

  const match = source.match(
    /```(?:[a-zA-Z0-9_+#.-]+)?\s*([\s\S]*?)```/i
  );

  if (match?.[1]) {
    return match[1].trim();
  }

  return cleanSourceCode(source);
}

// ============================================================
// ALGORITHM RESPONSE CLEANING
// ============================================================

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

  result = result
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(
        /^(\s*Step-\d+\s*:\s*)(.*)$/i
      );

      if (!match) {
        return line;
      }

      const prefix = match[1];
      let explanation = match[2].trim();

      if (!explanation) {
        return line;
      }

      if (
        explanation.startsWith("[") &&
        explanation.endsWith("]")
      ) {
        return `${prefix}${explanation}`;
      }

      explanation = explanation.replace(
        /^\[(.*)\]$/,
        "$1"
      );

      return `${prefix}[${explanation}]`;
    })
    .join("\n")
    .trim();

  return result;
}

// ============================================================
// COMMON MAIN NORMALIZATION
// ============================================================

function normalizeMalformedMain(code) {
  let result = String(code || "");

  result = result.replace(
    /\bvoid\s+void\s+main\s*\(/gi,
    "void main("
  );

  result = result.replace(
    /\bint\s+void\s+main\s*\(/gi,
    "void main("
  );

  result = result.replace(
    /\bvoid\s+int\s+main\s*\(/gi,
    "void main("
  );

  return result;
}

// ============================================================
// FORCE LEGACY TURBO C
// ============================================================

function forceLegacyTurboC(code) {
  let result = cleanSourceCode(code);

  // Fix malformed main declarations produced by the AI.
  result = result.replace(/\bvoid\s+void\s+main\s*\(/gi, "void main(");
  result = result.replace(/\bint\s+void\s+main\s*\(/gi, "void main(");
  result = result.replace(/\bvoid\s+int\s+main\s*\(/gi, "void main(");

  result = result.replace(
    /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
    ""
  );

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

  result = result.replace(
    /^\s*return\s+0\s*;\s*$/gim,
    ""
  );

  if (!/\bgetch\s*\(\s*\)\s*;/i.test(result)) {
    const lastBrace = result.lastIndexOf("}");

    if (lastBrace !== -1) {
      result =
        result.slice(0, lastBrace) +
        "\n    getch();\n" +
        result.slice(lastBrace);
    }
  }

  // Final safety cleanup.
  result = result
    .replace(/\bvoid\s+void\s+main\s*\(/gi, "void main(")
    .replace(/\bint\s+void\s+main\s*\(/gi, "void main(")
    .replace(/\bvoid\s+int\s+main\s*\(/gi, "void main(")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return result;
}
function forceLegacyTurboCpp(code) {
  let result = normalizeMalformedMain(
    cleanSourceCode(code)
  );

  // Remove modern iostream.
  result = result.replace(
    /#include\s*<iostream>/gi,
    "#include <iostream.h>"
  );

  // Ensure iostream.h when needed.
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

  // Remove conio and re-add it cleanly.
  result = result.replace(
    /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
    ""
  );

  if (
    !/#include\s*<conio\.h>/i.test(result)
  ) {
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

  // Normalize malformed main declarations.
  result = normalizeMalformedMain(result);

  // Convert main to Turbo C++ style.
  result = result.replace(
    /\bint\s+main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  result = result.replace(
    /(?<!\w)main\s*\(\s*\)/i,
    "void main()"
  );

  // Remove return 0.
  result = result.replace(
    /^\s*return\s+0\s*;\s*$/gim,
    ""
  );

  // Ensure clrscr().
  if (
    !/\bclrscr\s*\(\s*\)\s*;/i.test(result)
  ) {
    const mainPattern =
      /void\s+main\s*\(\s*\)\s*\{/i;

    if (mainPattern.test(result)) {
      result = result.replace(
        mainPattern,
        "void main()\n{\n    clrscr();"
      );
    }
  }

  // Ensure getch().
  if (
    !/\bgetch\s*\(\s*\)\s*;/i.test(result)
  ) {
    const lastBrace = result.lastIndexOf("}");

    if (lastBrace !== -1) {
      result =
        result.slice(0, lastBrace) +
        "\n    getch();\n" +
        result.slice(lastBrace);
    }
  }

  result = normalizeMalformedMain(result);

  return result
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ============================================================
// FINAL GENERATED PROGRAM CLEANUP
// ============================================================

function cleanGeneratedProgram(
  language,
  code,
  codeStyle
) {
  let result = normalizeMalformedMain(
    cleanSourceCode(code)
  );

  // Remove accidental labels.
  result = result.replace(
    /^\s*(?:CODE|PROGRAM|SOURCE CODE)\s*:\s*$/gim,
    ""
  );

  // Legacy C/C++.
  if (
    codeStyle === "Legacy Turbo C" &&
    language === "C"
  ) {
    result = forceLegacyTurboC(result);
  }

  if (
    codeStyle === "Legacy Turbo C" &&
    language === "C++"
  ) {
    result = forceLegacyTurboCpp(result);
  }

  // Modern C must not use Turbo C syntax.
  if (
    language === "C" &&
    codeStyle === "Modern Standard"
  ) {
    result = result
      .replace(
        /\bvoid\s+void\s+main\s*\(/gi,
        "int main("
      )
      .replace(
        /\bvoid\s+main\s*\(\s*\)/gi,
        "int main(void)"
      )
      .replace(
        /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
        ""
      )
      .replace(
        /\bclrscr\s*\(\s*\)\s*;?/gi,
        ""
      )
      .replace(
        /\bgetch\s*\(\s*\)\s*;?/gi,
        ""
      );
  }

  // Modern C++ must not use Turbo C syntax.
  if (
    language === "C++" &&
    codeStyle === "Modern Standard"
  ) {
    result = result
      .replace(
        /\bvoid\s+void\s+main\s*\(/gi,
        "int main("
      )
      .replace(
        /\bvoid\s+main\s*\(\s*\)/gi,
        "int main()"
      )
      .replace(
        /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
        ""
      )
      .replace(
        /#include\s*<iostream\.h>/gi,
        "#include <iostream>"
      )
      .replace(
        /\bclrscr\s*\(\s*\)\s*;?/gi,
        ""
      )
      .replace(
        /\bgetch\s*\(\s*\)\s*;?/gi,
        ""
      );
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

  if (codeStyle !== "Legacy Turbo C") {
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
    throw new Error("Code is required.");
  }

  if (
    /#include\s*<iostream(?:\.h)?>/i.test(source) ||
    /\busing\s+namespace\s+std\b/i.test(source) ||
    /\bstd::/i.test(source) ||
    /\bcout\s*<</i.test(source) ||
    /\bcin\s*>>/i.test(source)
  ) {
    return "C++";
  }

  if (
    /#include\s*<stdio\.h>/i.test(source) ||
    /\bprintf\s*\(/i.test(source) ||
    /\bscanf\s*\(/i.test(source) ||
    /\bmalloc\s*\(/i.test(source) ||
    /\bfree\s*\(/i.test(source) ||
    /\bvoid\s+main\s*\(/i.test(source)
  ) {
    return "C";
  }

  if (
    /\bpublic\s+class\s+\w+/i.test(source) ||
    /\bpublic\s+static\s+void\s+main\s*\(/i.test(source) ||
    /\bSystem\.out\.(println|print)\s*\(/i.test(source) ||
    /\bScanner\s+\w+/i.test(source)
  ) {
    return "Java";
  }

  if (
    /\bconsole\.(log|error|warn)\s*\(/i.test(source) ||
    /\bprocess\.stdin\b/i.test(source) ||
    /\brequire\s*\(\s*["']node:/i.test(source) ||
    /=>/i.test(source)
  ) {
    return "JavaScript";
  }

  if (
    /\bdef\s+[A-Za-z_]\w*\s*\(/i.test(source) ||
    /^\s*for\s+.+\s+in\s+.+:/m.test(source) ||
    /^\s*if\s+.+:/m.test(source) ||
    /\binput\s*\(/i.test(source)
  ) {
    return "Python";
  }

  throw new Error(
    "Unable to automatically detect the programming language. Please enter valid C, C++, Python, Java or JavaScript code."
  );
}

// ============================================================
// AUTO CODE STYLE DETECTION
// ============================================================

function detectCodeStyle(language, code) {
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

    return legacyMarkers.some(
      (regex) => regex.test(source)
    )
      ? "Legacy Turbo C"
      : "Modern Standard";
  }

  return "Modern Standard";
}

// ============================================================
// LEGACY CODE -> JUDGE0 CODE
// ============================================================

function prepareLegacyTurboCode(
  language,
  code,
  codeStyle
) {
  if (
    codeStyle !== "Legacy Turbo C" ||
    (language !== "C" &&
      language !== "C++")
  ) {
    return code;
  }

  let runnable =
    normalizeMalformedMain(
      String(code || "")
    );

  runnable = runnable.replace(
    /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
    ""
  );

  if (language === "C++") {
    runnable = runnable.replace(
      /#include\s*<iostream\.h>/gi,
      "#include <iostream>"
    );
  }

  runnable = runnable.replace(
    /\bclrscr\s*\(\s*\)\s*;?/gi,
    ""
  );

  runnable = runnable.replace(
    /\bgetch\s*\(\s*\)\s*;?/gi,
    ""
  );

  runnable = runnable.replace(
    /\bvoid\s+main\s*\(\s*\)/gi,
    "int main()"
  );

  runnable = runnable.replace(
    /\bvoid\s+void\s+main\s*\(/gi,
    "int main("
  );

  runnable = runnable.replace(
    /^\s*return\s+0\s*;\s*$/gim,
    ""
  );

  const lastBrace =
    runnable.lastIndexOf("}");

  if (lastBrace !== -1) {
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

      const answer =
        await askAI(instruction);

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

      const answer =
        await askAI(instruction);

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
          error: "Code is required.",
        });
      }

      if (code.length > 20000) {
        return res.status(400).json({
          error: "Code is too large.",
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

      const answer =
        await askAI(instruction);

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

      if (language === "C") {
        if (
          effectiveStyle ===
          "Legacy Turbo C"
        ) {
          styleInstructions = `
LEGACY TURBO C:

Generate classic Turbo C educational source.

Required:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    /* program */

    getch();
}

Use void main() exactly once.

NEVER write:

void void main()
int void main()
void int main()

Use #define where appropriate.

Use a clear title comment.

Use useful comments before important sections.

The result must be actual C program source code,
not pseudocode and not an English algorithm.
`;
        } else {
          styleInstructions = `
MODERN STANDARD C:

Use standard C.

Required:

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

      if (language === "C++") {
        if (
          effectiveStyle ===
          "Legacy Turbo C"
        ) {
          styleInstructions = `
LEGACY TURBO C++:

Generate classic Turbo C++ educational source.

Required style:

#include <iostream.h>
#include <conio.h>

void main()
{
    clrscr();

    /* program */

    getch();
}

Use void main() exactly once.

NEVER write:

void void main()
int void main()
void int main()

Use iostream.h where appropriate.

Use #define where appropriate.

Use a clear title comment.

Use useful comments before important sections.

The result must be actual C++ program source code,
not pseudocode and not an English algorithm.
`;
        } else {
          styleInstructions = `
MODERN STANDARD C++:

Use standard C++.

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

      if (language === "Python") {
        styleInstructions = `
PYTHON:

Generate valid Python.

Do not add comments.

Return only clean Python source.

The result must be actual program source code.
`;
      }

      if (language === "Java") {
        styleInstructions = `
JAVA:

Generate valid Java.

Use:

public class Main

Use Scanner when input is needed.

Add useful comments.

Return complete source code.
`;
      }

      if (language === "JavaScript") {
        styleInstructions = `
JAVASCRIPT:

Generate valid Node.js JavaScript.

Use Node.js built-ins when input is required.

Do not use external packages.

Add useful comments.

Return complete source code.
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
CRITICAL PROGRAMMING REQUIREMENTS
==================================================

1. Generate ONLY ${language}.
2. Solve exactly the requested problem.
3. Generate complete program source code.
4. Use standard input where input is required.
5. Make it appropriate for ${level}.
6. Keep the syntax valid.
7. Algorithm and data-structure topics MUST become real programs.
8. Do NOT generate pseudocode.
9. Do NOT generate an English algorithm.
10. Do NOT generate example input/output.
11. Do NOT add headings outside the source code.
12. Do NOT use Markdown fences.
13. Python must contain no comments.
14. C/C++/Java/JavaScript should contain useful comments.
15. Never claim execution.
16. For Legacy Turbo C, NEVER produce void void main().
17. Return ONLY the COMPLETE SOURCE CODE.
`;

      const answer =
        await askAI(instruction);

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

      // Final defense-in-depth cleanup.
      code =
        cleanGeneratedProgram(
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

      if (
        !ALGORITHM_LEVELS.includes(level)
      ) {
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

Generate ONLY the algorithm.

Do NOT generate programming-language code
unless the student explicitly requests code.

Do NOT generate:

- long explanations
- example input
- example output
- time complexity
- space complexity
- important points

unless explicitly requested.

The output must be compact and suitable for
writing in a college notebook/exam.

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

Use:

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

CRITICAL FORMAT:

Every numbered step description MUST be inside square brackets.

Correct:
Step-1: [Check if the position is valid]

Correct:
Step-2: [Update the array element]

Never write a numbered step without square brackets.

Keep it concise.

Do not use Markdown code fences.
`;

      const answer =
        await askAI(instruction);

      const algorithm =
        cleanAlgorithmResponse(answer);

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

      const answer =
        await askAI(instruction);

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
// ALGORITHM RUNNER
// BACKEND ROUTE KEPT FOR COMPATIBILITY
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
      "Automatic Code Detection: ENABLED"
    );

    console.log(
      "Code Lab: ENABLED"
    );
  }
);
