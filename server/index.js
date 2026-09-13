const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// =========================================================
// CONFIGURATION
// =========================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// =========================================================
// LANGUAGE CONFIGURATION
// =========================================================

const LANGUAGES = {
  c: {
    name: "C",
    judge0Id: 50,
  },

  cpp: {
    name: "C++",
    judge0Id: 54,
  },

  python: {
    name: "Python",
    judge0Id: 71,
  },

  java: {
    name: "Java",
    judge0Id: 62,
  },

  javascript: {
    name: "JavaScript",
    judge0Id: 63,
  },
};

const LANGUAGE_ALIASES = {
  c: "c",
  "c language": "c",

  cpp: "cpp",
  "c++": "cpp",
  "c plus plus": "cpp",

  python: "python",
  py: "python",

  java: "java",

  javascript: "javascript",
  js: "javascript",
  "node js": "javascript",
  node: "javascript",
};

// =========================================================
// GENERAL HELPERS
// =========================================================

function safeString(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value);
}

function getBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  return {};
}

function normalizeLanguage(language) {
  const value = safeString(language)
    .trim()
    .toLowerCase();

  return LANGUAGE_ALIASES[value] || value || "python";
}

function languageName(language) {
  const key = normalizeLanguage(language);

  if (LANGUAGES[key]) {
    return LANGUAGES[key].name;
  }

  return safeString(language, "Python");
}

function cleanCode(code) {
  let result = safeString(code).trim();

  result = result.replace(
    /^```[a-zA-Z0-9_+#.-]*\s*/i,
    ""
  );

  result = result.replace(
    /\s*```$/i,
    ""
  );

  return result.trim();
}

