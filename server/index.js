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
// GEMINI
// ======================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

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
// AI SYSTEM PROMPT
// ======================================================

const SYSTEM_PROMPT = `
You are CodeMentor AI, an expert programming teacher.

Teach C, C++, Python, Java and JavaScript accurately.

The learner may select:
- Beginner
- Intermediate
- Advanced

The learner may also select:
- Modern Standard
- Legacy Turbo C

IMPORTANT:

When Legacy Turbo C is selected for C:

The generated SOURCE CODE itself must look like classic Turbo C.

It should use classic Turbo C conventions when appropriate, such as:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    ...

    getch();
}

Do not automatically convert Legacy Turbo C C code into modern int main(void).

When Legacy Turbo C is selected for C++, the generated SOURCE CODE should look like classic Turbo C++ educational code and may use:

#include <iostream.h>
#include <conio.h>

void main()
{
    clrscr();

    ...

    getch();
}

When Modern Standard is selected:

C must use standard modern C.
C++ must use standard modern C++.
Do not use conio.h, clrscr(), getch(), or void main().

Python, Java and JavaScript do not have Turbo C syntax.
For those languages, always generate normal valid code.

Never claim that code was executed.

Never invent actual execution results.

The Code Lab uses Judge0 for actual execution.

Be practical, accurate and beginner-friendly.
`;

// ======================================================
// COMMENT RULE
// ======================================================

const COMMENT_RULE = `
COMMENTING REQUIREMENT:

The learner is a beginner.

Add useful beginner-friendly comments to important source-code statements whenever the language permits it.

Explain important:
- declarations
- imports/includes
- input
- variables
- assignments
- calculations
- conditions
- loops
- functions/classes
- output
- important return statements

Keep comments short and useful.

Do not add meaningless comments to blank lines.

Use correct comment syntax:

Python:
#

C:
//

C++:
//

Java:
//

JavaScript:
//

The code must remain valid after comments are added.
`;

// ======================================================
// REQUIRE GEMINI
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
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return text.trim();
}

// ======================================================
// CODE EXTRACTION
// ======================================================

function extractCode(text) {
  if (!text) {
    return "";
  }

  const matches = [
    ...text.matchAll(
      /```(?:[a-zA-Z0-9_+#.-]+)?\s*\n?([\s\S]*?)```/g
    ),
  ];

  if (matches.length) {
    return matches[0][1].trim();
  }

  return text
    .replace(/^===\s*CODE\s*===/i, "")
    .replace(/^Here is.*?:/i, "")
    .trim();
}

// ======================================================
// REMOVE MARKDOWN CODE BLOCK
// ======================================================

function removeMarkdownCode(text) {
  return text.replace(
    /```[\s\S]*?```/g,
    ""
  );
}

// ======================================================
// CLEAN EXPLANATION
// ======================================================

function cleanGeneratedExplanation(text) {
  if (!text) {
    return "";
  }

  const withoutCode =
    removeMarkdownCode(text);

  const markerIndex =
    withoutCode.search(
      /===\s*HOW IT WORKS\s*===/i
    );

  if (markerIndex >= 0) {
    return withoutCode
      .slice(markerIndex)
      .replace(
        /^===\s*HOW IT WORKS\s*===/i,
        "HOW IT WORKS"
      )
      .trim();
  }

  return withoutCode
    .replace(
      /^===\s*CODE\s*===/i,
      ""
    )
    .trim();
}

// ======================================================
// FORCE LEGACY TURBO C SOURCE FORMAT
// ======================================================

