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
// GEMINI CONFIG
// ======================================================

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.5-flash-lite";

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
// LEVELS FOR CODE GENERATOR
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
// ALGORITHM LEVELS
// ======================================================

const ALGORITHM_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advance",
];

// ======================================================
// AI SYSTEM PROMPT
// ======================================================

const SYSTEM_PROMPT = `
You are CodeMentor AI.

You are an expert programming teacher and computer
science algorithm teacher.

Supported programming languages:

C
C++
Python
Java
JavaScript

You teach beginners, intermediate students and advanced
students.

Always prefer accurate, easy-to-understand explanations.

==================================================
ALGORITHM TEACHING
==================================================

When teaching an algorithm:

1. Explain what the algorithm means.
2. Explain what problem it solves.
3. Explain why it is used.
4. Explain the basic idea in very easy language.
5. Explain important variables.
6. Explain the steps one by one.
7. Give a small example.
8. Explain the result.
9. Give time complexity when appropriate.
10. Give space complexity when appropriate.
11. Give important exam points.
12. Avoid unnecessarily difficult language.

==================================================
ALGORITHM GENERATOR
==================================================

When the user asks to generate an algorithm, generate
ONLY an algorithm.

Do not automatically generate a programming-language
program.

The algorithm should be suitable for writing in a
college examination or notebook.

Use this structure:

ALGORITHM: <name>

PURPOSE:
<short and simple explanation>

VARIABLES:

(i) <variable> : <meaning>
(ii) <variable> : <meaning>
(iii) <variable> : <meaning>

STEPS:

Step-1:
<step>

Step-2:
<step>

Step-3:
<step>

PSEUDOCODE:

<clean pseudocode>

EXAMPLE:

<small example when useful>

EXPECTED RESULT:

<result>

TIME COMPLEXITY:

<complexity>

SPACE COMPLEXITY:

<complexity>

IMPORTANT POINTS:

- ...
- ...

The result should look like a clean college algorithm
notebook/notes format.

Use simple algorithm notation such as:

IF ... THEN
END IF

FOR ... DO
END FOR

WHILE ... DO
END WHILE

ARR[i] <- VALUE

RETURN

FINISH

Do not turn the answer into a long essay.

==================================================
ALGORITHM RUNNER CODE
==================================================

When code for an algorithm is requested separately,
generate a complete runnable program.

Use standard input where input is required.

Include useful beginner comments.

==================================================
LEGACY TURBO C
==================================================

When Legacy Turbo C is selected for C, the displayed
source code must visibly look like classic Turbo C.

It should contain:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

Do not use:

int main(void)
int main()

==================================================
LEGACY TURBO C++
==================================================

When Legacy Turbo C is selected for C++, the displayed
source code must visibly look like classic Turbo C++.

It should contain:

#include <iostream.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

Do not use modern int main().

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

Always use normal valid syntax.

==================================================
EXECUTION
==================================================

Never claim that code was executed unless actual
execution data is supplied by the execution system.

Never invent execution output.

Judge0 is used for actual code execution.
`;

// ======================================================
// COMMENT RULE
// ======================================================

const COMMENT_RULE = `
COMMENTING REQUIREMENT:

The learner is a student.

Add short, useful beginner-friendly comments to
important source-code statements.

Comment important:

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

Use correct comment syntax for the selected language.

Do not add meaningless comments.

Keep comments concise.
`;

