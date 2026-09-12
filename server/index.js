require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = Number(
  process.env.PORT || 8787
);

const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5173";

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

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.5-flash-lite";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


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


const SYSTEM_PROMPT = `
You are CodeMentor AI, an expert programming teacher.

Teach C, C++, Python, Java and JavaScript accurately using simple beginner-friendly language.

Never claim code was executed.

Never invent actual execution results.

The Code Lab uses Judge0 for real execution.

Be practical, encouraging and precise.
`;


const COMMENT_RULE = `
COMMENTING REQUIREMENT:

The learner is a beginner.

Add a useful beginner-friendly comment to EVERY important source-code line or statement whenever the language permits it.

Explain:
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

Keep comments short and directly related to the line.

Do not add meaningless comments to blank lines.

Use correct comment syntax:
# for Python
// or /* */ for C, C++, Java and JavaScript.

The code must remain valid and runnable after comments are added.
`;


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
          temperature: 0.2,
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
    .replace(
      /^===\s*CODE\s*===/i,
      ""
    )
    .replace(
      /^Here is.*?:/i,
      ""
    )
    .trim();
}


function cleanGeneratedExplanation(text) {
  if (!text) {
    return "";
  }


  const withoutCode =
    text.replace(
      /```[\s\S]*?```/g,
      ""
    );


  const markerIndex =
    withoutCode.search(
      /===\s*HOW IT WORKS\s*===/i
    );


  if (markerIndex >= 0) {
    return withoutCode
      .slice(markerIndex)
      .replace(
        /^===\s*/i,
        ""
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
// HEALTH
// ======================================================

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      ok: true,

      aiProvider:
        "Gemini",

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
        typeof question !==
          "string" ||
        !question.trim()
      ) {

        return res
          .status(400)
          .json({
            error:
              "Enter a programming question.",
          });

      }


      if (
        question.length >
        6000
      ) {

        return res
          .status(400)
          .json({
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

Clearly label example input and EXPECTED OUTPUT.

Do not claim you executed the code.
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

      res
        .status(
          error.status || 500
        )
        .json({
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
        typeof code !==
          "string"
      ) {

        return res
          .status(400)
          .json({
            error:
              "Code is required.",
          });

      }


      if (
        code.length >
        20000
      ) {

        return res
          .status(400)
          .json({
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

If there is an error, identify it, explain why it occurs, and show corrected code when useful.
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
        "AI Code Error:",
        error
      );

      res
        .status(
          error.status || 500
        )
        .json({
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


      if (
        !LANGUAGES[language]
      ) {

        return res
          .status(400)
          .json({
            error:
              "Choose a supported programming language.",
          });

      }


      if (
        !LEVELS.includes(level)
      ) {

        return res
          .status(400)
          .json({
            error:
              "Choose a valid learning level.",
          });

      }


      if (
        !STYLES.includes(
          codeStyle
        )
      ) {

        return res
          .status(400)
          .json({
            error:
              "Choose a valid code style.",
          });

      }


      if (
        !topic ||
        typeof topic !==
          "string" ||
        !topic.trim()
      ) {

        return res
          .status(400)
          .json({
            error:
              "Enter a programming problem or topic.",
          });

      }


      if (
        topic.length >
        6000
      ) {

        return res
          .status(400)
          .json({
            error:
              "Programming request is too long. Maximum 6000 characters.",
          });

      }


      let styleRules = "";


      if (
        language === "C" ||
        language === "C++"
      ) {

        styleRules = `

For C/C++, the selected code style matters.

IF STYLE IS MODERN STANDARD:

C:
- Use standard modern C.
- Use int main().
- Use standard headers.
- Never use conio.h.
- Never use clrscr().
- Never use getch().

C++:
- Use standard modern C++.
- Use int main().
- Use standard C++ headers.
- Never use conio.h.
- Never use clrscr().
- Never use getch().


IF STYLE IS LEGACY TURBO C:

C:
- Make the displayed source look like classic Turbo C educational code.
- Classic constructs such as void main(), #include <conio.h>, clrscr() and getch() may be used when appropriate.
- Traditional C syntax is acceptable.
- Preserve #define when useful.

C++:
- Make the displayed source look like classic Turbo C++ educational code.
- Legacy console constructs may be used when appropriate.
- Keep the program simple and educational.

`;

      } else {

        styleRules = `

This language does not use Turbo C syntax.

Generate normal valid ${language} code regardless of the selected style.

Python:
- Use normal valid Python.

Java:
- Use public class Main.

JavaScript:
- Use Node.js.
- Use standard input when input is required.
- Do not use prompt-sync.
- Do not use external packages.

`;

      }


      const instruction = `

Generate ONE complete solution for this programming problem.

Programming language:
${language}

Learner level:
${level}

Selected code style:
${codeStyle}

Programming problem:
${topic.trim()}


${COMMENT_RULE}


${styleRules}


GENERAL RULES:

- Generate ONLY ${language}.
- Do not generate other languages.
- Solve exactly the requested problem.
- Make the program complete.
- Make it appropriate for the learner's level.
- Use standard input for input-based programs.
- Keep the code valid.
- Do not claim that you executed the code.
- Do not invent actual execution results.
- Include a short explanation after the code.


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


      const answer =
        await askAI(
          instruction
        );


      const code =
        extractCode(answer);


      if (!code) {

        throw new Error(
          "Gemini did not return a code block. Please try again."
        );

      }


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

      res
        .status(
          error.status || 500
        )
        .json({
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


  if (
    process.env.JUDGE0_API_KEY
  ) {

    headers[
      "X-Auth-Token"
    ] =
      process.env.JUDGE0_API_KEY;

  }


  if (
    process.env.JUDGE0_AUTH_USER
  ) {

    headers[
      "X-Auth-User"
    ] =
      process.env.JUDGE0_AUTH_USER;

  }


  return headers;
}


async function judgeFetch(
  path,
  options = {}
) {

  const base =
    (
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

        ...(options.headers ||
          {}),
      },
    }
  );
}


// ======================================================
// TURBO C COMPATIBILITY
// ======================================================

function prepareLegacyTurboCode(
  language,
  code,
  codeStyle
) {

  if (
    codeStyle !==
      "Legacy Turbo C" ||
    (
      language !== "C" &&
      language !== "C++"
    )
  ) {

    return code;

  }


  let runnable =
    code;


  /*
   * Modern Judge0 GCC/G++ does not provide
   * Turbo C's conio.h functions.
   *
   * The original Turbo C source stays visible
   * in the Code Lab editor.
   *
   * Only the copy sent to Judge0 is transformed.
   */


  runnable =
    runnable.replace(
      /^\s*#include\s*<conio\.h>\s*\r?\n?/gmi,
      ""
    );


  runnable =
    runnable.replace(
      /\bclrscr\s*\(\s*\)\s*;?/g,
      ""
    );


  runnable =
    runnable.replace(
      /\bgetch\s*\(\s*\)\s*;?/g,
      ""
    );


  runnable =
    runnable.replace(
      /\bvoid\s+main\s*\(/,
      "int main("
    );


  const mainClose =
    runnable.lastIndexOf(
      "}"
    );


  if (
    mainClose >= 0 &&
    !/return\s+0\s*;/.test(
      runnable
    )
  ) {

    runnable =
      `${runnable.slice(
        0,
        mainClose
      )}

    return 0;
${runnable.slice(
  mainClose
)}`;

  }


  return runnable;
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


    if (!result.ok) {

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
        typeof code !==
          "string"
      ) {

        return res
          .status(400)
          .json({
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
          result.status
            ?.description ||
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

      res
        .status(500)
        .json({
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

  }
);