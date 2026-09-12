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

// ======================================================
// GEMINI AI
// ======================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ======================================================
// SUPPORTED LANGUAGES
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
// LEVELS AND STYLES
// ======================================================

const LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const STYLES = [
  "Modern Standard",
  "Legacy Turbo C",
];

// ======================================================
// GEMINI SYSTEM PROMPT
// ======================================================

const SYSTEM_PROMPT = `
You are CodeMentor AI, an expert programming teacher.

You teach:
- C
- C++
- Python
- Java
- JavaScript

Always follow the programming language and code style selected by the user.

The learner may be a beginner, so use simple explanations and useful comments.

IMPORTANT:
When the user selects Legacy Turbo C for C or C++, you MUST generate
classic legacy-style C/C++ source code. Do not silently replace it with
modern standard syntax.

Never claim that code was executed.

Never invent actual execution results.

Code execution is performed separately by Judge0.

Be accurate, practical, beginner-friendly and precise.
`;

// ======================================================
// COMMENT RULE
// ======================================================

const COMMENT_RULE = `
COMMENTING REQUIREMENT:

The learner is a beginner.

Add useful beginner-friendly comments to important lines or statements.

Explain important:
- declarations
- variables
- input
- assignments
- calculations
- conditions
- loops
- functions
- classes
- output

Keep comments short and useful.

Use correct comment syntax for the selected language.

The code must remain valid after comments are added.
`;

// ======================================================
// CHECK GEMINI CONFIGURATION
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
// ASK GEMINI
// ======================================================

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
        temperature: 0.15,
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

// ======================================================
// EXTRACT CODE FROM GEMINI RESPONSE
// ======================================================

function extractCode(text) {
  if (!text) {
    return "";
  }

  // First try to find a Markdown code block.
  const matches = [
    ...text.matchAll(
      /```(?:[a-zA-Z0-9_+#.-]+)?\s*\n?([\s\S]*?)```/g
    ),
  ];

  if (matches.length > 0) {
    return matches[0][1].trim();
  }

  // Try the === CODE === section.
  const codeSection = text.match(
    /===\s*CODE\s*===([\s\S]*?)(?====\s*HOW IT WORKS\s*===|$)/i
  );

  if (codeSection) {
    return codeSection[1].trim();
  }

  return text
    .replace(/^Here is.*?:/i, "")
    .trim();
}

// ======================================================
// CLEAN EXPLANATION
// ======================================================

function cleanGeneratedExplanation(text) {
  if (!text) {
    return "";
  }

  const withoutCode = text.replace(
    /```[\s\S]*?```/g,
    ""
  );

  const markerIndex = withoutCode.search(
    /===\s*HOW IT WORKS\s*===/i
  );

  if (markerIndex >= 0) {
    return withoutCode
      .slice(markerIndex)
      .trim();
  }

  return withoutCode
    .replace(/^===\s*CODE\s*===/i, "")
    .trim();
}

// ======================================================
// FORCE LEGACY TURBO C STYLE
// ======================================================
//
// Gemini normally follows the prompt, but sometimes it may
// return modern C even when Legacy Turbo C is selected.
//
// This function guarantees that C/C++ legacy mode looks
// like classic Turbo C-style source code.

