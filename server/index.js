require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT || 8787);

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

const JUDGE0_URL =
  process.env.JUDGE0_URL || "https://ce.judge0.com";

const DOWNLOAD_DIR = path.join(
  __dirname,
  "public",
  "downloads"
);

const EXE_FILE = path.join(
  DOWNLOAD_DIR,
  "CodeMentor-AI-Setup.exe"
);

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, {
    recursive: true,
  });
}

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

const LANGUAGE_ALIASES = {
  c: "C",
  "c language": "C",

  cpp: "C++",
  "c++": "C++",
  "c plus plus": "C++",

  python: "Python",
  py: "Python",

  java: "Java",

  javascript: "JavaScript",
  js: "JavaScript",
  "node js": "JavaScript",
  node: "JavaScript",
};

const SYSTEM_PROMPT = `
You are CodeMentor AI, an expert programming teacher and code generator.

You support:
C
C++
Python
Java
JavaScript

Always solve the exact problem requested by the student.

Never claim that code was executed unless an actual Judge0 result is supplied.

Never invent execution output.

When asked for code, provide complete programs with correct input/output behavior.
`.trim();

const COMMENT_RULE = `
Add short, useful beginner-friendly comments using valid syntax for the selected language.
`.trim();

function safeString(
  value,
  fallback = ""
) {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value);
}

function normalizeLanguage(
  language
) {
  const value = safeString(language)
    .trim()
    .toLowerCase();

  return (
    LANGUAGE_ALIASES[value] ||
    value
  );
}

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

function retryableStatus(status) {
  return [
    429,
    500,
    502,
    503,
    504,
  ].includes(Number(status));
}

async function askAI(
  instruction,
  options = {}
) {
  if (!GEMINI_API_KEY) {
    const error = new Error(
      "Gemini AI is not configured. Add GEMINI_API_KEY to the server environment."
    );

    error.status = 503;

    throw error;
  }

  const maxAttempts = Number(
    options.maxAttempts || 5
  );

  const temperature =
    options.temperature ??
    0.15;

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

      let data = {};

      try {
        data = raw
          ? JSON.parse(raw)
          : {};
      } catch (error) {
        lastError =
          new Error(
            `Gemini returned invalid JSON: ${raw.slice(
              0,
              500
            )}`
          );

        if (
          attempt <
          maxAttempts
        ) {
          await sleep(
            Math.min(
              8000,
              1200 *
                2 **
                  (attempt - 1)
            )
          );

          continue;
        }

        throw lastError;
      }

      if (!response.ok) {
        lastError =
          new Error(
            data?.error?.message ||
              `Gemini request failed (${response.status}).`
          );

        lastError.status =
          response.status;

        if (
          retryableStatus(
            response.status
          ) &&
          attempt <
            maxAttempts
        ) {
          const delay =
            Math.min(
              8000,
              1200 *
                2 **
                  (attempt - 1)
            );

          console.log(
            `Gemini ${response.status}; retry ${attempt + 1}/${maxAttempts} in ${delay}ms`
          );

          await sleep(delay);

          continue;
        }

        throw lastError;
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
        lastError =
          new Error(
            "Gemini returned an empty response."
          );

        if (
          attempt <
          maxAttempts
        ) {
          await sleep(
            Math.min(
              8000,
              1200 *
                2 **
                  (attempt - 1)
            )
          );

          continue;
        }

        throw lastError;
      }

      return text.trim();
    } catch (error) {
      lastError = error;

      if (
        retryableStatus(
          error?.status
        ) &&
        attempt <
          maxAttempts
      ) {
        const delay =
          Math.min(
            8000,
            1200 *
              2 **
                (attempt - 1)
          );

        console.log(
          `Gemini retryable failure; retry ${attempt + 1}/${maxAttempts} in ${delay}ms`
        );

        await sleep(delay);

        continue;
      }

      throw error;
    }
  }

  throw (
    lastError ||
    new Error(
      "Gemini request failed."
    )
  );
}

function extractBlocks(text) {
  return [
    ...safeString(text).matchAll(
      /```(?:[a-zA-Z0-9_+#.+-]*)?\s*\n?([\s\S]*?)```/g
    ),
  ]
    .map(
      (match) =>
        match[1].trim()
    )
    .filter(Boolean);
}