function forceLegacyTurboC(code) {
  let result = code.trim();

  // Remove markdown if Gemini accidentally returned it.
  result = result
    .replace(/^```[a-zA-Z0-9_+#.-]*\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // ----------------------------------------------------
  // C standard header -> Turbo C headers
  // ----------------------------------------------------

  if (
    /#include\s*<stdio\.h>/i.test(result) &&
    !/#include\s*<conio\.h>/i.test(result)
  ) {
    result =
      result.replace(
        /#include\s*<stdio\.h>/i,
        "#include <stdio.h>\n#include <conio.h>"
      );
  }

  // ----------------------------------------------------
  // If stdio.h is missing but printf/scanf are used
  // ----------------------------------------------------

  if (
    (/\bprintf\s*\(/.test(result) ||
      /\bscanf\s*\(/.test(result)) &&
    !/#include\s*<stdio\.h>/i.test(result)
  ) {
    result =
      "#include <stdio.h>\n" + result;
  }

  // ----------------------------------------------------
  // Add conio.h
  // ----------------------------------------------------

  if (!/#include\s*<conio\.h>/i.test(result)) {
    const includeMatch =
      result.match(
        /^(?:#include[^\n]+\n)+/i
      );

    if (includeMatch) {
      result =
        includeMatch[0] +
        "#include <conio.h>\n" +
        result.slice(
          includeMatch[0].length
        );
    } else {
      result =
        "#include <conio.h>\n" +
        result;
    }
  }

  // ----------------------------------------------------
  // Convert modern main to Turbo C main
  // ----------------------------------------------------

  result = result.replace(
    /\bint\s+main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  result = result.replace(
    /\bint\s+main\s*\(\s*int\s+argc\s*,[\s\S]*?\)/i,
    "void main()"
  );

  result = result.replace(
    /\bint\s+main\s*\(\s*\)/i,
    "void main()"
  );

  // ----------------------------------------------------
  // Add clrscr() after opening main brace
  // ----------------------------------------------------

  if (!/\bclrscr\s*\(\s*\)\s*;/i.test(result)) {
    const mainPattern =
      /void\s+main\s*\(\s*\)\s*\{/i;

    if (mainPattern.test(result)) {
      result =
        result.replace(
          mainPattern,
          "void main()\n{\n    clrscr();"
        );
    }
  }

  // ----------------------------------------------------
  // Remove modern return 0 from main
  // ----------------------------------------------------

  result = result.replace(
    /^\s*return\s+0\s*;\s*$/gmi,
    ""
  );

  // ----------------------------------------------------
  // Add getch() before final closing brace
  // ----------------------------------------------------

  if (!/\bgetch\s*\(\s*\)\s*;/i.test(result)) {
    const lastBrace =
      result.lastIndexOf("}");

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

// ======================================================
// FORCE LEGACY TURBO C++ SOURCE FORMAT
// ======================================================

function forceLegacyTurboCpp(code) {
  let result = code.trim();

  result = result
    .replace(/^```[a-zA-Z0-9_+#.-]*\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // ----------------------------------------------------
  // Add Turbo C++ console header
  // ----------------------------------------------------

  if (!/#include\s*<conio\.h>/i.test(result)) {
    const includeMatch =
      result.match(
        /^(?:#include[^\n]+\n)+/i
      );

    if (includeMatch) {
      result =
        includeMatch[0] +
        "#include <conio.h>\n" +
        result.slice(
          includeMatch[0].length
        );
    } else {
      result =
        "#include <conio.h>\n" +
        result;
    }
  }

  // ----------------------------------------------------
  // Convert modern iostream to classic Turbo C++ style
  // ----------------------------------------------------

  result = result.replace(
    /#include\s*<iostream>/gi,
    "#include <iostream.h>"
  );

  // ----------------------------------------------------
  // Convert main
  // ----------------------------------------------------

  result = result.replace(
    /\bint\s+main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  result = result.replace(
    /\bint\s+main\s*\(\s*\)/i,
    "void main()"
  );

  // ----------------------------------------------------
  // Add clrscr()
  // ----------------------------------------------------

  if (!/\bclrscr\s*\(\s*\)\s*;/i.test(result)) {
    const mainPattern =
      /void\s+main\s*\(\s*\)\s*\{/i;

    if (mainPattern.test(result)) {
      result =
        result.replace(
          mainPattern,
          "void main()\n{\n    clrscr();"
        );
    }
  }

  // ----------------------------------------------------
  // Remove return 0
  // ----------------------------------------------------

  result = result.replace(
    /^\s*return\s+0\s*;\s*$/gmi,
    ""
  );

  // ----------------------------------------------------
  // Add getch()
  // ----------------------------------------------------

  if (!/\bgetch\s*\(\s*\)\s*;/i.test(result)) {
    const lastBrace =
      result.lastIndexOf("}");

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

// ======================================================
// FORCE SELECTED STYLE
// ======================================================

function applySelectedCodeStyle(
  language,
  code,
  codeStyle
) {
  if (
    codeStyle !== "Legacy Turbo C"
  ) {
    return code;
  }

  if (language === "C") {
    return forceLegacyTurboC(code);
  }

  if (language === "C++") {
    return forceLegacyTurboCpp(code);
  }

  // Turbo C is not applicable to these languages.
  return code;
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
        Boolean(GEMINI_API_KEY),

      model:
        GEMINI_MODEL,

      judge0Configured:
        Boolean(process.env.JUDGE0_URL),
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

If the student asks for a program, provide a complete runnable program in the selected language.

${COMMENT_RULE}

After code, give a short beginner-friendly explanation.

Clearly label:
EXAMPLE INPUT
EXPECTED OUTPUT

Do not claim you executed the code.
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

Analyze only this code.

Do not claim that you executed it.

CODE:

\`\`\`
${code}
\`\`\`

Give an easy but accurate explanation.

If there is an error:
1. Identify the error.
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
          "Gemini AI request failed.",
      });
    }
  }
);

// ======================================================
// ONE-LANGUAGE CODE GENERATOR
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
      // Validate topic
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

      // --------------------------------------------------
      // STYLE INSTRUCTIONS
      // --------------------------------------------------

      let styleRules = "";

      if (language === "C") {
        if (
          codeStyle ===
          "Legacy Turbo C"
        ) {
          styleRules = `
LEGACY TURBO C MODE IS ACTIVE.

This is extremely important.

Generate CLASSIC TURBO C SOURCE CODE.

The displayed source MUST use:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

Prefer classic Turbo C educational syntax.

Do NOT use:

int main(void)

Do NOT use:

int main()

Do NOT remove conio.h.

Do NOT remove clrscr().

Do NOT remove getch().

Do NOT generate only modern C and call it Turbo C.

The final source code must visibly contain the classic Turbo C style.
`;
        } else {
          styleRules = `
MODERN STANDARD C MODE IS ACTIVE.

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

      if (language === "C++") {
        if (
          codeStyle ===
          "Legacy Turbo C"
        ) {
          styleRules = `
LEGACY TURBO C++ MODE IS ACTIVE.

Generate classic Turbo C++ educational source code.

Use classic-style console programming where appropriate.

The source should visibly contain:

#include <conio.h>

void main()
{
    clrscr();

    ...

    getch();
}

Do not use modern int main() when Legacy Turbo C++ is selected.

Do not silently convert the result to modern C++.
`;
        } else {
          styleRules = `
MODERN STANDARD C++ MODE IS ACTIVE.

Use standard modern C++.

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

      if (language === "Python") {
        styleRules = `
Generate normal valid Python.

Turbo C concepts do not apply to Python.
`;
      }

      if (language === "Java") {
        styleRules = `
Generate normal valid Java.

Use:

public class Main

Do not use Turbo C syntax.
`;
      }

      if (language === "JavaScript") {
        styleRules = `
Generate normal Node.js JavaScript.

Use standard input when input is required.

Do not use:
prompt-sync
external npm packages
browser-only prompt()

Use built-in Node.js functionality.
`;
      }

      // --------------------------------------------------
      // GEMINI GENERATION PROMPT
      // --------------------------------------------------

      const instruction = `
Generate ONE complete programming solution.

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
STYLE REQUIREMENTS
==================================================

${styleRules}

==================================================
COMMENT REQUIREMENTS
==================================================

${COMMENT_RULE}

==================================================
IMPORTANT GENERATION RULES
==================================================

1. Generate ONLY ${language}.

2. Do not generate another programming language.

3. Solve exactly the requested problem.

4. Make the program complete.

5. Make it appropriate for ${level} level.

6. Use standard input for input-based programs.

7. Include beginner-friendly comments.

8. Do not claim that the program was executed.

9. Do not invent actual execution results.

10. Follow the selected code style exactly.

11. If Legacy Turbo C is selected for C or C++,
the SOURCE CODE must visibly use classic Turbo C style.

12. Do not return modern C code when Legacy Turbo C is selected.

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

Short bullet points.
`;

      // --------------------------------------------------
      // ASK GEMINI
      // --------------------------------------------------

      const answer =
        await askAI(instruction);

      // --------------------------------------------------
      // EXTRACT CODE
      // --------------------------------------------------

      let code =
        extractCode(answer);

      if (!code) {
        throw new Error(
          "Gemini did not return a code block. Please try again."
        );
      }

      // --------------------------------------------------
      // IMPORTANT:
      // FORCE LEGACY STYLE AFTER GEMINI
      // --------------------------------------------------

      code =
        applySelectedCodeStyle(
          language,
          code,
          codeStyle
        );

      // --------------------------------------------------
      // EXPLANATION
      // --------------------------------------------------

      const explanation =
        cleanGeneratedExplanation(
          answer
        );

      // --------------------------------------------------
      // RETURN RESULT
      // --------------------------------------------------

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
  const base =
    (
      process.env.JUDGE0_URL ||
      ""
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

// ======================================================
// TURBO C COMPATIBILITY FOR JUDGE0
// ======================================================
//
// IMPORTANT:
//
// The user sees classic Turbo C source code.
//
// Judge0 uses modern GCC/G++.
//
// Therefore only the COPY sent to Judge0 is converted.
//
// The displayed generated code remains Turbo C style.
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

  let runnable = code;

  // ----------------------------------------------------
  // Remove conio.h
  // ----------------------------------------------------

  runnable =
    runnable.replace(
      /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
      ""
    );

  // ----------------------------------------------------
  // Remove clrscr()
  // ----------------------------------------------------

  runnable =
    runnable.replace(
      /\bclrscr\s*\(\s*\)\s*;?/gi,
      ""
    );

  // ----------------------------------------------------
  // Remove getch()
  // ----------------------------------------------------

  runnable =
    runnable.replace(
      /\bgetch\s*\(\s*\)\s*;?/gi,
      ""
    );

  // ----------------------------------------------------
  // Convert void main() to int main()
  // ----------------------------------------------------

  runnable =
    runnable.replace(
      /\bvoid\s+main\s*\(\s*\)/i,
      "int main()"
    );

  // ----------------------------------------------------
  // Add return 0 before final brace
  // ----------------------------------------------------

  if (
    !/\breturn\s+0\s*;/i.test(
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
        runnable.slice(lastBrace);
    }
  }

  // ----------------------------------------------------
  // Turbo C++ compatibility
  // ----------------------------------------------------

  if (language === "C++") {
    runnable =
      runnable.replace(
        /#include\s*<iostream\.h>/gi,
        "#include <iostream>"
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
          language_id:
            lang.id,

          source_code:
            sourceCode,

          stdin:
            stdin || "",

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

  const {
    token,
  } = await submit.json();

  if (!token) {
    throw new Error(
      "Judge0 did not return a submission token."
    );
  }

  // ----------------------------------------------------
  // Poll Judge0
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
// CODE EXECUTION ROUTE
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
          error: "Code is required.",
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
// SERVER
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
      `Judge0 URL: ${
        process.env.JUDGE0_URL ||
        "Not configured"
      }`
    );
  }
);