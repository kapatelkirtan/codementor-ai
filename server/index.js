require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

/* =========================================================
   ENVIRONMENT
   ========================================================= */

const PORT =
  Number(process.env.PORT) || 10000;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "";

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.5-flash-lite";

const JUDGE0_URL =
  process.env.JUDGE0_URL ||
  "https://ce.judge0.com";

const JUDGE0_API_KEY =
  process.env.JUDGE0_API_KEY || "";

const JUDGE0_AUTH_USER =
  process.env.JUDGE0_AUTH_USER || "";

const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL
  )}:generateContent`;

const DOWNLOAD_DIR =
  path.join(
    __dirname,
    "public",
    "downloads"
  );

const EXE_FILE =
  path.join(
    DOWNLOAD_DIR,
    "CodeMentor-AI-Setup.exe"
  );

/* =========================================================
   CORS
   ========================================================= */

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",

  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",

  "https://codementor-ai-1-1g30.onrender.com",
]);

if (CLIENT_ORIGIN) {
  CLIENT_ORIGIN
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      allowedOrigins.add(item);
    });
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      if (
        /^http:\/\/localhost:\d+$/.test(
          origin
        )
      ) {
        return callback(null, true);
      }

      if (
        /^http:\/\/127\.0\.0\.1:\d+$/.test(
          origin
        )
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: false,
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =========================================================
   SUPPORTED LANGUAGES
   ========================================================= */

const LANGUAGES = {
  C: {
    id: 50,
    key: "c",
  },

  "C++": {
    id: 54,
    key: "cpp",
  },

  Python: {
    id: 71,
    key: "python",
  },

  Java: {
    id: 62,
    key: "java",
  },

  JavaScript: {
    id: 63,
    key: "javascript",
  },
};

const ALL_LANGUAGES =
  Object.keys(LANGUAGES);

/* =========================================================
   HELPERS
   ========================================================= */

function safeString(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function normalizeLanguage(language) {
  const value =
    safeString(language)
      .trim()
      .toLowerCase();

  const aliases = {
    c: "C",
    c99: "C",
    c11: "C",
    c17: "C",

    cpp: "C++",
    "c++": "C++",
    cxx: "C++",

    python: "Python",
    py: "Python",
    python3: "Python",

    java: "Java",

    javascript: "JavaScript",
    js: "JavaScript",
    node: "JavaScript",
    nodejs: "JavaScript",
  };

  return (
    aliases[value] ||
    Object.keys(LANGUAGES).find(
      (item) =>
        item.toLowerCase() === value
    ) ||
    ""
  );
}

function normalizeCodeStyle(style) {
  const value =
    safeString(style)
      .trim()
      .toLowerCase();

  if (
    value === "legacy" ||
    value === "turbo c" ||
    value === "turbo c++" ||
    value ===
      "legacy turbo c" ||
    value ===
      "legacy turbo c++" ||
    value ===
      "legacy turbo c style"
  ) {
    return "legacy";
  }

  return "modern";
}

function detectLanguage(code) {
  const source =
    safeString(code);

  if (
    /#include\s*[<"]iostream/i.test(
      source
    ) ||
    /#include\s*[<"]iostream\.h/i.test(
      source
    ) ||
    /\bstd::cout\b/.test(source) ||
    /\bstd::cin\b/.test(source) ||
    /\bcout\s*<</.test(source) ||
    /\bcin\s*>>/.test(source) ||
    /using\s+namespace\s+std/.test(
      source
    )
  ) {
    return "C++";
  }

  if (
    /#include\s*[<"]stdio\.h/i.test(
      source
    ) ||
    /\bprintf\s*\(/.test(source) ||
    /\bscanf\s*\(/.test(source)
  ) {
    return "C";
  }

  if (
    /public\s+class\s+Main/.test(
      source
    ) ||
    /System\.out\.println/.test(
      source
    ) ||
    /public\s+static\s+void\s+main/.test(
      source
    )
  ) {
    return "Java";
  }

  if (
    /console\.log\s*\(/.test(
      source
    ) ||
    /require\s*\(\s*["']/.test(
      source
    )
  ) {
    return "JavaScript";
  }

  if (
    /\bdef\s+\w+\s*\(/.test(
      source
    ) ||
    /\bprint\s*\(/.test(source)
  ) {
    return "Python";
  }

  return "";
}

function detectStyle(
  code,
  language
) {
  if (
    language !== "C" &&
    language !== "C++"
  ) {
    return "modern";
  }

  const source =
    safeString(code)
      .toLowerCase();

  if (
    source.includes("conio.h") ||
    source.includes("iostream.h") ||
    source.includes("clrscr(") ||
    source.includes("getch(") ||
    source.includes("void main(")
  ) {
    return "legacy";
  }

  return "modern";
}

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

/* =========================================================
   JSON EXTRACTION
   ========================================================= */

function extractJsonObject(text) {
  const source =
    safeString(text).trim();

  if (!source) {
    return null;
  }

  try {
    return JSON.parse(source);
  } catch (_) {}

  const fenced =
    source.match(
      /```(?:json)?\s*([\s\S]*?)```/i
    );

  if (fenced) {
    try {
      return JSON.parse(
        fenced[1].trim()
      );
    } catch (_) {}
  }

  const start =
    source.indexOf("{");

  const end =
    source.lastIndexOf("}");

  if (
    start !== -1 &&
    end !== -1 &&
    end > start
  ) {
    try {
      return JSON.parse(
        source.slice(
          start,
          end + 1
        )
      );
    } catch (_) {}
  }

  return null;
}

/* =========================================================
   GEMINI SYSTEM PROMPT
   ========================================================= */

const SYSTEM_PROMPT = `
You are CodeMentor AI.