function extractLanguageSolutions(
  text
) {
  const source =
    safeString(text);

  const solutions = {
    C: "",
    "C++": "",
    Python: "",
    Java: "",
    JavaScript: "",
  };

  const sections = {
    C: /===\s*C\s*===([\s\S]*?)(?====\s*C\+\+\s*===|$)/i,

    "C++":
      /===\s*C\+\+\s*===([\s\S]*?)(?====\s*Python\s*===|$)/i,

    Python:
      /===\s*Python\s*===([\s\S]*?)(?====\s*Java\s*===|$)/i,

    Java:
      /===\s*Java\s*===([\s\S]*?)(?====\s*JavaScript\s*===|$)/i,

    JavaScript:
      /===\s*JavaScript\s*===([\s\S]*?)(?====\s*HOW IT WORKS\s*===|====\s*ALGORITHM\s*===|====\s*COMPLEXITY\s*===|$)/i,
  };

  for (
    const language of
    ALL_LANGUAGES
  ) {
    const match =
      source.match(
        sections[language]
      );

    if (match) {
      const blocks =
        extractBlocks(
          match[1]
        );

      solutions[language] =
        blocks[0] ||
        match[1].trim();
    }
  }

  const blocks =
    extractBlocks(source);

  ALL_LANGUAGES.forEach(
    (
      language,
      index
    ) => {
      if (
        !solutions[language] &&
        blocks[index]
      ) {
        solutions[language] =
          blocks[index];
      }
    }
  );

  return solutions;
}