function stripJsonFences(text) {
  let value = safeString(text).trim();

  value = value.replace(
    /^```json\s*/i,
    ""
  );

  value = value.replace(
    /^```\s*/i,
    ""
  );

  value = value.replace(
    /\s*```$/i,
    ""
  );

  return value.trim();
}

function extractJson(text) {
  const cleaned = stripJsonFences(text);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // Continue with extraction.
  }

  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");

  if (
    objectStart >= 0 &&
    objectEnd > objectStart
  ) {
    try {
      return JSON.parse(
        cleaned.slice(
          objectStart,
          objectEnd + 1
        )
      );
    } catch (error) {
      // Continue.
    }
  }

  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");

  if (
    arrayStart >= 0 &&
    arrayEnd > arrayStart
  ) {
    try {
      return JSON.parse(
        cleaned.slice(
          arrayStart,
          arrayEnd + 1
        )
      );
    } catch (error) {
      // Continue.
    }
  }

  return null;
}

// =========================================================
// GEMINI
// =========================================================

async function askGemini(prompt, options = {}) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server."
    );
  }

  const model =
    options.model || GEMINI_MODEL;

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent?key=" +
    encodeURIComponent(GEMINI_API_KEY);

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      contents: [
        {
          role: "user",

          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],

      generationConfig: {
        temperature:
          options.temperature !== undefined
            ? options.temperature
            : 0.25,

        maxOutputTokens:
          options.maxOutputTokens || 12000,
      },
    }),
  });

  const raw = await response.text();

  let data;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Gemini returned invalid JSON: ${raw.slice(0, 500)}`
    );
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `Gemini request failed with HTTP ${response.status}`;

    throw new Error(message);
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

// =========================================================
// CODE GENERATION
// =========================================================

function buildCodePrompt({
  topic,
  level,
  language,
  codeStyle,
  problem,
}) {
  const lang = languageName(language);

  return `
You are CodeMentor AI, an expert programming teacher.

Generate a correct, complete, beginner-friendly ${lang} program.

Topic:
${topic || "Programming basics"}

Problem:
${problem || topic || "Create a useful example for this topic."}

Student level:
${level || "beginner"}

Requested coding style:
${codeStyle || "clean and educational"}

Requirements:

1. Return ONLY the source code.
2. Do not use Markdown fences.
3. The code must compile or run in ${lang}.
4. Include all required imports/includes.
5. Use standard input/output when appropriate.
6. Do not use obsolete non-standard libraries unless absolutely required.
7. For C and C++, avoid conio.h, clrscr(), getch(), and void main().
8. For Java, use a public class named Main.
9. For JavaScript, make it executable with Node.js.
10. For Python, make it executable with Python 3.
11. Explain nothing outside the source code.
`.trim();
}

async function generateSingleLanguageCode(options) {
  const text = await askGemini(
    buildCodePrompt(options),
    {
      temperature: 0.15,
      maxOutputTokens: 10000,
    }
  );

  return cleanCode(text);
}

async function generateAllLanguages(options) {
  const languages = [
    "c",
    "cpp",
    "python",
    "java",
    "javascript",
  ];

  const results = {};

  for (const language of languages) {
    results[language] =
      await generateSingleLanguageCode({
        ...options,
        language,
      });
  }

  return results;
}

// =========================================================
// ALGORITHM GENERATION
// =========================================================

function buildAlgorithmPrompt({
  topic,
  level,
  problem,
}) {
  return `
You are CodeMentor AI, an expert computer science and algorithms teacher.

Create a complete algorithm lesson for:

Topic:
${topic || "Sorting"}

Problem:
${problem || topic || "Explain and solve the requested algorithm problem."}

Student level:
${level || "beginner"}

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "title": "string",
  "problem": "string",
  "idea": "string",
  "steps": ["string"],
  "pseudocode": "string",
  "complexity": {
    "time": "string",
    "space": "string"
  },
  "examples": [
    {
      "input": "string",
      "output": "string",
      "explanation": "string"
    }
  ]
}

Do not include Markdown fences.

The explanation must be educational and technically correct.
`.trim();
}

async function generateAlgorithmExplanation(options) {
  const text = await askGemini(
    buildAlgorithmPrompt(options),
    {
      temperature: 0.2,
      maxOutputTokens: 8000,
    }
  );

  const parsed = extractJson(text);

  if (!parsed) {
    return {
      title:
        options.topic || "Algorithm",

      problem:
        options.problem ||
        options.topic ||
        "Algorithm problem",

      idea: text,

      steps: [],

      pseudocode: "",

      complexity: {
        time: "Depends on implementation",
        space: "Depends on implementation",
      },

      examples: [],
    };
  }

  return {
    title:
      parsed.title ||
      options.topic ||
      "Algorithm",

    problem:
      parsed.problem ||
      options.problem ||
      options.topic ||
      "",

    idea:
      parsed.idea || "",

    steps:
      Array.isArray(parsed.steps)
        ? parsed.steps
        : [],

    pseudocode:
      parsed.pseudocode || "",

    complexity: {
      time:
        parsed.complexity?.time ||
        "Not specified",

      space:
        parsed.complexity?.space ||
        "Not specified",
    },

    examples:
      Array.isArray(parsed.examples)
        ? parsed.examples
        : [],
  };
}

async function generateAlgorithmAllLanguages(options) {
  const algorithm =
    await generateAlgorithmExplanation(
      options
    );

  const code =
    await generateAllLanguages({
      topic:
        algorithm.title ||
        options.topic,

      problem:
        algorithm.problem ||
        options.problem,

      level:
        options.level,

      codeStyle:
        "Use the algorithm described in the problem and provide a clean educational implementation.",
    });

  return {
    ...algorithm,

    code,

    solutions: {
      C: code.c,
      "C++": code.cpp,
      Python: code.python,
      Java: code.java,
      JavaScript: code.javascript,
    },
  };
}

// =========================================================
// AI TEACHER
// =========================================================

app.post(
  "/api/ai/teach",
  async (req, res) => {
    try {
      const body = getBody(req);

      const question =
        safeString(
          body.question ||
            body.prompt ||
            body.message ||
            body.topic
        ).trim();

      const level =
        safeString(
          body.level,
          "beginner"
        );

      if (!question) {
        return res.status(400).json({
          success: false,
          error:
            "Please provide a question.",
        });
      }

      const prompt = `
You are CodeMentor AI Teacher.

Teach the student clearly and patiently.

Student level:
${level}

Question:
${question}

Rules:

- Explain concepts step by step.
- Prefer simple language.
- Use examples where useful.
- If code is needed, provide correct code.
- Mention common mistakes.
- Do not invent facts.
- Keep the answer focused on the question.
`.trim();

      const answer =
        await askGemini(
          prompt,
          {
            temperature: 0.3,
            maxOutputTokens: 9000,
          }
        );

      return res.json({
        success: true,
        answer,
        response: answer,
      });
    } catch (error) {
      console.error(
        "AI Teacher error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "AI Teacher failed.",
      });
    }
  }
);