You are an expert programming teacher,
code generator, debugger, algorithm teacher,
and programming practice assistant.

Supported languages:
- C
- C++
- Python
- Java
- JavaScript

C and C++ support:
- Modern style
- Legacy Turbo C / Turbo C++ style

IMPORTANT:
When the user selects Legacy Turbo C style,
the generated code must LOOK like a genuine old-school
Turbo C/Turbo C++ college practical program.

The CodeMentor backend has a compatibility layer that
converts legacy-only headers/functions into modern
Judge0-compatible source before execution.

Therefore, when LEGACY style is requested,
do NOT modernize the displayed/generated source.

Never claim code was executed unless an actual
execution result exists.

Never invent compiler output.

Never invent runtime output.

When complete code is requested,
provide complete runnable source.
`.trim();

/* =========================================================
   GEMINI REQUEST
   ========================================================= */

async function askAI(
  instruction,
  options = {}
) {
  if (!GEMINI_API_KEY) {
    const error =
      new Error(
        "GEMINI_API_KEY is not configured."
      );

    error.status = 503;

    throw error;
  }

  const maxAttempts =
    options.maxAttempts || 5;

  const temperature =
    options.temperature ??
    0.12;

  const maxOutputTokens =
    options.maxOutputTokens ||
    12000;

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      const response =
        await fetch(
          `${GEMINI_URL}?key=${encodeURIComponent(
            GEMINI_API_KEY
          )}`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text:
                      SYSTEM_PROMPT,
                  },
                ],
              },

              contents: [
                {
                  role: "user",

                  parts: [
                    {
                      text:
                        instruction,
                    },
                  ],
                },
              ],

              generationConfig: {
                temperature,
                maxOutputTokens,
              },
            }),
          }
        );

      const raw =
        await response.text();

      let data = null;

      try {
        data =
          JSON.parse(raw);
      } catch (_) {}

      if (!response.ok) {
        const error =
          new Error(
            data?.error?.message ||
              raw ||
              `Gemini request failed with status ${response.status}`
          );

        error.status =
          response.status;

        throw error;
      }

      const text =
        data?.candidates?.[0]
          ?.content?.parts
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
    } catch (error) {
      lastError = error;

      const retryable =
        [
          429,
          500,
          502,
          503,
          504,
        ].includes(
          error.status
        );

      if (
        !retryable ||
        attempt >= maxAttempts
      ) {
        throw error;
      }

      await sleep(
        Math.min(
          1000 *
            Math.pow(
              2,
              attempt - 1
            ),
          8000
        )
      );
    }
  }

  throw (
    lastError ||
    new Error(
      "AI request failed."
    )
  );
}

/* =========================================================
   CODE GENERATION PROMPT
   ========================================================= */

function buildCodeGenerationPrompt({
  topic,
  level,
  codeStyle,
}) {
  const style =
    normalizeCodeStyle(
      codeStyle
    );

  const legacyC =
    style === "legacy"
      ? `
=========================================================
LEGACY TURBO C — DISPLAYED CODE RULES
=========================================================

IMPORTANT:

The C code you generate will be DISPLAYED directly to the
student.

It MUST look like a genuine classic Turbo C college
practical program.

USE:

#include <stdio.h>
#include <conio.h>

void main()
{
    ...
}

Use:

clrscr();

near the beginning of main.

Use:

getch();

before the closing brace.

USE traditional declarations:

int arr[100];
int n;
int i;
int min;

Declare variables before executable statements.

USE traditional loops:

for(i = 0; i < n; i++)
{
    ...
}

USE traditional if statements:

if(arr[i] < min)
{
    ...
}

Use fixed-size arrays.

Example:

int arr[100];

NEVER use:

int arr[n];

Do NOT use variable-length arrays.

Do NOT use:
- C99
- C11
- C17-only syntax
- declarations inside for()
- stdint.h
- stdbool.h
- designated initializers
- compound literals
- modern-only features

DO NOT use:

int main()

for Legacy C.

The displayed source MUST use:

void main()

The displayed source MUST use:

#include <conio.h>

The displayed source MUST use:

clrscr();

and:

getch();

This is intentional.

The CodeMentor backend automatically removes these
Turbo C-specific parts before sending the source to Judge0.

Therefore, DO NOT modernize this source.

COMMENTS:

Use old-school C comments:

/* Read array elements */
/* Find minimum value */
/* Display result */

Do NOT use // comments.

The result should visually resemble a classic
Turbo C college practical.
`
      : `
=========================================================
MODERN C
=========================================================

Use standard modern C.

Use:

#include <stdio.h>

int main(void)
{
    ...
    return 0;
}

Do NOT use:
- conio.h
- clrscr()
- getch()
- void main()

unless explicitly requested.
`;

  const legacyCpp =
    style === "legacy"
      ? `
=========================================================
LEGACY TURBO C++ — DISPLAYED CODE RULES
=========================================================

IMPORTANT:

The C++ code you generate will be DISPLAYED directly to
the student.

It MUST look like a genuine classic Turbo C++ college
practical program.

USE:

#include <iostream.h>
#include <conio.h>