function enforceLegacyTurboStyle(
  language,
  code,
  codeStyle
) {
  if (
    codeStyle !== "Legacy Turbo C" ||
    (language !== "C" && language !== "C++")
  ) {
    return code;
  }

  let legacy = code.trim();

  // ----------------------------------------------------
  // Add conio.h if it is missing.
  // ----------------------------------------------------

  if (!/#include\s*[<"]conio\.h[>"]/.test(legacy)) {
    const includeLines = [
      ...legacy.matchAll(
        /^\s*#include[^\n]*$/gm
      ),
    ];

    if (includeLines.length > 0) {
      const lastInclude =
        includeLines[includeLines.length - 1];

      const insertPosition =
        lastInclude.index +
        lastInclude[0].length;

      legacy =
        legacy.slice(0, insertPosition) +
        "\n#include <conio.h>" +
        legacy.slice(insertPosition);
    } else {
      legacy =
        `#include <conio.h>\n${legacy}`;
    }
  }

  // ----------------------------------------------------
  // Convert modern main() to void main().
  // ----------------------------------------------------

  legacy = legacy.replace(
    /\bint\s+main\s*\(\s*(?:void)?\s*\)/,
    "void main()"
  );

  // ----------------------------------------------------
  // Add clrscr() inside main.
  // ----------------------------------------------------

  if (!/\bclrscr\s*\(\s*\)\s*;/.test(legacy)) {
    const mainMatch =
      legacy.match(
        /\bvoid\s+main\s*\(\s*\)\s*\{/
      );

    if (
      mainMatch &&
      mainMatch.index !== undefined
    ) {
      const insertPosition =
        mainMatch.index +
        mainMatch[0].length;

      legacy =
        legacy.slice(0, insertPosition) +
        "\n    clrscr();" +
        legacy.slice(insertPosition);
    }
  }

  // ----------------------------------------------------
  // Remove return 0 because void main() does not need it.
  // ----------------------------------------------------

  legacy = legacy.replace(
    /^\s*return\s+0\s*;\s*$/gm,
    ""
  );

  // ----------------------------------------------------
  // Add getch() before final }.
  // ----------------------------------------------------

  if (!/\bgetch\s*\(\s*\)\s*;/.test(legacy)) {
    const lastBrace =
      legacy.lastIndexOf("}");

    if (lastBrace >= 0) {
      legacy =
        legacy.slice(0, lastBrace) +
        "\n    getch();" +
        "\n" +
        legacy.slice(lastBrace);
    }
  }

  return legacy
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,

    aiProvider: "Gemini",

    aiConfigured:
      Boolean(GEMINI_API_KEY),

    model: GEMINI_MODEL,

    judge0Configured:
      Boolean(process.env.JUDGE0_URL),
  });
});

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

Teach the student clearly and accurately.

If the student asks for a program,
provide a complete runnable program.

${COMMENT_RULE}

After the code, give a short beginner-friendly explanation.

Clearly label:
EXAMPLE INPUT
EXPECTED OUTPUT

Do not claim that you executed the code.
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

// ======================================================
// AI CODE ANALYSIS
// ======================================================

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

Analyze only the following code.

Do not claim that you executed it.

CODE:

\`\`\`
${code}
\`\`\`

Give an easy but accurate explanation.

If there is an error:
1. Identify the error.
2. Explain why it occurs.
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
          "Gemini AI request failed.",
      });
    }
  }
);

// ======================================================
// CODE GENERATOR
// ======================================================
//
// Generates ONE language at a time.
// No multi-language generation.
//
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

      // --------------------------------------------------
      // Validate language
      // --------------------------------------------------

      if (!LANGUAGES[language]) {
        return res.status(400).json({
          error:
            "Choose a supported programming language.",
        });
      }

      // --------------------------------------------------
      // Validate level
      // --------------------------------------------------

      if (!LEVELS.includes(level)) {
        return res.status(400).json({
          error:
            "Choose a valid learning level.",
        });
      }

      // --------------------------------------------------
      // Validate style
      // --------------------------------------------------

      if (!STYLES.includes(codeStyle)) {
        return res.status(400).json({
          error:
            "Choose a valid code style.",
        });
      }

      // --------------------------------------------------
      // Validate programming problem
      // --------------------------------------------------

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
            "Programming request is too long. Maximum 6000 characters.",
        });
      }

      // ==================================================
      // C STYLE RULES
      // ==================================================

      let styleRules = "";

      if (language === "C") {
        if (codeStyle === "Legacy Turbo C") {
          styleRules = `
==================================================
LEGACY TURBO C MODE
==================================================

THIS IS MANDATORY.

Generate classic Turbo C educational C code.

The displayed source MUST use:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    // program logic

    getch();
}

MANDATORY REQUIREMENTS:

1. Use:
   #include <conio.h>

2. Use:
   void main()

3. Use:
   clrscr();

4. Use:
   getch();

5. Use traditional C syntax suitable for old Turbo C.

6. Use #define when useful.

7. Do NOT use:
   int main()

8. Do NOT silently convert the program into modern standard C.

9. Do NOT remove conio.h.

10. Do NOT remove clrscr().

11. Do NOT remove getch().

The learner specifically selected Legacy Turbo C,
so the generated DISPLAYED CODE must look like
classic Turbo C code.

The server will separately transform this code
for modern Judge0 execution.
`;
        } else {
          styleRules = `
==================================================
MODERN STANDARD C MODE
==================================================