// =========================================================
// GENERIC AI CODE ENDPOINT
// =========================================================

app.post(
  "/api/ai/code",
  async (req, res) => {
    try {
      const body = getBody(req);

      const language =
        normalizeLanguage(
          body.language
        );

      if (!LANGUAGES[language]) {
        return res.status(400).json({
          success: false,
          error:
            "Supported languages are C, C++, Python, Java and JavaScript.",
        });
      }

      const code =
        await generateSingleLanguageCode({
          topic:
            body.topic ||
            body.problem ||
            "Programming problem",

          problem:
            body.problem ||
            body.topic,

          level:
            body.level ||
            "beginner",

          language,

          codeStyle:
            body.codeStyle ||
            "clean and educational",
        });

      return res.json({
        success: true,
        language:
          languageName(language),
        code,
      });
    } catch (error) {
      console.error(
        "AI code error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Code generation failed.",
      });
    }
  }
);

// =========================================================
// CODE GENERATOR
// =========================================================

app.post(
  "/api/ai/generate-code",
  async (req, res) => {
    try {
      const body = getBody(req);

      const topic =
        safeString(
          body.topic ||
            body.problem ||
            body.prompt
        ).trim();

      const level =
        safeString(
          body.level,
          "beginner"
        );

      const codeStyle =
        safeString(
          body.codeStyle,
          "clean and educational"
        );

      if (!topic) {
        return res.status(400).json({
          success: false,
          error:
            "Please provide a topic or programming problem.",
        });
      }

      // Specific language requested.
      if (body.language) {
        const language =
          normalizeLanguage(
            body.language
          );

        if (!LANGUAGES[language]) {
          return res.status(400).json({
            success: false,
            error:
              "Supported languages are C, C++, Python, Java and JavaScript.",
          });
        }

        const code =
          await generateSingleLanguageCode({
            topic,
            problem: topic,
            level,
            language,
            codeStyle,
          });

        return res.json({
          success: true,

          language:
            LANGUAGES[language].name,

          code,

          solutions: {
            [LANGUAGES[language].name]:
              code,
          },
        });
      }

      // No language requested.
      // Generate all five languages.
      const generated =
        await generateAllLanguages({
          topic,
          problem: topic,
          level,
          codeStyle,
        });

      return res.json({
        success: true,

        topic,

        code:
          generated.python,

        solutions: {
          C: generated.c,
          "C++": generated.cpp,
          Python: generated.python,
          Java: generated.java,
          JavaScript:
            generated.javascript,
        },

        languages: {
          c: generated.c,
          cpp: generated.cpp,
          python:
            generated.python,
          java: generated.java,
          javascript:
            generated.javascript,
        },
      });
    } catch (error) {
      console.error(
        "Generate code error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Failed to generate code.",
      });
    }
  }
);

// =========================================================
// ALGORITHM ENDPOINT
// =========================================================

app.post(
  "/api/ai/algorithm",
  async (req, res) => {
    try {
      const body = getBody(req);

      const topic =
        safeString(
          body.topic ||
            body.problem ||
            body.prompt
        ).trim();

      if (!topic) {
        return res.status(400).json({
          success: false,
          error:
            "Please provide an algorithm topic.",
        });
      }

      const result =
        await generateAlgorithmAllLanguages({
          topic,

          problem:
            body.problem ||
            topic,

          level:
            body.level ||
            "beginner",
        });

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(
        "Algorithm error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Algorithm generation failed.",
      });
    }
  }
);