void main()
{
    ...
}

Use:

clrscr();

near the beginning.

Use:

getch();

before the closing brace.

Use:

cin

and:

cout

Use traditional declarations near the beginning.

Example:

int arr[100];
int n;
int i;
int min;

Use traditional loops:

for(i = 0; i < n; i++)
{
    ...
}

Use simple conditions.

Use fixed-size arrays.

NEVER use:

int arr[n];

Do NOT use C++11 or newer features.

NEVER use:
- auto
- nullptr
- lambda
- range-based for
- constexpr
- enum class
- initializer lists
- structured bindings
- modern STL solutions when a simple array is enough

DO NOT use:

#include <iostream>

in the DISPLAYED Legacy C++ source.

Use:

#include <iostream.h>

DO NOT use:

int main()

in the DISPLAYED Legacy C++ source.

Use:

void main()

This is intentional.

The CodeMentor backend automatically converts
iostream.h, conio.h, void main(), clrscr()
and getch() into Judge0-compatible C++ before execution.

COMMENTS:

Use:

/* Read array elements */
/* Find minimum value */
/* Display result */

Do NOT use // comments.

The result should visually resemble a classic
Turbo C++ college practical.
`
      : `
=========================================================
MODERN C++
=========================================================

Use standard modern C++.

Use:

#include <iostream>

int main()
{
    ...
    return 0;
}

Use:

std::cin
std::cout

Do NOT use:
- iostream.h
- conio.h
- clrscr()
- getch()
- void main()

unless explicitly requested.
`;

  const commentRules = `
=========================================================
COMMENT REQUIREMENTS
=========================================================

COMMENTS ARE REQUIRED IN ALL FIVE LANGUAGES.

Every generated program must contain meaningful comments
for the important parts of the program.

Comments should explain:
- program purpose
- important variables
- input
- main logic
- important loops
- important conditions
- output

Do not comment every single line.

For Legacy C/C++:
USE ONLY:

/* comment */

Python:
Use # comments.

Java:
Use // or /* */ comments.

JavaScript:
Use // or /* */ comments.
`;

  return `
You are CodeMentor AI's Code Generator.

Student level:
${level || "Beginner"}

User's programming problem:

${topic}

Selected C/C++ style:

${
  style === "legacy"
    ? "LEGACY TURBO C / TURBO C++"
    : "MODERN"
}

Generate the SAME complete solution in:

1. C
2. C++
3. Python
4. Java
5. JavaScript

${legacyC}

${legacyCpp}

${commentRules}

=========================================================
IMPORTANT STYLE ENFORCEMENT
=========================================================

If the selected style is LEGACY:

The C output MUST contain:

#include <stdio.h>
#include <conio.h>

void main()

clrscr();

getch();

The C++ output MUST contain:

#include <iostream.h>
#include <conio.h>

void main()

clrscr();

getch();

DO NOT replace them with modern equivalents.

The backend, not Gemini, is responsible for making the
legacy source executable on modern Judge0.

For array problems use fixed arrays such as:

int arr[100];

NEVER:

int arr[n];

All five languages must solve exactly the same problem.

Use equivalent input and output.

=========================================================
PYTHON
=========================================================

Use Python 3.

Include meaningful # comments.

=========================================================
JAVA
=========================================================

Use:

public class Main

The program must be complete and runnable.

Include meaningful comments.

=========================================================
JAVASCRIPT
=========================================================

Use Node.js.

Use standard input when needed.

Include meaningful comments.

=========================================================
OUTPUT FORMAT
=========================================================

Return exactly:

=== C ===

complete C program

=== C++ ===

complete C++ program

=== Python ===

complete Python program

=== Java ===

complete Java program

=== JavaScript ===

complete JavaScript program

=== HOW IT WORKS ===

short explanation

=== EXAMPLE INPUT ===

example input

=== EXPECTED OUTPUT ===

expected output

=== IMPORTANT POINTS ===

important learning points

Do not add any extra headings.