// ======================================================
// AI CONFIGURATION CHECK
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

  const response = await fetch(
    GEMINI_URL,
    {
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
// REMOVE MARKDOWN CODE BLOCKS
// ======================================================

function removeMarkdownCode(text) {
  return String(text || "")
    .replace(
      /```[a-zA-Z0-9_+#.-]*\s*/g,
      ""
    )
    .replace(/```/g, "")
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

  return source
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
// CLEAN EXPLANATION
// ======================================================

function cleanGeneratedExplanation(
  text
) {
  if (!text) {
    return "";
  }

  const clean =
    String(text).replace(
      /```[\s\S]*?```/g,
      ""
    );

  const markerIndex =
    clean.search(
      /===\s*HOW IT WORKS\s*===/i
    );

  if (markerIndex >= 0) {
    return clean
      .slice(markerIndex)
      .replace(
        /^===\s*HOW IT WORKS\s*===/i,
        "HOW IT WORKS"
      )
      .trim();
  }

  return clean
    .replace(
      /^===\s*CODE\s*===/i,
      ""
    )
    .trim();
}

// ======================================================
// CONVERT MAIN TO TURBO C MAIN
// ======================================================

function convertMainToVoidMain(
  code
) {
  let result = code;

  result = result.replace(
    /\bint\s+main\s*\(\s*void\s*\)/i,
    "void main()"
  );

  result = result.replace(
    /\bint\s+main\s*\(\s*\)/i,
    "void main()"
  );

  result = result.replace(
    /\bint\s+main\s*\(\s*int[\s\S]*?\)/i,
    "void main()"
  );

  return result;
}

// ======================================================
// ADD clrscr() AND getch()
// ======================================================

function addLegacyMainStatements(
  code
) {
  let result = code;

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
    if (result[i] === "{") {
      depth++;
    }

    if (result[i] === "}") {
      depth--;

      if (depth === 0) {
        closeBrace = i;
        break;
      }
    }
  }

  if (closeBrace === -1) {
    return result;
  }

  let body =
    result.slice(
      openBrace + 1,
      closeBrace
    );

  body = body.replace(
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
  } else {
    body =
      body.trimEnd() +
      "\n";
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
// FORCE LEGACY TURBO C
// ======================================================

function forceLegacyTurboC(
  code
) {
  let result =
    cleanSourceCode(code);

  result = result.replace(
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
        result.slice(insertAt);
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
// FORCE LEGACY TURBO C++
// ======================================================

function forceLegacyTurboCpp(
  code
) {
  let result =
    cleanSourceCode(code);

  result = result.replace(
    /#include\s*<iostream>/gi,
    "#include <iostream.h>"
  );

  result = result.replace(
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
// APPLY CODE STYLE
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

  if (language === "C") {
    return forceLegacyTurboC(
      cleaned
    );
  }

  if (language === "C++") {
    return forceLegacyTurboCpp(
      cleaned
    );
  }

  return cleaned;
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
        typeof question !== "string" ||
        !question.trim()
      ) {
        return res.status(400).json({
          error:
            "Enter a question.",
        });
      }

      if (
        question.length > 6000
      ) {
        return res.status(400).json({
          error:
            "Question is too long. Maximum 6000 characters.",
        });
      }

      const instruction = `
Programming language:
${language || "General programming"}

Learning level:
${level || "Beginner"}

Algorithm Teacher Mode:
${algorithmMode ? "YES" : "NO"}

Student question:
${question.trim()}

${
  algorithmMode
    ? `
This is an algorithm-teaching question.

Teach the algorithm in very easy language.

Use these sections when appropriate:

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
`
    : `
This is a normal programming-teaching question.

Explain the programming concept clearly and simply.
`
}

If the student requests a program, provide a complete
runnable program in the selected language.

${COMMENT_RULE}

Do not claim that you executed code.
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
          "Gemini AI request failed.",
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
        typeof topic !== "string" ||
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
            "Choose a valid algorithm mode.",
        });
      }

      let instruction = "";

      if (mode === "teach") {
        instruction = `
Teach the following algorithm to a
${level || "Beginner"} student:

${topic.trim()}

Use extremely simple language.

Explain:

1. Algorithm name
2. What it means
3. What problem it solves
4. Why it is used
5. Simple idea
6. Important variables
7. Step-by-step process
8. Small example
9. Time complexity
10. Space complexity
11. Important exam points
`;
      }

      if (mode === "explain") {
        instruction = `
Explain this algorithm to a
${level || "Beginner"} student:

${topic.trim()}

Assume the student has never studied this topic before.

Use simple language and an easy example.
`;
      }

      if (mode === "practice") {
        instruction = `
Create an algorithm practice problem about:

${topic.trim()}

Student level:
${level || "Beginner"}

Give:

PRACTICE QUESTION
INPUT
EXPECTED TASK
HINT

Do not immediately give the complete solution.

Student answer, if provided:

${userAnswer || "No answer provided."}

If a student answer is provided, evaluate it and explain
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
          "Algorithm AI request failed.",
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
            "Enter an algorithm problem or instructions.",
        });
      }

      // --------------------------------------------------
      // VALIDATE LEVEL
      // --------------------------------------------------

      const selectedLevel =
        ALGORITHM_LEVELS.includes(
          level
        )
          ? level
          : "Beginner";

      // --------------------------------------------------
      // GENERATE ALGORITHM
      // --------------------------------------------------

      const instruction = `
Generate an exam-ready algorithm.

Learning level:
${selectedLevel}

Algorithm problem / instructions:
${topic.trim()}

Generate ONLY an algorithm.

Do not generate C, C++, Python, Java or JavaScript code.

Do not include programming-language syntax.

Create a clean college algorithm-notebook style answer.

Use exactly this general structure:

ALGORITHM: <algorithm name>

PURPOSE:
<simple purpose>

VARIABLES:

(i) <variable> : <meaning>
(ii) <variable> : <meaning>
(iii) <variable> : <meaning>
(iv) <variable> : <meaning>

STEPS:

Step-1:
<clear step>

Step-2:
<clear step>

Step-3:
<clear step>

Step-4:
<clear step if necessary>

PSEUDOCODE:

<clear exam-ready pseudocode>

EXAMPLE:

<small example>

EXPECTED RESULT:

<result>

TIME COMPLEXITY:

<complexity>

SPACE COMPLEXITY:

<complexity>

IMPORTANT POINTS:

- <point>
- <point>

Requirements:

1. Keep the language simple.
2. Make it easy to understand.
3. Make it suitable for an examination.
4. Explain variables clearly.
5. Use numbered steps.
6. Use clean pseudocode.
7. Do not generate a programming-language program.
8. Do not add unrelated content.
9. For Beginner level, make everything especially simple.
10. For Intermediate level, provide moderate detail.
11. For Advance level, provide more technically precise detail.
12. Finish with RETURN or FINISH where appropriate.
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

      // Remove accidental headings if Gemini adds them.
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
// NORMAL CODE GENERATOR
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

      if (!LANGUAGES[language]) {
        return res.status(400).json({
          error:
            "Choose a supported programming language.",
        });
      }

      if (
        !LEVELS.includes(level)
      ) {
        return res.status(400).json({
          error:
            "Choose a valid learning level.",
        });
      }

      if (
        !STYLES.includes(
          codeStyle
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

      if (
        topic.length > 6000
      ) {
        return res.status(400).json({
          error:
            "Programming request is too long.",
        });
      }

      let styleRules = "";

      if (language === "C") {
        if (
          codeStyle ===
          "Legacy Turbo C"
        ) {
          styleRules = `
LEGACY TURBO C MODE.

The displayed source MUST look like classic Turbo C.

Use:

#include <stdio.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

Do not use int main(void).
Do not use int main().
`;
        } else {
          styleRules = `
MODERN STANDARD C MODE.

Use standard C.

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
LEGACY TURBO C++ MODE.

The displayed source MUST look like classic Turbo C++.

Use:

#include <iostream.h>
#include <conio.h>

void main()
{
    clrscr();

    // program

    getch();
}

Do not use int main().
`;
        } else {
          styleRules = `
MODERN STANDARD C++ MODE.

Use standard C++.

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
Turbo C syntax does not apply.
`;
      }

      if (
        language === "Java"
      ) {
        styleRules = `
Generate normal valid Java.

Use:

public class Main
`;
      }

      if (
        language === "JavaScript"
      ) {
        styleRules = `
Generate normal Node.js JavaScript.

Use standard input when input is required.

Do not use external packages.
`;
      }

      const instruction = `
Generate ONE complete programming solution.

Language:
${language}

Learning level:
${level}

Code style:
${codeStyle}

Programming problem:
${topic.trim()}

Style requirements:
${styleRules}

${COMMENT_RULE}

Rules:

1. Generate only ${language}.
2. Solve the requested problem.
3. Make the program complete.
4. Make it suitable for ${level}.
5. Use standard input when required.
6. Add useful comments.
7. Follow the selected style.
8. Do not claim execution.

Return:

=== CODE ===

\`\`\`
COMPLETE PROGRAM
\`\`\`

=== HOW IT WORKS ===

Simple explanation.

=== EXAMPLE INPUT ===

Example input.

=== EXPECTED OUTPUT ===

Expected output.

=== IMPORTANT POINTS ===

Important points.
`;

      const answer =
        await askAI(
          instruction
        );

      let code =
        extractCode(answer);

      if (!code) {
        throw new Error(
          "Gemini did not return a code block."
        );
      }

      code =
        applySelectedCodeStyle(
          language,
          code,
          codeStyle
        );

      const explanation =
        cleanGeneratedExplanation(
          answer
        );

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

  // Remove conio.
  runnable =
    runnable.replace(
      /^\s*#include\s*<conio\.h>\s*\r?\n?/gim,
      ""
    );

  // C++ old iostream.
  if (
    language === "C++"
  ) {
    runnable =
      runnable.replace(
        /#include\s*<iostream\.h>/gi,
        "#include <iostream>"
      );
  }

  // Remove Turbo C functions.
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

  // Convert main.
  runnable =
    runnable.replace(
      /\bvoid\s+main\s*\(\s*\)/i,
      "int main()"
    );

  // Remove existing return statements.
  runnable =
    runnable.replace(
      /^\s*return\s+[0-9]+\s*;\s*$/gim,
      ""
    );

  // Add return 0.
  const lastBrace =
    runnable.lastIndexOf(
      "}"
    );

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

  if (
    code.length >
    20000
  ) {
    throw new Error(
      "Code is too large."
    );
  }

  if (
    (stdin || "")
      .length >
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
    "Execution timed out while waiting for Judge0."
  );
}

// ======================================================
// NORMAL CODE LAB
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
// START SERVER
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
      "=========================================="
    );

    console.log("");
  }
);