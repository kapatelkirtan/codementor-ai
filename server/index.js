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
// JSON BODY
// ======================================================

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

// ======================================================
// LEVELS
// ======================================================

const LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

// ======================================================
// CODE STYLES
// ======================================================

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

The learner can select:

- Beginner
- Intermediate
- Advanced

The learner can select:

- Modern Standard
- Legacy Turbo C

==================================================
LEGACY TURBO C
==================================================

When Legacy Turbo C is selected for C, the SOURCE CODE
should look like classic Turbo C educational code.

Preferred structure:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

Do not use modern int main(void) when Legacy Turbo C
is selected for C.

Do not remove conio.h.

Do not remove clrscr().

Do not remove getch().

==================================================
LEGACY TURBO C++
==================================================

When Legacy Turbo C is selected for C++, the SOURCE CODE
should look like classic Turbo C++ educational code.

Preferred structure:

#include <iostream.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

Do not use modern int main() when Legacy Turbo C++
is selected.

==================================================
MODERN STANDARD
==================================================

When Modern Standard is selected:

C must use standard modern C.

C++ must use standard modern C++.

Do not use:

conio.h
clrscr()
getch()
void main()

==================================================
OTHER LANGUAGES
==================================================

Python, Java and JavaScript do not use Turbo C syntax.

For Python, Java and JavaScript always generate normal
valid code.

==================================================
EXECUTION
==================================================

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

Add useful beginner-friendly comments to important
source-code statements whenever the language permits it.

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