// =========================================================
// GENERATE ALGORITHM
// =========================================================

app.post(
  "/api/ai/generate-algorithm",
  async (req, res) => {
    try {
      const body = getBody(req);

      const topic =
        safeString(
          body.topic ||
            body.problem ||
            body.prompt
        ).trim();

      if (!topic) {
        return res.status(400).json({
          success: false,
          error:
            "Please provide an algorithm topic.",
        });
      }

      const result =
        await generateAlgorithmAllLanguages({
          topic,

          problem:
            body.problem ||
            topic,

          level:
            body.level ||
            "beginner",
        });

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(
        "Generate algorithm error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Algorithm generation failed.",
      });
    }
  }
);

// =========================================================
// ALGORITHM PRACTICE
// =========================================================

app.post(
  "/api/ai/algorithm-practice",
  async (req, res) => {
    try {
      const body = getBody(req);

      const topic =
        safeString(
          body.topic ||
            body.problem ||
            body.prompt
        ).trim();

      const level =
        safeString(
          body.level,
          "beginner"
        );

      if (!topic) {
        return res.status(400).json({
          success: false,
          error:
            "Please provide an algorithm topic.",
        });
      }

      const prompt = `
You are CodeMentor AI.

Create a programming algorithm practice problem.

Topic:
${topic}

Level:
${level}

Return ONLY valid JSON:

{
  "question": "string",
  "input": "string",
  "output": "string",
  "constraints": ["string"],
  "sampleInput": "string",
  "sampleOutput": "string",
  "hint": "string"
}

Do not use Markdown fences.
`.trim();

      const text =
        await askGemini(
          prompt,
          {
            temperature: 0.3,
            maxOutputTokens: 5000,
          }
        );

      const parsed =
        extractJson(text);

      if (!parsed) {
        return res.json({
          success: true,
          question: text,
          input: "",
          output: "",
          constraints: [],
          sampleInput: "",
          sampleOutput: "",
          hint: "",
        });
      }

      return res.json({
        success: true,

        question:
          parsed.question || "",

        input:
          parsed.input || "",

        output:
          parsed.output || "",

        constraints:
          Array.isArray(
            parsed.constraints
          )
            ? parsed.constraints
            : [],

        sampleInput:
          parsed.sampleInput || "",

        sampleOutput:
          parsed.sampleOutput || "",

        hint:
          parsed.hint || "",
      });
    } catch (error) {
      console.error(
        "Algorithm practice error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Algorithm practice generation failed.",
      });
    }
  }
);

// =========================================================
// GENERAL PRACTICE
// =========================================================

app.post(
  "/api/ai/practice",
  async (req, res) => {
    try {
      const body = getBody(req);

      const topic =
        safeString(
          body.topic ||
            body.language ||
            body.prompt ||
            "programming"
        );

      const level =
        safeString(
          body.level,
          "beginner"
        );

      const prompt = `
You are CodeMentor AI.

Create one programming practice question.

Topic:
${topic}

Level:
${level}

Return ONLY valid JSON:

{
  "question": "string",
  "answer": "string",
  "hint": "string",
  "explanation": "string"
}

Do not use Markdown fences.
`.trim();

      const text =
        await askGemini(
          prompt,
          {
            temperature: 0.35,
            maxOutputTokens: 5000,
          }
        );

      const parsed =
        extractJson(text);

      if (!parsed) {
        return res.json({
          success: true,
          question: text,
          answer: "",
          hint: "",
          explanation: "",
        });
      }

      return res.json({
        success: true,

        question:
          parsed.question || "",

        answer:
          parsed.answer || "",

        hint:
          parsed.hint || "",

        explanation:
          parsed.explanation || "",
      });
    } catch (error) {
      console.error(
        "Practice error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Practice generation failed.",
      });
    }
  }
);