Do not wrap programs in Markdown fences.
`.trim();
}

/* =========================================================
   LANGUAGE SOLUTION EXTRACTION
   ========================================================= */

function extractLanguageSolutions(
  answer
) {
  const result = {};

  const languages = [
    "C",
    "C++",
    "Python",
    "Java",
    "JavaScript",
  ];

  for (
    const language of languages
  ) {
    const escaped =
      language.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const nextLanguages =
      languages
        .filter(
          (item) =>
            item !== language
        )
        .map(
          (item) =>
            item.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )
        )
        .join("|");

    const regex =
      new RegExp(
        `===\\s*${escaped}\\s*===\\s*([\\s\\S]*?)(?=\\n===\\s*(?:${nextLanguages}|HOW IT WORKS|EXAMPLE INPUT|EXPECTED OUTPUT|IMPORTANT POINTS)\\s*===|$)`,
        "i"
      );

    const match =
      answer.match(regex);

    if (!match) {
      continue;
    }

    let code =
      match[1].trim();

    code =
      code.replace(
        /^```(?:c|cpp|python|java|javascript|js)?\s*/i,
        ""
      );

    code =
      code.replace(
        /\s*```$/i,
        ""
      );

    result[language] =
      code.trim();
  }

  return result;
}

/* =========================================================
   ALGORITHM PROMPT
   ========================================================= */

function buildAlgorithmPrompt({
  topic,
  level,
}) {
  return `
You are CodeMentor AI, an expert Data Structures
and Algorithms teacher.

Create an exam-ready handwritten-notebook-style
algorithm for:

${topic}

Student level:
${level || "Beginner"}

The student wants a college practical notebook format.

Return ONLY valid JSON.

Do NOT return Markdown.

Required structure:

{
  "title": "<algorithm title>",
  "name": "<algorithm name and parameters>",
  "operation": "[<short operation comment>]",
  "variables": [
    "(i) <VARIABLE>: <meaning>",
    "(ii) <VARIABLE>: <meaning>"
  ],
  "steps": [
    "Step-1: [<comment>]",
    "    <pseudocode line>",
    "    <pseudocode line>",
    "Step-2: [<comment>]",
    "    RETURN"
  ]
}

Rules:

1. Always include a clear title.

2. Always include an algorithm name.

Example:

ARR-UPDATE(ARR, OLDX, NEWX)

3. Include one short operation comment in square brackets.

4. Always include Variables.

5. Number variables:

(i)
(ii)
(iii)
(iv)
(v)

6. Every variable used must be described.

7. Always include Steps.

8. Number steps:

Step-1:
Step-2:
Step-3:

9. Important steps MUST contain square-bracket comments.

10. Use pseudocode only.

11. Do not use programming-language syntax.

12. Use uppercase pseudocode keywords:

FOR
TO
DO
IF
THEN
ELSE
END IF
END FOR
WHILE
END WHILE
RETURN

13. Use array notation such as:

ARR[i]

14. Use:

ARR[i] <- NEWX

for assignment.

15. Keep it concise and exam-ready.

16. Do not add:
- Introduction
- Advantages
- Disadvantages
- Complexity
- Example
- Conclusion

17. Comments MUST use square brackets.

18. Do not use:
//
/*
#

as algorithm comments.

19. Do not return empty variables.

20. Do not return empty steps.

Example style:

Algorithm: Array Update Operation

Algorithm:
ARR-UPDATE(ARR, OLDX, NEWX)
[Replaces OLDX with NEWX in the given array ARR]

Variables:
(i) ARR : Represents an array
(ii) SIZE : Represents total number of elements
(iii) OLDX : Represents element to be replaced
(iv) NEWX : Represents new element
(v) i : Loop-control variable

Steps:

Step-1: [Traverse array and find OLDX]
    FOR i = 0 TO SIZE - 1
    DO
        IF ARR[i] = OLDX THEN
            ARR[i] <- NEWX
        END IF
    END FOR

Step-2: [Finish]
    RETURN

Maintain this academic style while generating the
correct algorithm for the user's actual topic.

Return exactly one JSON object.
`.trim();
}

/* =========================================================
   HEALTH
   ========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,

      status: "ok",

      service:
        "CodeMentor AI Backend",

      geminiConfigured:
        Boolean(
          GEMINI_API_KEY
        ),

      geminiModel:
        GEMINI_MODEL,

      judge0Configured:
        Boolean(
          JUDGE0_URL
        ),

      judge0Authentication:
        Boolean(
          JUDGE0_API_KEY
        ),

      supportedLanguages:
        ALL_LANGUAGES,

      features: {
        codeGeneration:
          true,

        fiveLanguages:
          true,

        algorithmSystem:
          true,

        algorithmGenerator:
          true,

        algorithmPractice:
          true,

        codeExecution:
          true,

        automaticCodeDetection:
          true,

        aiTeacher:
          true,

        practice:
          true,

        codeDebugger:
          true,

        desktopExeDownload:
          true,

        geminiRetry:
          true,

        legacyTurboC:
          true,

        legacyJudge0Compatibility:
          true,
      },

      legacyMode: {
        displayedC:
          "Turbo C style",

        displayedCpp:
          "Turbo C++ style",

        execution:
          "Judge0/GCC compatible",

        cLegacyFeatures:
          [
            "conio.h",
            "void main()",
            "clrscr()",
            "getch()",
          ],

        cppLegacyFeatures:
          [
            "iostream.h",
            "conio.h",
            "void main()",
            "clrscr()",
            "getch()",
          ],
      },

      endpoints: {
        teacher:
          "/api/ai/teach",

        code:
          "/api/ai/code",

        debugCode:
          "/api/ai/debug-code",

        generateCode:
          "/api/ai/generate-code",

        algorithm:
          "/api/ai/algorithm",

        generateAlgorithm:
          "/api/ai/generate-algorithm",

        algorithmPractice:
          "/api/ai/algorithm-practice",

        practice:
          "/api/ai/practice",

        runCode:
          "/api/code/run",

        runAlgorithm:
          "/api/algorithm/run",

        exe:
          "/downloads/CodeMentor-AI-Setup.exe",
      },

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* =========================================================
   AI TEACHER
   ========================================================= */

app.post(
  "/api/ai/teach",
  async (req, res) => {
    try {
      const {
        language,
        level,
        question,
      } = req.body || {};

      if (
        !safeString(
          question
        ).trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Enter a programming question.",
          });
      }

      const answer =
        await askAI(`
Programming language:
${language || "General programming"}

Student level:
${level || "Beginner"}

Student question:
${question}

Teach the concept clearly and step by step.

If code is requested, provide complete code.

Use meaningful comments in code.

Do not claim execution.
`.trim());

      res.json({
        success: true,
        answer,
      });
    } catch (error) {
      console.error(error);

      res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          error:
            error.message ||
            "AI Teacher failed.",
        });
    }
  }
);