function detectLanguage(
  code
) {
  const source =
    safeString(code);

  if (
    /#include\s*[<"]stdio\.h[>"]/.test(
      source
    ) ||
    /\bprintf\s*\(/.test(
      source
    ) ||
    /\bscanf\s*\(/.test(
      source
    )
  ) {
    return "C";
  }

  if (
    /#include\s*[<"]iostream(?:\.h)?[>"]/.test(
      source
    ) ||
    /std::/.test(source) ||
    /\bcout\s*<</.test(
      source
    ) ||
    /\bcin\s*>>/.test(
      source
    )
  ) {
    return "C++";
  }

  if (
    /\bpublic\s+class\s+Main\b/.test(
      source
    ) ||
    /\bSystem\.out\./.test(
      source
    ) ||
    /\bimport\s+java\./.test(
      source
    )
  ) {
    return "Java";
  }

  if (
    /\bconsole\.log\s*\(/.test(
      source
    ) ||
    /\bconst\s+\w+\s*=/.test(
      source
    ) ||
    /\blet\s+\w+\s*=/.test(
      source
    ) ||
    /\bfunction\s+\w+\s*\(/.test(
      source
    )
  ) {
    return "JavaScript";
  }

  if (
    /\bdef\s+\w+\s*\(/.test(
      source
    ) ||
    /\bprint\s*\(/.test(
      source
    ) ||
    /\bimport\s+\w+/.test(
      source
    )
  ) {
    return "Python";
  }

  return "Python";
}

function detectStyle(
  code,
  language
) {
  if (
    (
      language === "C" ||
      language === "C++"
    ) &&
    /conio\.h|clrscr\s*\(|getch\s*\(|void\s+main\s*\(/i.test(
      safeString(code)
    )
  ) {
    return "Legacy Turbo C";
  }

  return "Modern Standard";
}

function prepareLegacyCode(
  code,
  language
) {
  if (
    language !== "C" &&
    language !== "C++"
  ) {
    return code;
  }

  let runnable =
    safeString(code);

  runnable =
    runnable.replace(
      /^\s*#include\s*[<"]conio\.h[>"]\s*\r?\n?/gim,
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
      /\bvoid\s+main\s*\(\s*\)/,
      "int main()"
    );

  if (
    language === "C++"
  ) {
    runnable =
      runnable.replace(
        /#include\s*[<"]iostream\.h[>"]/g,
        "#include <iostream>"
      );
  }

  if (
    /\bint\s+main\s*\(/.test(
      runnable
    ) &&
    !/\breturn\s+0\s*;/.test(
      runnable
    )
  ) {
    const index =
      runnable.lastIndexOf(
        "}"
      );

    if (index >= 0) {
      runnable =
        runnable.slice(
          0,
          index
        ) +
        "\nreturn 0;\n" +
        runnable.slice(
          index
        );
    }
  }

  return runnable.trim();
}

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
  pathname,
  options = {}
) {
  const base =
    (
      process.env
        .JUDGE0_URL ||
      JUDGE0_URL
    ).replace(
      /\/$/,
      ""
    );

  return fetch(
    base + pathname,
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

async function runJudge0(
  language,
  code,
  stdin
) {
  const lang =
    LANGUAGES[language];

  if (!lang) {
    throw new Error(
      "Unsupported programming language."
    );
  }

  if (
    !safeString(code).trim()
  ) {
    throw new Error(
      "Code is empty."
    );
  }

  const submit =
    await judgeFetch(
      "/submissions/?base64_encoded=false&wait=false",
      {
        method: "POST",

        body: JSON.stringify({
          language_id:
            lang.id,

          source_code:
            prepareLegacyCode(
              code,
              language
            ),

          stdin:
            safeString(stdin),

          cpu_time_limit: 3,

          wall_time_limit: 5,

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

  const submission =
    await submit.json();

  if (!submission?.token) {
    throw new Error(
      "Judge0 did not return a submission token."
    );
  }

  for (
    let attempt = 0;
    attempt < 40;
    attempt++
  ) {
    await sleep(500);

    const result =
      await judgeFetch(
        `/submissions/${encodeURIComponent(
          submission.token
        )}?base64_encoded=false`
      );

    if (!result.ok) {
      throw new Error(
        `Judge0 result failed (${result.status}).`
      );
    }

    const data =
      await result.json();

    if (
      data?.status?.id > 2
    ) {
      return data;
    }
  }

  throw new Error(
    "Execution timed out while waiting for Judge0."
  );
}

function buildCodeGenerationPrompt({
  topic,
  level,
  codeStyle,
}) {
  const selected =
    safeString(
      codeStyle,
      "modern"
    )
      .trim()
      .toLowerCase();

  const legacy =
    [
      "legacy",
      "legacy turbo c",
      "legacy turbo c style",
    ].includes(
      selected
    );

  const cRules = legacy
    ? `
C STYLE: LEGACY TURBO C.

Use:
#include <stdio.h>

When useful, use:
#include <conio.h>
clrscr();
getch();
void main();

Use simple classic C syntax suitable for Turbo C.

Do not use modern C99/C11-only features unless unavoidable.
`
    : `
C STYLE: MODERN STANDARD C.

Use:
#include <stdio.h>
int main(void)

Use portable modern standard C.

Do NOT use:
conio.h
clrscr()
getch()
void main()
`;

  const cppRules = legacy
    ? `
C++ STYLE: LEGACY TURBO C++.

Use:
#include <iostream.h>

When useful, use:
#include <conio.h>
clrscr();
getch();
void main();

Use classic arrays, loops, functions and simple syntax.

Do NOT use:
STL vector
STL string
auto
range-based for loops
lambda functions
C++11 or newer syntax
`
    : `
C++ STYLE: MODERN STANDARD C++.

Use:
#include <iostream>
int main()

Use std::cin and std::cout.

Do NOT use:
iostream.h
conio.h
clrscr()
getch()
void main()

Modern C++ features may be used when useful.
`;

  return `
Student level:
${level || "Beginner"}

Problem:
${topic}

Generate the SAME complete solution in:

C
C++
Python
Java
JavaScript

${cRules}

${cppRules}

IMPORTANT PYTHON:

Python MUST use Python 3.

IMPORTANT JAVA:

Java MUST use:

public class Main

The Java program must be complete and runnable.

IMPORTANT JAVASCRIPT:

JavaScript MUST be runnable with Node.js using built-in functionality only.

${COMMENT_RULE}

Each language must solve EXACTLY the same problem.

Use standard input when input is needed.

Do not claim execution.

Return exactly:

=== C ===
\`\`\`c
complete C program
\`\`\`

=== C++ ===
\`\`\`cpp
complete C++ program
\`\`\`

=== Python ===
\`\`\`python
complete Python 3 program
\`\`\`

=== Java ===
\`\`\`java
complete Java program
\`\`\`

=== JavaScript ===
\`\`\`javascript
complete Node.js program
\`\`\`

=== HOW IT WORKS ===
explain the solution

=== EXAMPLE INPUT ===
example input

=== EXPECTED OUTPUT ===
expected output

=== IMPORTANT POINTS ===
important learning points

Do not claim execution.
`.trim();
}

function buildAlgorithmPrompt({
  topic,
  level,
}) {
  return `
Algorithm problem:
${topic}

Learner level:
${level || "Beginner"}

Create an exam-ready algorithm for this problem and provide the SAME solution in:

C
C++
Python
Java
JavaScript

IMPORTANT C:

Use LEGACY TURBO C STYLE.

Use:
#include <stdio.h>

When useful, use:
#include <conio.h>
clrscr();
getch();
void main();

Avoid modern C99/C11-only features when possible.

IMPORTANT C++:

Use LEGACY TURBO C++ STYLE.

Use:
#include <iostream.h>

When useful, use:
#include <conio.h>
clrscr();
getch();
void main();

Do NOT use:

STL vector
STL string
auto
range-based for
lambda
C++11 or newer syntax

Use simple arrays, loops and functions.

Python must use Python 3.

Java must use public class Main.

JavaScript must run with Node.js.

Return exactly:

=== ALGORITHM ===
step-by-step algorithm and pseudocode

=== C ===
\`\`\`c
legacy Turbo C code
\`\`\`

=== C++ ===
\`\`\`cpp
legacy Turbo C++ code
\`\`\`

=== Python ===
\`\`\`python
Python 3 code
\`\`\`

=== Java ===
\`\`\`java
Java code
\`\`\`

=== JavaScript ===
\`\`\`javascript
Node.js code
\`\`\`

=== COMPLEXITY ===
time and space complexity

=== EXAMPLE ===
example input and expected output

Do not claim execution.
`.trim();
}

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
        Boolean(JUDGE0_URL),

      supportedLanguages:
        ALL_LANGUAGES,

      features: {
        codeGeneration: true,
        fiveLanguages: true,
        algorithmSystem: true,
        algorithmGenerator: true,
        algorithmPractice: true,
        codeExecution: true,
        automaticCodeDetection: true,
        aiTeacher: true,
        practice: true,
        desktopExeDownload: true,
        geminiRetry: true,
      },

      endpoints: {
        teacher:
          "/api/ai/teach",

        code:
          "/api/ai/code",

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
            error:
              "Enter a programming question.",
          });
      }

      if (
        safeString(question)
          .length > 8000
      ) {
        return res
          .status(400)
          .json({
            error:
              "Question is too long.",
          });
      }

      const answer =
        await askAI(`
Programming language:
${language || "General programming"}

Learner level:
${level || "Beginner"}

Student question:
${question.trim()}

Teach the student clearly.

If the student asks for a program, provide a complete runnable program in the selected language.

${COMMENT_RULE}

Include explanation and examples when useful.

If you provide expected output, clearly label it EXPECTED OUTPUT and do not claim that it was actually executed.
`);

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
        !safeString(code).trim()
      ) {
        return res
          .status(400)
          .json({
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

Analyze only this code.

Do not claim execution.

--- CODE START ---
${code}
--- CODE END ---

If there is an error:
1. Explain the error.
2. Explain how to fix it.
3. Provide corrected code when useful.

For C or C++, recognize both modern code and legacy Turbo C/Turbo C++ code.
`);

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
        !safeString(topic).trim()
      ) {
        return res
          .status(400)
          .json({
            error:
              "Enter a programming problem or topic.",
          });
      }

      const answer =
        await askAI(
          buildCodeGenerationPrompt({
            topic: topic.trim(),
            level,
            codeStyle,
          }),
          {
            temperature: 0.12,
            maxOutputTokens:
              16000,
            maxAttempts: 5,
          }
        );

      const solutions =
        extractLanguageSolutions(
          answer
        );

      const normalized =
        normalizeLanguage(
          language
        );

      let code = "";

      if (
        normalized === "C"
      ) {
        code =
          solutions.C;
      } else if (
        normalized === "C++"
      ) {
        code =
          solutions["C++"];
      } else if (
        normalized ===
        "Python"
      ) {
        code =
          solutions.Python;
      } else if (
        normalized === "Java"
      ) {
        code =
          solutions.Java;
      } else if (
        normalized ===
        "JavaScript"
      ) {
        code =
          solutions.JavaScript;
      } else {
        code =
          solutions.Python ||
          solutions.C ||
          "";
      }

      res.json({
        success: true,

        language:
          normalized ||
          language ||
          "Python",

        code,

        solutions,

        languages:
          ALL_LANGUAGES,

        codeStyle:
          codeStyle ||
          "modern",

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
            error:
              "Enter an algorithm question.",
          });
      }

      const answer =
        await askAI(`
Algorithm learner level:
${level || "Beginner"}

Question:
${question.trim()}

Explain the algorithm in very easy language.

Include:
- idea
- step-by-step approach
- pseudocode
- time complexity
- space complexity
- small example

Do not claim execution.
`);

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

app.post(
  "/api/ai/generate-algorithm",
  async (req, res) => {
    try {
      const {
        topic,
        level,
      } = req.body || {};

      if (
        !safeString(topic).trim()
      ) {
        return res
          .status(400)
          .json({
            error:
              "Enter an algorithm problem.",
          });
      }

      const answer =
        await askAI(
          buildAlgorithmPrompt({
            topic: topic.trim(),
            level,
          }),
          {
            temperature: 0.12,
            maxOutputTokens:
              18000,
            maxAttempts: 5,
          }
        );

      const solutions =
        extractLanguageSolutions(
          answer
        );

      const algorithm =
        answer.match(
          /===\s*ALGORITHM\s*===([\s\S]*?)(?====\s*C\s*===)/i
        )?.[1]
          ?.trim() || "";

      const complexity =
        answer.match(
          /===\s*COMPLEXITY\s*===([\s\S]*?)(?====\s*EXAMPLE\s*===|$)/i
        )?.[1]
          ?.trim() || "";

      const example =
        answer.match(
          /===\s*EXAMPLE\s*===([\s\S]*?)$/i
        )?.[1]
          ?.trim() || "";

      res.json({
        success: true,

        title:
          topic.trim(),

        problem:
          topic.trim(),

        algorithm,

        complexity,

        example,

        code: {
          c:
            solutions.C,

          cpp:
            solutions["C++"],

          python:
            solutions.Python,

          java:
            solutions.Java,

          javascript:
            solutions
              .JavaScript,
        },

        solutions,

        languages:
          ALL_LANGUAGES,

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
            "Algorithm generation failed.",
        });
    }
  }
);

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
        !safeString(topic).trim()
      ) {
        return res
          .status(400)
          .json({
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

Evaluate the student's algorithm.

Explain:
1. What is correct.
2. What is missing.
3. What is wrong.
4. The corrected algorithm.
5. Time complexity.
6. Space complexity.
7. One improvement tip.

Do not claim execution.
`);

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
            "Algorithm evaluation failed.",
        });
    }
  }
);

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

Learner level:
${level || "Beginner"}

Topic:
${topic || "Basic programming"}

Include:
- Problem statement
- Input
- Expected output
- Constraints
- Hint

Do not claim execution.
`);

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

app.post(
  "/api/code/run",
  async (req, res) => {
    try {
      const {
        language,
        code,
        stdin,
      } = req.body || {};

      const requested =
        normalizeLanguage(
          language
        );

      const detected =
        LANGUAGES[requested]
          ? requested
          : detectLanguage(code);

      const result =
        await runJudge0(
          detected,
          code,
          stdin
        );

      res.json({
        success: true,

        language:
          detected,

        languageKey:
          LANGUAGES[detected]?.key ||
          detected.toLowerCase(),

        codeStyle:
          detectStyle(
            code,
            detected
          ),

        status:
          result.status
            ?.description ||
          "Unknown",

        stdout:
          result.stdout || "",

        stderr:
          result.stderr || "",

        compile_output:
          result.compile_output ||
          "",

        compileOutput:
          result.compile_output ||
          "",

        message:
          result.message || "",

        time:
          result.time || null,

        memory:
          result.memory || null,

        output:
          result.stdout || "",
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

app.post(
  "/api/algorithm/run",
  async (req, res) => {
    try {
      const {
        language,
        code,
        stdin,
      } = req.body || {};

      const requested =
        normalizeLanguage(
          language
        );

      const detected =
        LANGUAGES[requested]
          ? requested
          : detectLanguage(code);

      const result =
        await runJudge0(
          detected,
          code,
          stdin
        );

      res.json({
        success: true,

        language:
          detected,

        languageKey:
          LANGUAGES[detected]?.key ||
          detected.toLowerCase(),

        codeStyle:
          detectStyle(
            code,
            detected
          ),

        status:
          result.status
            ?.description ||
          "Unknown",

        stdout:
          result.stdout || "",

        stderr:
          result.stderr || "",

        compile_output:
          result.compile_output ||
          "",

        compileOutput:
          result.compile_output ||
          "",

        message:
          result.message || "",

        time:
          result.time || null,

        memory:
          result.memory || null,

        output:
          result.stdout || "",
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

app.use(
  "/downloads",
  express.static(
    DOWNLOAD_DIR,
    {
      fallthrough: false,
    }
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

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      error:
        "API endpoint not found.",
      path:
        req.originalUrl,
    });
  }
);

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
      "Supported languages: C, C++, Python, Java, JavaScript"
    );

    console.log(
      "Gemini automatic retry: enabled"
    );
  }
);