// =========================================================
// JUDGE0
// =========================================================

async function submitToJudge0({
  languageId,
  sourceCode,
  stdin,
}) {
  const response = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        language_id: languageId,

        source_code:
          safeString(sourceCode),

        stdin:
          safeString(stdin),
      }),
    }
  );

  const raw = await response.text();

  let data;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Judge0 returned invalid JSON: ${raw.slice(0, 500)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Judge0 request failed with HTTP ${response.status}`
    );
  }

  return data;
}

// =========================================================
// C / C++ CODE CLEANUP
// =========================================================

function normalizeLegacyCode(
  code,
  language
) {
  let result = safeString(code);

  const key =
    normalizeLanguage(language);

  if (
    key === "c" ||
    key === "cpp"
  ) {
    result = result.replace(
      /^\s*#include\s*<conio\.h>\s*$/gim,
      ""
    );

    result = result.replace(
      /^\s*clrscr\s*\(\s*\)\s*;\s*$/gim,
      ""
    );

    result = result.replace(
      /^\s*getch\s*\(\s*\)\s*;\s*$/gim,
      ""
    );

    result = result.replace(
      /\bvoid\s+main\s*\(/g,
      "int main("
    );

    if (
      /int\s+main\s*\(/.test(result) &&
      !/\breturn\s+0\s*;/.test(result)
    ) {
      result = result.replace(
        /\}\s*$/m,
        "\n    return 0;\n}\n"
      );
    }
  }

  return result.trim();
}

// =========================================================
// LANGUAGE DETECTION
// =========================================================

function detectLanguageFromCode(code) {
  const source = safeString(code);

  if (
    /#include\s*<iostream>/i.test(source) ||
    /using\s+namespace\s+std/i.test(source) ||
    /std::cout/i.test(source)
  ) {
    return "cpp";
  }

  if (
    /#include\s*<stdio\.h>/i.test(source) ||
    /printf\s*\(/i.test(source)
  ) {
    return "c";
  }

  if (
    /\bpublic\s+class\s+Main\b/.test(source) ||
    /System\.out\.println/.test(source)
  ) {
    return "java";
  }

  if (
    /\bdef\s+\w+\s*\(/.test(source) ||
    /\bimport\s+\w+/.test(source) ||
    /\bprint\s*\(/.test(source)
  ) {
    return "python";
  }

  if (
    /console\.log\s*\(/.test(source) ||
    /\bconst\s+\w+\s*=/.test(source) ||
    /\blet\s+\w+\s*=/.test(source)
  ) {
    return "javascript";
  }

  return "python";
}

// =========================================================
// CODE RUNNER
// =========================================================

app.post(
  "/api/code/run",
  async (req, res) => {
    try {
      const body = getBody(req);

      let language =
        normalizeLanguage(
          body.language
        );

      const sourceCode =
        safeString(
          body.code ||
            body.sourceCode
        );

      const stdin =
        safeString(
          body.stdin ||
            body.input
        );

      if (!sourceCode.trim()) {
        return res.status(400).json({
          success: false,
          error:
            "Please provide source code.",
        });
      }

      if (!LANGUAGES[language]) {
        language =
          detectLanguageFromCode(
            sourceCode
          );
      }

      if (!LANGUAGES[language]) {
        return res.status(400).json({
          success: false,
          error:
            "Unsupported language. Use C, C++, Python, Java or JavaScript.",
        });
      }

      const cleanedCode =
        normalizeLegacyCode(
          sourceCode,
          language
        );

      const result =
        await submitToJudge0({
          languageId:
            LANGUAGES[language]
              .judge0Id,

          sourceCode:
            cleanedCode,

          stdin,
        });

      return res.json({
        success: true,

        language:
          LANGUAGES[language].name,

        languageKey:
          language,

        stdout:
          result.stdout || "",

        stderr:
          result.stderr || "",

        compile_output:
          result.compile_output ||
          "",

        message:
          result.message || "",

        status:
          result.status || null,

        time:
          result.time || null,

        memory:
          result.memory || null,

        output:
          result.stdout ||
          result.stderr ||
          result.compile_output ||
          result.message ||
          "",
      });
    } catch (error) {
      console.error(
        "Code execution error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Code execution failed.",
      });
    }
  }
);

// =========================================================
// ALGORITHM RUNNER
// =========================================================

app.post(
  "/api/algorithm/run",
  async (req, res) => {
    try {
      const body = getBody(req);

      let language =
        normalizeLanguage(
          body.language
        );

      const code =
        safeString(
          body.code ||
            body.sourceCode
        );

      const stdin =
        safeString(
          body.stdin ||
            body.input
        );

      if (!code.trim()) {
        return res.status(400).json({
          success: false,
          error:
            "Please provide algorithm code.",
        });
      }

      if (!LANGUAGES[language]) {
        language =
          detectLanguageFromCode(
            code
          );
      }

      if (!LANGUAGES[language]) {
        return res.status(400).json({
          success: false,
          error:
            "Could not determine the programming language.",
        });
      }

      const cleanedCode =
        normalizeLegacyCode(
          code,
          language
        );

      const result =
        await submitToJudge0({
          languageId:
            LANGUAGES[language]
              .judge0Id,

          sourceCode:
            cleanedCode,

          stdin,
        });

      return res.json({
        success: true,

        language:
          LANGUAGES[language].name,

        languageKey:
          language,

        stdout:
          result.stdout || "",

        stderr:
          result.stderr || "",

        compile_output:
          result.compile_output ||
          "",

        message:
          result.message || "",

        status:
          result.status || null,

        time:
          result.time || null,

        memory:
          result.memory || null,

        output:
          result.stdout ||
          result.stderr ||
          result.compile_output ||
          result.message ||
          "",
      });
    } catch (error) {
      console.error(
        "Algorithm execution error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Algorithm execution failed.",
      });
    }
  }
);

// =========================================================
// HEALTH CHECK
// =========================================================

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,

      status: "ok",

      service:
        "CodeMentor AI Backend",

      geminiConfigured:
        Boolean(GEMINI_API_KEY),

      geminiModel:
        GEMINI_MODEL,

      judge0Configured:
        Boolean(JUDGE0_URL),

      supportedLanguages: [
        "C",
        "C++",
        "Python",
        "Java",
        "JavaScript",
      ],

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

// =========================================================
// DESKTOP EXE DOWNLOAD
// =========================================================

app.use(
  "/downloads",
  express.static(
    DOWNLOAD_DIR,
    {
      fallthrough: true,
      index: false,
      maxAge: "1h",
    }
  )
);

app.get(
  "/api/downloads/exe",
  (req, res) => {
    if (!fs.existsSync(EXE_FILE)) {
      return res.status(404).json({
        success: false,

        error:
          "CodeMentor-AI-Setup.exe has not been uploaded to the server yet.",

        expectedPath:
          "server/public/downloads/CodeMentor-AI-Setup.exe",

        downloadUrl:
          "/downloads/CodeMentor-AI-Setup.exe",
      });
    }

    return res.download(
      EXE_FILE,
      "CodeMentor-AI-Setup.exe"
    );
  }
);

// =========================================================
// ROOT
// =========================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      name:
        "CodeMentor AI Backend",

      status:
        "running",

      health:
        "/api/health",

      supportedLanguages: [
        "C",
        "C++",
        "Python",
        "Java",
        "JavaScript",
      ],
    });
  }
);

// =========================================================
// 404 HANDLER
// =========================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      error:
        "API endpoint not found.",
      path: req.originalUrl,
    });
  }
);

// =========================================================
// ERROR HANDLER
// =========================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "Unhandled server error:",
      err
    );

    if (res.headersSent) {
      return next(err);
    }

    return res.status(500).json({
      success: false,
      error:
        err.message ||
        "Internal server error.",
    });
  }
);

// =========================================================
// START SERVER
// =========================================================

app.listen(
  PORT,
  "0.0.0.0",
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
  }
);