/* =========================================================
   AI DEBUGGER
   ========================================================= */

app.post(
  "/api/ai/debug-code",
  async (req, res) => {
    try {
      const {
        language,
        codeStyle,
        code,
      } = req.body || {};

      const sourceCode =
        safeString(code).trim();

      if (!sourceCode) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Code is required.",
          });
      }

      const selectedLanguage =
        normalizeLanguage(
          language
        ) ||
        detectLanguage(
          sourceCode
        ) ||
        "C";

      const selectedStyle =
        (
          selectedLanguage === "C" ||
          selectedLanguage === "C++"
        )
          ? normalizeCodeStyle(
              codeStyle ||
                detectStyle(
                  sourceCode,
                  selectedLanguage
                )
            )
          : "modern";

      const answer =
        await askAI(`
You are CodeMentor AI's dedicated code debugger.

Programming language:
${selectedLanguage}

Selected style:
${selectedStyle}

Student code:

${sourceCode}

Analyze:

1. Syntax errors
2. Compilation errors
3. Runtime problems visible from source
4. Logical errors
5. Input/output problems
6. Algorithm problems

Then provide complete corrected code.

IMPORTANT LEGACY RULES:

If C Legacy:
- Preserve Turbo C appearance.
- #include <stdio.h>
- #include <conio.h>
- void main()
- clrscr()
- getch()
- fixed-size arrays
- declarations near beginning
- /* */ comments

If C++ Legacy:
- Preserve Turbo C++ appearance.
- #include <iostream.h>
- #include <conio.h>
- void main()
- clrscr()
- getch()
- cin/cout
- fixed-size arrays
- no C++11+
- /* */ comments

Do NOT modernize legacy source.

Do not claim execution.

Do not invent compiler output.

Do not invent runtime output.

Return ONLY JSON:

{
  "hasErrors": true,
  "summary": "Short diagnosis",
  "issues": [
    {
      "line": 1,
      "type": "Syntax Error",
      "problem": "What is wrong",
      "why": "Why",
      "fix": "How to fix"
    }
  ],
  "correctedCode": "Complete corrected source"
}
`.trim(), {
          temperature:
            0.1,

          maxOutputTokens:
            16000,

          maxAttempts:
            5,
        });

      const parsed =
        extractJsonObject(
          answer
        );

      if (!parsed) {
        return res
          .status(502)
          .json({
            success: false,
            error:
              "AI returned an invalid debugger response.",
          });
      }

      const issues =
        Array.isArray(
          parsed.issues
        )
          ? parsed.issues
              .map(
                (issue) => ({
                  line:
                    Number.isFinite(
                      Number(
                        issue?.line
                      )
                    )
                      ? Number(
                          issue.line
                        )
                      : null,

                  type:
                    safeString(
                      issue?.type
                    ).trim() ||
                    "Code Issue",

                  problem:
                    safeString(
                      issue?.problem
                    ).trim() ||
                    "Problem detected.",

                  why:
                    safeString(
                      issue?.why
                    ).trim() ||
                    "The code may not behave as expected.",

                  fix:
                    safeString(
                      issue?.fix
                    ).trim() ||
                    "Review and correct this section.",
                })
              )
              .slice(0, 30)
          : [];

      res.json({
        success: true,

        language:
          selectedLanguage,

        codeStyle:
          selectedStyle,

        hasErrors:
          Boolean(
            parsed.hasErrors
          ),

        summary:
          safeString(
            parsed.summary
          ).trim() ||
          "Code analysis completed.",

        issues,

        correctedCode:
          safeString(
            parsed.correctedCode
          ).trim() ||
          sourceCode,
      });
    } catch (error) {
      console.error(error);

      res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          error:
            error.message ||
            "AI debugger failed.",
        });
    }
  }
);

/* =========================================================
   CODE ANALYSIS
   ========================================================= */

app.post(
  "/api/ai/code",
  async (req, res) => {
    try {
      const {
        action,
        language,
        code,
      } = req.body || {};

      if (
        !safeString(
          code
        ).trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Code is required.",
          });
      }

      const answer =
        await askAI(`
Language:
${language || "Unknown"}

Task:
${action || "Explain and fix this code"}

Code:

${code}

Analyze the code clearly.

Recognize:
- Modern C/C++
- Legacy Turbo C/C++

Do not claim execution.
`.trim());

      res.json({
        success: true,
        answer,
      });
    } catch (error) {
      console.error(error);

      res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          error:
            error.message ||
            "Code analysis failed.",
        });
    }
  }
);

/* =========================================================
   CODE GENERATOR
   ========================================================= */

app.post(
  "/api/ai/generate-code",
  async (req, res) => {
    try {
      const {
        language,
        level,
        topic,
        codeStyle,
      } = req.body || {};

      if (
        !safeString(
          topic
        ).trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Enter a programming problem or topic.",
          });
      }

      const normalizedStyle =
        normalizeCodeStyle(
          codeStyle
        );

      const answer =
        await askAI(
          buildCodeGenerationPrompt({
            topic:
              topic.trim(),

            level,

            codeStyle:
              normalizedStyle,
          }),
          {
            temperature:
              0.08,

            maxOutputTokens:
              16000,

            maxAttempts:
              5,
          }
        );

      const solutions =
        extractLanguageSolutions(
          answer
        );

      const normalizedLanguage =
        normalizeLanguage(
          language
        );

      const code =
        solutions[
          normalizedLanguage
        ] ||
        solutions.C ||
        "";

      res.json({
        success: true,

        language:
          normalizedLanguage ||
          language ||
          "C",

        code,

        solutions,

        languages:
          ALL_LANGUAGES,

        codeStyle:
          normalizedStyle,

        answer,
      });
    } catch (error) {
      console.error(error);

      res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          error:
            error.message ||
            "Code generation failed.",
        });
    }
  }
);