Use modern standard C.

Use:

int main(void)

or:

int main()

Use standard C headers.

DO NOT use:
- conio.h
- clrscr()
- getch()
- void main()
`;
        }
      }

      // ==================================================
      // C++ STYLE RULES
      // ==================================================

      else if (language === "C++") {
        if (codeStyle === "Legacy Turbo C") {
          styleRules = `
==================================================
LEGACY TURBO C++ MODE
==================================================

THIS IS MANDATORY.

Generate classic Turbo C++ educational source code.

Use traditional Turbo C++ style.

When appropriate, use classic console constructs such as:

#include <conio.h>
void main()
clrscr();
getch();

The displayed source must look like
old Turbo C++ educational code.

Do NOT silently replace the requested legacy style
with purely modern C++.

The server will separately transform the source
for modern Judge0 execution.
`;
        } else {
          styleRules = `
==================================================
MODERN STANDARD C++ MODE
==================================================

Use modern standard C++.

Use:

int main()

Use standard C++ headers.

DO NOT use:
- conio.h
- clrscr()
- getch()
- void main()
`;
        }
      }

      // ==================================================
      // OTHER LANGUAGES
      // ==================================================

      else {
        styleRules = `
==================================================
${language} MODE
==================================================

Turbo C is only relevant to C and C++.

For ${language}, generate normal valid ${language} syntax.

Do NOT try to insert Turbo C constructs.

PYTHON:
- Use normal Python syntax.
- Use standard input when required.

JAVA:
- Use public class Main.
- Use Scanner or another standard Java input method when required.
- Make the program directly runnable.

JAVASCRIPT:
- Use Node.js.
- Use standard input when input is required.
- Do not use prompt-sync.
- Do not use external packages.
`;
      }

      // ==================================================
      // GEMINI GENERATION PROMPT
      // ==================================================

      const instruction = `
You are generating code for CodeMentor AI.

Generate ONE complete solution only.

==================================================
PROGRAMMING LANGUAGE
==================================================

${language}

==================================================
LEARNER LEVEL
==================================================

${level}

==================================================
SELECTED CODE STYLE
==================================================

${codeStyle}

==================================================
PROGRAMMING PROBLEM
==================================================

${topic.trim()}

==================================================
COMMENT REQUIREMENT
==================================================

${COMMENT_RULE}

==================================================
STYLE REQUIREMENTS
==================================================

${styleRules}

==================================================
GENERAL REQUIREMENTS
==================================================

1. Generate ONLY ${language}.

2. Do not generate another programming language.

3. Solve exactly the requested programming problem.

4. Make the program complete.

5. Make it directly runnable.

6. Use standard input when input is required.

7. Use beginner-friendly logic appropriate for:
   ${level}

8. Add useful comments.

9. Do not put explanations inside the code block.

10. Do not claim that the code was executed.

11. Do not invent actual execution results.

12. Follow the selected code style exactly.

==================================================
VERY IMPORTANT LEGACY RULE
==================================================

If:

Language = C
AND
Selected code style = Legacy Turbo C

then the displayed code MUST contain classic Turbo C style,
including:

#include <conio.h>
void main()
clrscr();
getch();

Do not return modern:

int main()

for Legacy Turbo C C code.

==================================================
RESPONSE FORMAT
==================================================

Return exactly this structure:

=== CODE ===