Use correct comment syntax.

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
    throw new Error("Gemini returned an empty response.");
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

  // First try a Markdown code block.
  const match = text.match(
    /```(?:[a-zA-Z0-9_+#.-]+)?\s*([\s\S]*?)```/
  );

  if (match) {
    return match[1].trim();
  }

  // Try === CODE === section.
  const codeMarker = text.match(
    /===\s*CODE\s*===([\s\S]*?)(?:===\s*HOW IT WORKS\s*===|$)/i
  );

  if (codeMarker) {
    return codeMarker[1]
      .replace(/```/g, "")
      .trim();
  }

  return text
    .replace(/^===\s*CODE\s*===/i, "")
    .trim();
}

// ======================================================
// REMOVE MARKDOWN CODE BLOCK
// ======================================================

function removeMarkdownCode(text) {
  return String(text || "").replace(
    /```[\s\S]*?```/g,
    ""
  );
}

// ======================================================
// CLEAN GENERATED EXPLANATION
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
// CLEAN SOURCE CODE
// ======================================================

function cleanSourceCode(code) {
  return String(code || "")
    .replace(
      /^```[a-zA-Z0-9_+#.-]*\s*/i,
      ""
    )
    .replace(
      /\s*```$/i,
      ""
    )
    .trim();
}

// ======================================================
// FORCE LEGACY TURBO C
// ======================================================

function forceLegacyTurboC(code) {
  let result = cleanSourceCode(code);

  // ----------------------------------------------------
  // Remove existing conio.h first.
  // It will be added again in the correct position.
  // ----------------------------------------------------

  result = result.replace(
    /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
    ""
  );

  // ----------------------------------------------------
  // Make sure stdio.h exists when required.
  // ----------------------------------------------------

  const usesStdio =
    /\bprintf\s*\(/i.test(result) ||
    /\bscanf\s*\(/i.test(result) ||
    /\bfprintf\s*\(/i.test(result) ||
    /\bfscanf\s*\(/i.test(result);

  if (
    usesStdio &&
    !/#include\s*<stdio\.h>/i.test(result)
  ) {
    result =
      "#include <stdio.h>\n" +
      result;
  }

  // ----------------------------------------------------
  // Make sure conio.h exists.
  // ----------------------------------------------------

  if (
    !/#include\s*<conio\.h>/i.test(result)
  ) {
    const includeBlock =
      result.match(
        /^(?:\s*#include[^\n]*\r?\n)+/i
      );

    if (includeBlock) {
      result =
        includeBlock[0] +
        "#include <conio.h>\n" +
        result.slice(
          includeBlock[0].length
        );
    } else {
      result =
        "#include <conio.h>\n" +
        result;
    }
  }

  // ----------------------------------------------------
  // Convert modern main functions.
  // ----------------------------------------------------

  result = result.replace(
    /\bint\s+main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  result = result.replace(
    /\bint\s+main\s*\(\s*int\s+argc\s*,[\s\S]*?\)/i,
    "void main()"
  );

  // ----------------------------------------------------
  // Convert plain main() if Gemini generated it.
  // ----------------------------------------------------

  result = result.replace(
    /(?<!\w)main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  // ----------------------------------------------------
  // Ensure clrscr().
  // ----------------------------------------------------

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

  // ----------------------------------------------------
  // Remove modern return 0.
  // ----------------------------------------------------

  result = result.replace(
    /^\s*return\s+0\s*;\s*$/gim,
    ""
  );

  // ----------------------------------------------------
  // Ensure getch().
  // ----------------------------------------------------

  if (
    !/\bgetch\s*\(\s*\)\s*;/i.test(result)
  ) {
    const lastBrace =
      result.lastIndexOf("}");

    if (lastBrace !== -1) {
      result =
        result.slice(
          0,
          lastBrace
        ) +
        "\n    getch();\n" +
        result.slice(lastBrace);
    }
  }

  return result
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ======================================================
// FORCE LEGACY TURBO C++
// ======================================================

function forceLegacyTurboCpp(code) {
  let result = cleanSourceCode(code);

  // ----------------------------------------------------
  // Convert modern iostream.
  // ----------------------------------------------------

  result = result.replace(
    /#include\s*<iostream>/gi,
    "#include <iostream.h>"
  );

  // ----------------------------------------------------
  // Add iostream.h if cin/cout are used.
  // ----------------------------------------------------

  const usesIO =
    /\bcout\s*<</i.test(result) ||
    /\bcin\s*>>/i.test(result);

  if (
    usesIO &&
    !/#include\s*<iostream\.h>/i.test(result)
  ) {
    result =
      "#include <iostream.h>\n" +
      result;
  }

  // ----------------------------------------------------
  // Remove existing conio.h.
  // ----------------------------------------------------

  result = result.replace(
    /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
    ""
  );

  // ----------------------------------------------------
  // Add conio.h.
  // ----------------------------------------------------

  if (
    !/#include\s*<conio\.h>/i.test(result)
  ) {
    const includeBlock =
      result.match(
        /^(?:\s*#include[^\n]*\r?\n)+/i
      );

    if (includeBlock) {
      result =
        includeBlock[0] +
        "#include <conio.h>\n" +
        result.slice(
          includeBlock[0].length
        );
    } else {
      result =
        "#include <conio.h>\n" +
        result;
    }
  }

  // ----------------------------------------------------
  // Convert modern main().
  // ----------------------------------------------------

  result = result.replace(
    /\bint\s+main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  result = result.replace(
    /(?<!\w)main\s*\(\s*(?:void)?\s*\)/i,
    "void main()"
  );

  // ----------------------------------------------------
  // Ensure clrscr().
  // ----------------------------------------------------

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

  // ----------------------------------------------------
  // Remove return 0.
  // ----------------------------------------------------

  result = result.replace(
    /^\s*return\s+0\s*;\s*$/gim,
    ""
  );

  // ----------------------------------------------------
  // Ensure getch().
  // ----------------------------------------------------

  if (
    !/\bgetch\s*\(\s*\)\s*;/i.test(result)
  ) {
    const lastBrace =
      result.lastIndexOf("}");

    if (lastBrace !== -1) {
      result =
        result.slice(
          0,
          lastBrace
        ) +
        "\n    getch();\n" +
        result.slice(lastBrace);
    }
  }

  return result
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ======================================================
// APPLY SELECTED STYLE
// ======================================================

function applySelectedCodeStyle(
  language,
  code,
  codeStyle
) {
  const cleaned =
    cleanSourceCode(code);

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

  // Turbo C style does not apply to:
  // Python
  // Java
  // JavaScript

  return cleaned;
}

// ======================================================
// HEALTH CHECK
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
        Boolean(
          process.env.JUDGE0_URL
        ),
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

If the student asks for a program, provide a complete
runnable program in the selected language.

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
      // VALIDATE LANGUAGE
      // --------------------------------------------------

      if (!LANGUAGES[language]) {
        return res.status(400).json({
          error:
            "Choose a supported programming language.",
        });
      }

      // --------------------------------------------------
      // VALIDATE LEVEL
      // --------------------------------------------------

      if (!LEVELS.includes(level)) {
        return res.status(400).json({
          error:
            "Choose a valid learning level.",
        });
      }

      // --------------------------------------------------
      // VALIDATE STYLE
      // --------------------------------------------------

      if (!STYLES.includes(codeStyle)) {
        return res.status(400).json({
          error:
            "Choose a valid code style.",
        });
      }

      // --------------------------------------------------
      // VALIDATE TOPIC
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
      // STYLE RULES
      // --------------------------------------------------

      let styleRules = "";

      // ==================================================
      // C
      // ==================================================

      if (language === "C") {
        if (
          codeStyle ===
          "Legacy Turbo C"
        ) {
          styleRules = `
LEGACY TURBO C MODE IS ACTIVE.

The SOURCE CODE must visibly look like classic
Turbo C educational code.

Use:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

The source MUST use:

void main()

The source MUST contain:

#include <conio.h>
clrscr();
getch();

Do NOT use:

int main(void)
int main()

Do not silently return modern C and label it Turbo C.
`;
        } else {
          styleRules = `
MODERN STANDARD C MODE IS ACTIVE.

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

      // ==================================================
      // C++
      // ==================================================

      if (language === "C++") {
        if (
          codeStyle ===
          "Legacy Turbo C"
        ) {
          styleRules = `
LEGACY TURBO C++ MODE IS ACTIVE.

The SOURCE CODE must visibly look like classic
Turbo C++ educational code.

Use:

#include <iostream.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

The source MUST use:

void main()

The source MUST contain:

#include <conio.h>
clrscr();
getch();

Do NOT use:

int main()

Do not silently return modern C++ and label it Turbo C++.
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

      // ==================================================
      // PYTHON
      // ==================================================

      if (language === "Python") {
        styleRules = `
Generate normal valid Python.

Turbo C concepts do not apply to Python.
`;
      }

      // ==================================================
      // JAVA
      // ==================================================

      if (language === "Java") {
        styleRules = `
Generate normal valid Java.

Use:

public class Main

Do not use Turbo C syntax.
`;
      }

      // ==================================================
      // JAVASCRIPT
      // ==================================================

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
      // GENERATION PROMPT
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

10. Follow the selected code style.

11. If Legacy Turbo C is selected for C or C++,
the SOURCE CODE must visibly use classic Turbo C syntax.

12. Do not return modern C code when Legacy Turbo C
is selected.

13. Do not return modern C++ code when Legacy Turbo C
is selected.

Return exactly:

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
      // FORCE THE SELECTED STYLE
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
// PREPARE LEGACY TURBO CODE FOR JUDGE0
// ======================================================
//
// The displayed code remains Legacy Turbo C.
//
// Only the copy sent to Judge0 is converted.
//
// Turbo C:
// conio.h      -> removed
// clrscr()     -> removed
// getch()      -> removed
// void main()  -> int main()
//
// Turbo C++:
// iostream.h   -> iostream
// conio.h      -> removed
// clrscr()     -> removed
// getch()      -> removed
// void main()  -> int main()
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

  runnable = runnable.replace(
    /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
    ""
  );

  // ----------------------------------------------------
  // Turbo C++ iostream.h -> modern iostream
  // ----------------------------------------------------

  if (language === "C++") {
    runnable = runnable.replace(
      /#include\s*<iostream\.h>/gi,
      "#include <iostream>"
    );
  }

  // ----------------------------------------------------
  // Remove clrscr()
  // ----------------------------------------------------

  runnable = runnable.replace(
    /\bclrscr\s*\(\s*\)\s*;?/gi,
    ""
  );

  // ----------------------------------------------------
  // Remove getch()
  // ----------------------------------------------------

  runnable = runnable.replace(
    /\bgetch\s*\(\s*\)\s*;?/gi,
    ""
  );

  // ----------------------------------------------------
  // Convert void main() -> int main()
  // ----------------------------------------------------

  runnable = runnable.replace(
    /\bvoid\s+main\s*\(\s*\)/i,
    "int main()"
  );

  // ----------------------------------------------------
  // Ensure return 0.
  // ----------------------------------------------------

  if (
    !/\breturn\s+0\s*;/i.test(
      runnable
    )
  ) {
    const lastBrace =
      runnable.lastIndexOf("}");

    if (lastBrace !== -1) {
      runnable =
        runnable.slice(
          0,
          lastBrace
        ) +
        "\n    return 0;\n" +
        runnable.slice(lastBrace);
    }
  }

  return runnable
    .replace(/\n{3,}/g, "\n\n")
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
  // Create the Judge0-compatible source.
  // ----------------------------------------------------

  const sourceCode =
    prepareLegacyTurboCode(
      language,
      code,
      codeStyle
    );

  // ----------------------------------------------------
  // Submit
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

    // Judge0 status IDs:
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
      // Return only real Judge0 result data.
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