/* =========================================================
   ALGORITHM TEACHER
   ========================================================= */

app.post(
  "/api/ai/algorithm",
  async (req, res) => {
    try {
      const {
        level,
        question,
      } = req.body || {};

      if (
        !safeString(
          question
        ).trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Enter an algorithm question.",
          });
      }

      const answer =
        await askAI(`
Algorithm level:
${level || "Beginner"}

Question:
${question}

Explain:
- algorithm idea
- steps
- pseudocode
- time complexity
- space complexity
- example

Do not claim execution.
`.trim());

      res.json({
        success: true,
        answer,
      });
    } catch (error) {
      console.error(error);

      res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          error:
            error.message ||
            "Algorithm teacher failed.",
        });
    }
  }
);

/* =========================================================
   ALGORITHM GENERATOR
   ========================================================= */

app.post(
  "/api/ai/generate-algorithm",
  async (req, res) => {
    try {
      const {
        topic,
        level,
      } = req.body || {};

      if (
        !safeString(
          topic
        ).trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Enter an algorithm topic or problem.",
          });
      }

      const answer =
        await askAI(
          buildAlgorithmPrompt({
            topic:
              topic.trim(),

            level,
          }),
          {
            temperature:
              0.1,

            maxOutputTokens:
              8000,

            maxAttempts:
              5,
          }
        );

      const parsed =
        extractJsonObject(
          answer
        );

      if (!parsed) {
        return res
          .status(502)
          .json({
            success: false,
            error:
              "AI returned an invalid algorithm format.",
          });
      }

      const variables =
        Array.isArray(
          parsed.variables
        )
          ? parsed.variables.map(
              (item) =>
                String(item)
            )
          : [];

      const steps =
        Array.isArray(
          parsed.steps
        )
          ? parsed.steps.map(
              (item) =>
                String(item)
            )
          : [];

      res.json({
        success: true,

        title:
          safeString(
            parsed.title
          ).trim() ||
          topic.trim(),

        name:
          safeString(
            parsed.name
          ).trim() ||
          topic.trim(),

        operation:
          safeString(
            parsed.operation
          ).trim(),

        variables,

        steps,
      });
    } catch (error) {
      console.error(error);

      res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          error:
            error.message ||
            "Algorithm generation failed.",
        });
    }
  }
);

/* =========================================================
   ALGORITHM PRACTICE
   ========================================================= */

app.post(
  "/api/ai/algorithm-practice",
  async (req, res) => {
    try {
      const {
        level,
        topic,
        studentAnswer,
      } = req.body || {};

      if (
        !safeString(
          topic
        ).trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Enter an algorithm topic.",
          });
      }

      const answer =
        await askAI(`
Algorithm level:
${level || "Beginner"}

Topic:
${topic}

Student answer:
${
  safeString(
    studentAnswer
  ).trim() ||
  "(No answer written.)"
}

Evaluate the student's answer.

Include:
- correct parts
- missing parts
- mistakes
- corrected algorithm
- one improvement tip

Do not claim execution.
`.trim());

      res.json({
        success: true,
        answer,
      });
    } catch (error) {
      console.error(error);

      res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          error:
            error.message ||
            "Algorithm practice failed.",
        });
    }
  }
);

/* =========================================================
   GENERAL PRACTICE
   ========================================================= */

app.post(
  "/api/ai/practice",
  async (req, res) => {
    try {
      const {
        language,
        level,
        topic,
      } = req.body || {};

      const answer =
        await askAI(`
Create a programming practice problem.

Language:
${language || "Python"}

Level:
${level || "Beginner"}

Topic:
${topic || "Basic programming"}

Include:

Problem
Input
Expected Output
Constraints
Hint

Do not claim execution.
`.trim());

      res.json({
        success: true,
        answer,
      });
    } catch (error) {
      console.error(error);

      res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          error:
            error.message ||
            "Practice generation failed.",
        });
    }
  }
);

/* =========================================================
   JUDGE0 HEADERS
   ========================================================= */

function getJudge0Headers() {
  const headers = {
    "Content-Type":
      "application/json",
  };

  if (JUDGE0_API_KEY) {
    headers[
      "X-Auth-Token"
    ] = JUDGE0_API_KEY;
  }

  if (JUDGE0_AUTH_USER) {
    headers[
      "X-Auth-User"
    ] = JUDGE0_AUTH_USER;
  }

  return headers;
}

/* =========================================================
   LEGACY -> JUDGE0 COMPATIBILITY
   ========================================================= */

/*
 * IMPORTANT:
 *
 * Gemini generates TRUE Turbo C / Turbo C++ code
 * for Legacy mode.
 *
 * Example displayed C:
 *
 * #include <stdio.h>
 * #include <conio.h>
 *
 * void main()
 * {
 *     clrscr();
 *
 *     ...
 *
 *     getch();
 * }
 *
 * Judge0/GCC does not provide conio.h.
 *
 * Therefore this function converts ONLY the source
 * that is sent to Judge0.
 *
 * The source shown in Code Generator is NOT changed.
 */