\`\`\`
COMPLETE PROGRAM
\`\`\`

=== HOW IT WORKS ===

Simple beginner-friendly explanation.

=== EXAMPLE INPUT ===

Example input if required.

=== EXPECTED OUTPUT ===

Expected output for the example.

=== IMPORTANT POINTS ===

Short beginner-friendly bullet points.
`;

      // ==================================================
      // ASK GEMINI
      // ==================================================

      const answer =
        await askAI(instruction);

      // ==================================================
      // EXTRACT CODE
      // ==================================================

      let code =
        extractCode(answer);

      if (!code) {
        throw new Error(
          "Gemini did not return a code block. Please try again."
        );
      }

      // ==================================================
      // GUARANTEE LEGACY STYLE
      // ==================================================

      code =
        enforceLegacyTurboStyle(
          language,
          code,
          codeStyle
        );

      // ==================================================
      // EXPLANATION
      // ==================================================

      const explanation =
        cleanGeneratedExplanation(
          answer
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      res.json({
        code,
        explanation,
        language,
        level,
        codeStyle,
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
// JUDGE0
// ======================================================

function judgeHeaders() {
  const headers = {
    "Content-Type":
      "application/json",
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

// ======================================================
// JUDGE0 FETCH
// ======================================================

async function judgeFetch(
  path,
  options = {}
) {
  const base =
    (process.env.JUDGE0_URL || "")
      .replace(/\/$/, "");

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
// PREPARE LEGACY TURBO C FOR JUDGE0
// ======================================================
//
// Judge0 uses modern GCC/G++.
//
// Turbo C's:
// - conio.h
// - clrscr()
// - getch()
// - void main()
//
// are not directly supported by modern GCC/G++.
//
// Therefore:
// DISPLAYED CODE = original legacy code
//
// JUDGE0 CODE = temporary compatible copy
//
// ======================================================

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

  let runnable = code;

  // ----------------------------------------------------
  // Remove conio.h
  // ----------------------------------------------------

  runnable =
    runnable.replace(
      /^\s*#include\s*[<"]conio\.h[>"]\s*\r?\n?/gim,
      ""
    );

  // ----------------------------------------------------
  // Remove clrscr()
  // ----------------------------------------------------

  runnable =
    runnable.replace(
      /\bclrscr\s*\(\s*\)\s*;?/g,
      ""
    );

  // ----------------------------------------------------
  // Remove getch()
  // ----------------------------------------------------

  runnable =
    runnable.replace(
      /\bgetch\s*\(\s*\)\s*;?/g,
      ""
    );

  // ----------------------------------------------------
  // Convert void main() to int main()
  // ----------------------------------------------------

  runnable =
    runnable.replace(
      /\bvoid\s+main\s*\(\s*\)/,
      "int main()"
    );

  // ----------------------------------------------------
  // Add return 0
  // ----------------------------------------------------

  if (
    /\bint\s+main\s*\(/.test(
      runnable
    ) &&
    !/\breturn\s+0\s*;/.test(
      runnable
    )
  ) {
    const lastBrace =
      runnable.lastIndexOf("}");

    if (lastBrace >= 0) {
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
  }

  return runnable.trim();
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

  // ----------------------------------------------------
  // Prepare code
  // ----------------------------------------------------

  const sourceCode =
    prepareLegacyTurboCode(
      language,
      code,
      codeStyle
    );

  // ----------------------------------------------------
  // Submit to Judge0
  // ----------------------------------------------------

  const submit =
    await judgeFetch(
      "/submissions/?base64_encoded=false&wait=false",
      {
        method: "POST",

        body: JSON.stringify({
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

  const resultData =
    await submit.json();

  const token =
    resultData.token;

  if (!token) {
    throw new Error(
      "Judge0 did not return a submission token."
    );
  }

  // ----------------------------------------------------
  // Poll for result
  // ----------------------------------------------------

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

    if (!result.ok) {
      throw new Error(
        `Judge0 result failed (${result.status}).`
      );
    }

    const data =
      await result.json();

    // Status IDs:
    // 1 = In Queue
    // 2 = Processing
    // >2 = Finished

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

// ======================================================
// CODE EXECUTION API
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
        typeof code !== "string"
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
          typeof stdin === "string"
            ? stdin
            : "",
          codeStyle ||
            "Modern Standard"
        );

      // ------------------------------------------------
      // Return ONLY REAL Judge0 results.
      // ------------------------------------------------

      res.json({
        status:
          result.status?.description ||
          "Unknown",

        stdout:
          result.stdout || "",

        stderr:
          result.stderr || "",

        compileOutput:
          result.compile_output ||
          "",

        message:
          result.message || "",

        time:
          result.time || null,

        memory:
          result.memory || null,

        token:
          result.token || null,
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
// START SERVER
// ======================================================

app.listen(
  PORT,
  () => {
    console.log(
      `CodeMentor AI server running on http://localhost:${PORT}`
    );

    console.log(
      "AI Provider: Gemini"
    );

    console.log(
      `Gemini Model: ${GEMINI_MODEL}`
    );

    console.log(
      `Gemini configured: ${Boolean(
        GEMINI_API_KEY
      )}`
    );

    console.log(
      `Judge0 configured: ${Boolean(
        process.env.JUDGE0_URL
      )}`
    );
  }
);