function makeJudge0Compatible(
  language,
  code
) {
  let source =
    safeString(code);

  /* =======================================================
     C
     ======================================================= */

  if (language === "C") {
    /* Remove Turbo C header. */
    source =
      source.replace(
        /^\s*#include\s*[<"]conio\.h[>"]\s*$/gim,
        ""
      );

    /* Remove Turbo C screen functions. */
    source =
      source.replace(
        /\bclrscr\s*\(\s*\)\s*;?/g,
        ""
      );

    source =
      source.replace(
        /\bgetch\s*\(\s*\)\s*;?/g,
        ""
      );

    /*
     * Convert displayed Turbo C:
     *
     * void main()
     *
     * into:
     *
     * int main()
     */
    source =
      source.replace(
        /\bvoid\s+main\s*\(/g,
        "int main("
      );

    /*
     * Make sure int main has return 0.
     */
    const mainMatch =
      source.match(
        /\bint\s+main\s*\([^)]*\)\s*\{/
      );

    if (mainMatch) {
      const hasReturn =
        /\breturn\s+0\s*;/.test(
          source
        );

      if (!hasReturn) {
        const lastBrace =
          source.lastIndexOf("}");

        if (lastBrace !== -1) {
          source =
            source.slice(
              0,
              lastBrace
            ) +
            "\n    return 0;\n" +
            source.slice(
              lastBrace
            );
        }
      }
    }
  }

  /* =======================================================
     C++
     ======================================================= */

  if (language === "C++") {
    /*
     * Convert old Turbo C++ header.
     */
    source =
      source.replace(
        /#include\s*[<"]iostream\.h[>"]/gi,
        "#include <iostream>"
      );

    /*
     * Remove Turbo C++ console header.
     */
    source =
      source.replace(
        /^\s*#include\s*[<"]conio\.h[>"]\s*$/gim,
        ""
      );

    /*
     * Remove Turbo C++ screen functions.
     */
    source =
      source.replace(
        /\bclrscr\s*\(\s*\)\s*;?/g,
        ""
      );

    source =
      source.replace(
        /\bgetch\s*\(\s*\)\s*;?/g,
        ""
      );

    /*
     * Convert:
     *
     * void main()
     *
     * into:
     *
     * int main()
     */
    source =
      source.replace(
        /\bvoid\s+main\s*\(/g,
        "int main("
      );

    /*
     * Add using namespace std if the legacy program
     * uses cin/cout without std::.
     */
    const usesClassicIO =
      /\b(?:cin|cout|endl)\b/.test(
        source
      );

    const hasNamespace =
      /using\s+namespace\s+std\s*;/.test(
        source
      );

    const usesStd =
      /\bstd::(?:cin|cout|endl)\b/.test(
        source
      );

    if (
      usesClassicIO &&
      !hasNamespace &&
      !usesStd
    ) {
      const includeMatch =
        source.match(
          /^(?:\s*#include[^\n]*\n)+/
        );

      if (includeMatch) {
        source =
          includeMatch[0] +
          "using namespace std;\n" +
          source.slice(
            includeMatch[0].length
          );
      } else {
        source =
          "using namespace std;\n" +
          source;
      }
    }

    /*
     * Make sure int main has return 0.
     */
    const mainMatch =
      source.match(
        /\bint\s+main\s*\([^)]*\)\s*\{/
      );

    if (mainMatch) {
      const hasReturn =
        /\breturn\s+0\s*;/.test(
          source
        );

      if (!hasReturn) {
        const lastBrace =
          source.lastIndexOf("}");

        if (lastBrace !== -1) {
          source =
            source.slice(
              0,
              lastBrace
            ) +
            "\n    return 0;\n" +
            source.slice(
              lastBrace
            );
        }
      }
    }
  }

  return source.trim();
}

/* =========================================================
   JUDGE0 RUNNER
   ========================================================= */

async function runJudge0(
  language,
  code,
  stdin,
  codeStyle
) {
  const selected =
    LANGUAGES[
      language
    ];

  if (!selected) {
    throw new Error(
      `Unsupported language: ${language}`
    );
  }

  const style =
    normalizeCodeStyle(
      codeStyle
    );

  /*
   * Convert ONLY the execution copy.
   *
   * The original legacy source remains unchanged
   * in the Code Generator.
   */
  const executionSource =
    makeJudge0Compatible(
      language,
      code
    );

  const body = {
    language_id:
      selected.id,

    source_code:
      executionSource,

    stdin:
      safeString(stdin),
  };

  /*
   * Do not force C90 here.
   *
   * The compatibility layer has already converted
   * the Turbo C-specific parts.
   *
   * This keeps execution reliable with the existing
   * Judge0 C compiler.
   */
  const response =
    await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",

        headers:
          getJudge0Headers(),

        body:
          JSON.stringify(body),
      }
    );

  const raw =
    await response.text();

  let data = null;

  try {
    data =
      JSON.parse(raw);
  } catch (_) {}

  if (!response.ok) {
    throw new Error(
      data?.message ||
        raw ||
        `Judge0 request failed with status ${response.status}`
    );
  }

  return {
    ...data,

    executedSource:
      executionSource,

    originalSource:
      safeString(code),

    codeStyle:
      style,
  };
}

/* =========================================================
   CODE RUNNER
   ========================================================= */

app.post(
  "/api/code/run",
  async (req, res) => {
    try {
      const {
        language,
        code,
        stdin,
        codeStyle,
      } = req.body || {};

      const source =
        safeString(code).trim();

      if (!source) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Code is required.",
          });
      }

      const requested =
        normalizeLanguage(
          language
        );

      const detected =
        LANGUAGES[
          requested
        ]
          ? requested
          : detectLanguage(
              source
            );

      if (!detected) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Unable to detect a supported programming language.",
          });
      }

      const selectedStyle =
        (
          detected === "C" ||
          detected === "C++"
        )
          ? normalizeCodeStyle(
              codeStyle ||
                detectStyle(
                  source,
                  detected
                )
            )
          : "modern";

      const result =
        await runJudge0(
          detected,
          source,
          stdin,
          selectedStyle
        );

      res.json({
        success: true,

        language:
          detected,

        languageKey:
          LANGUAGES[
            detected
          ]?.key ||
          detected.toLowerCase(),

        codeStyle:
          selectedStyle,

        status:
          result.status
            ?.description ||
          "Unknown",

        stdout:
          result.stdout ||
          "",

        stderr:
          result.stderr ||
          "",

        compile_output:
          result.compile_output ||
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

        output:
          result.stdout ||
          "",

        /*
         * Debug information.
         * The frontend does not need to display this.
         */
        executionSource:
          result.executedSource,
      });
    } catch (error) {
      console.error(error);

      res
        .status(500)
        .json({
          success: false,
          error:
            error.message ||
            "Code execution failed.",
        });
    }
  }
);

/* =========================================================
   ALGORITHM RUNNER
   ========================================================= */

app.post(
  "/api/algorithm/run",
  async (req, res) => {
    try {
      const {
        language,
        code,
        stdin,
        codeStyle,
      } = req.body || {};

      const source =
        safeString(code).trim();

      if (!source) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Code is required.",
          });
      }

      const requested =
        normalizeLanguage(
          language
        );

      const detected =
        LANGUAGES[
          requested
        ]
          ? requested
          : detectLanguage(
              source
            );

      if (!detected) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Unable to detect a supported programming language.",
          });
      }

      const selectedStyle =
        (
          detected === "C" ||
          detected === "C++"
        )
          ? normalizeCodeStyle(
              codeStyle ||
                detectStyle(
                  source,
                  detected
                )
            )
          : "modern";

      const result =
        await runJudge0(
          detected,
          source,
          stdin,
          selectedStyle
        );

      res.json({
        success: true,

        language:
          detected,

        languageKey:
          LANGUAGES[
            detected
          ]?.key ||
          detected.toLowerCase(),

        codeStyle:
          selectedStyle,

        status:
          result.status
            ?.description ||
          "Unknown",

        stdout:
          result.stdout ||
          "",

        stderr:
          result.stderr ||
          "",

        compile_output:
          result.compile_output ||
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

        output:
          result.stdout ||
          "",

        executionSource:
          result.executedSource,
      });
    } catch (error) {
      console.error(error);

      res
        .status(500)
        .json({
          success: false,
          error:
            error.message ||
            "Algorithm execution failed.",
        });
    }
  }
);

/* =========================================================
   DESKTOP EXE DOWNLOAD
   ========================================================= */

if (
  !fs.existsSync(
    DOWNLOAD_DIR
  )
) {
  fs.mkdirSync(
    DOWNLOAD_DIR,
    {
      recursive: true,
    }
  );
}

app.use(
  "/downloads",
  express.static(
    DOWNLOAD_DIR
  )
);

app.get(
  "/api/downloads/exe",
  (req, res) => {
    if (
      !fs.existsSync(
        EXE_FILE
      )
    ) {
      return res
        .status(404)
        .json({
          success: false,
          error:
            "Desktop EXE has not been uploaded to the server yet.",
        });
    }

    res.download(
      EXE_FILE,
      "CodeMentor-AI-Setup.exe"
    );
  }
);

/* =========================================================
   404
   ========================================================= */

app.use(
  (req, res) => {
    res
      .status(404)
      .json({
        success: false,
        error:
          "API endpoint not found.",
        path:
          req.originalUrl,
      });
  }
);

/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Server error:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    res
      .status(
        error.status || 500
      )
      .json({
        success: false,
        error:
          error.message ||
          "Internal server error.",
      });
  }
);

/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `CodeMentor AI backend running on port ${PORT}`
    );

    console.log(
      `Gemini configured: ${Boolean(
        GEMINI_API_KEY
      )}`
    );

    console.log(
      `Gemini model: ${GEMINI_MODEL}`
    );

    console.log(
      `Judge0 URL: ${JUDGE0_URL}`
    );

    console.log(
      `Judge0 authentication: ${Boolean(
        JUDGE0_API_KEY
      )}`
    );

    console.log(
      "Supported languages: C, C++, Python, Java, JavaScript"
    );

    console.log(
      "Gemini automatic retry: enabled"
    );

    console.log(
      "Legacy Turbo C display mode: enabled"
    );

    console.log(
      "Legacy Turbo C++ display mode: enabled"
    );

    console.log(
      "Legacy -> Judge0 compatibility layer: enabled"
    );

    console.log(
      "conio.h will be removed only during execution"
    );

    console.log(
      "Turbo C void main() will be converted only during execution"
    );
  }
);