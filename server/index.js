require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = Number(process.env.PORT || 8787);
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "http://localhost:5173";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const JUDGE0_URL = (
  process.env.JUDGE0_URL || "https://ce.judge0.com"
).replace(/\/+$/, "");

const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "";
const JUDGE0_AUTH_USER = process.env.JUDGE0_AUTH_USER || "";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);

app.use(express.json({ limit: "5mb" }));

/* =========================================================
   LANGUAGES
========================================================= */

const LANGUAGES = {
  c: {
    name: "C",
    id: 50,
  },

  cpp: {
    name: "C++",
    id: 54,
  },

  python: {
    name: "Python",
    id: 71,
  },

  java: {
    name: "Java",
    id: 62,
  },

  javascript: {
    name: "JavaScript",
    id: 63,
  },
};

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    application: "CodeMentor AI",
    gemini: Boolean(GEMINI_API_KEY),
    geminiModel: GEMINI_MODEL,
    judge0: JUDGE0_URL,
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(GEMINI_API_KEY),
    judge0Configured: true,
  });
});

/* =========================================================
   GEMINI
========================================================= */

async function askGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key is missing. Check your .env file."
    );
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
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
        temperature: 0.15,
        maxOutputTokens: 6000,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `Gemini request failed with status ${response.status}.`
    );
  }

  const answer =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";

  if (!answer.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return answer.trim();
}

/* =========================================================
   CLEAN AI GENERATED CODE
========================================================= */

function cleanGeneratedCode(text, language) {
  let code = String(text || "").trim();

  /* Remove Markdown fences */

  code = code
    .replace(/^```[a-zA-Z0-9_+#.-]*\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  /* Remove common AI introductory text */

  const lines = code.split("\n");

  const cleaned = [];

  for (const line of lines) {
    const lower = line.trim().toLowerCase();

    const unwanted = [
      "here is the code",
      "here's the code",
      "here is the complete code",
      "here's the complete code",
      "let's fix",
      "lets fix",
      "wait, let's",
      "wait, lets",
      "the final code",
      "the corrected code",
      "the correct code",
      "this program will",
      "this program finds",
      "i'll provide",
      "i will provide",
    ];

    if (
      unwanted.some((phrase) =>
        lower.startsWith(phrase)
      )
    ) {
      continue;
    }

    cleaned.push(line);
  }

  code = cleaned.join("\n").trim();

  /* C / C++ */

  if (language === "c" || language === "cpp") {
    const includePosition = code.indexOf("#include");

    if (includePosition > 0) {
      code = code.substring(includePosition).trim();
    }

    /* Remove obvious AI meta-comments */

    code = code
      .split("\n")
      .filter((line) => {
        const value = line.trim().toLowerCase();

        return !(
          value.startsWith("// wait") ||
          value.startsWith("// let's") ||
          value.startsWith("// lets") ||
          value.startsWith("// here is") ||
          value.startsWith("// here's") ||
          value.startsWith("// the final") ||
          value.startsWith("// corrected code")
        );
      })
      .join("\n");
  }

  /* Python */

  if (language === "python") {
    code = code
      .split("\n")
      .filter((line) => {
        const value = line.trim().toLowerCase();

        return !(
          value.startsWith("# wait") ||
          value.startsWith("# let's") ||
          value.startsWith("# lets") ||
          value.startsWith("# here is") ||
          value.startsWith("# here's") ||
          value.startsWith("# the final")
        );
      })
      .join("\n");
  }

  return code.trim();
}

/* =========================================================
   AI TEACHER
========================================================= */

app.post("/api/ai/teach", async (req, res) => {
  try {
    const language =
      String(req.body?.language || "Python");

    const level =
      String(req.body?.level || "Beginner");

    const question =
      String(req.body?.question || "").trim();

    if (!question) {
      return res.status(400).json({
        error: "Please enter your programming question.",
      });
    }

    const prompt = `
You are CodeMentor AI.

You are an expert programming teacher who teaches:

C
C++
Python
Java
JavaScript

Teach the student using ${language}.

Student level:
${level}

Student question:
${question}

IMPORTANT RULES:

- Explain everything in very easy language.
- Assume the student may be a beginner.
- Give practical examples.
- Explain concepts step by step.
- If code is requested, provide complete working code.
- Never provide pseudocode when a real program is requested.
- Never invent execution results.
- Explain important lines of code.
- Mention common mistakes when useful.
- Keep the answer organized and easy to read.
`;

    const answer = await askGemini(prompt);

    res.json({
      answer,
      language,
      level,
    });
  } catch (error) {
    console.error("AI Teacher Error:", error);

    res.status(500).json({
      error:
        error.message ||
        "AI Teacher request failed.",
    });
  }
});

/* =========================================================
   CODE GENERATOR
========================================================= */

app.post("/api/ai/generate-code", async (req, res) => {
  try {
    const language =
      String(req.body?.language || "python")
        .toLowerCase();

    const level =
      String(req.body?.level || "Beginner");

    const topic =
      String(req.body?.topic || "").trim();

    if (!topic) {
      return res.status(400).json({
        error: "Please enter a code topic.",
      });
    }

    const languageInfo = LANGUAGES[language];

    if (!languageInfo) {
      return res.status(400).json({
        error: "Unsupported programming language.",
      });
    }

    const prompt = `
You are CodeMentor AI, an expert programming instructor.

Generate a complete working ${languageInfo.name} program.

PROGRAM TOPIC:
${topic}

STUDENT LEVEL:
${level}

STRICT REQUIREMENTS:

1. Return ONLY source code.
2. Do NOT use Markdown code fences.
3. Do NOT write explanations outside the code.
4. Do NOT write "Here is the code".
5. Do NOT write "Let's fix".
6. Do NOT write "Wait".
7. Do NOT write AI reasoning.
8. Do NOT put AI reasoning inside comments.
9. Do NOT write fake execution results.
10. The program must be complete.
11. The program must be compilable/runnable.
12. Use standard modern ${languageInfo.name}.
13. Read required input from standard input.
14. Print the result clearly.
15. Keep the program beginner-friendly.

SPECIAL RULES:

For C:
- Use #include <stdio.h>
- Use int main(void)
- Do not use conio.h
- Do not use clrscr()
- Do not use getch()
- Do not use void main()

For C++:
- Use standard C++.
- Use int main().

For Python:
- Use Python 3.
- Use standard input/output.

For Java:
- Use public class Main.
- Use a valid main method.

For JavaScript:
- Use Node.js compatible JavaScript.
- Use standard input when input is required.

Return ONLY the source code.
`;

    const raw = await askGemini(prompt);

    const code = cleanGeneratedCode(
      raw,
      language
    );

    if (!code) {
      throw new Error(
        "No usable source code was generated."
      );
    }

    res.json({
      language,
      level,
      topic,
      code,
    });
  } catch (error) {
    console.error("Code Generator Error:", error);

    res.status(500).json({
      error:
        error.message ||
        "Code generation failed.",
    });
  }
});

/* =========================================================
   JUDGE0 HEADERS
========================================================= */

function getJudgeHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  if (JUDGE0_API_KEY.trim()) {
    headers["X-Auth-Token"] =
      JUDGE0_API_KEY.trim();
  }

  if (JUDGE0_AUTH_USER.trim()) {
    headers["X-Auth-User"] =
      JUDGE0_AUTH_USER.trim();
  }

  return headers;
}

/* =========================================================
   BASE64
========================================================= */

function encodeBase64(value) {
  return Buffer.from(
    String(value || ""),
    "utf8"
  ).toString("base64");
}

function decodeBase64(value) {
  if (!value) {
    return "";
  }

  try {
    return Buffer.from(
      value,
      "base64"
    ).toString("utf8");
  } catch {
    return String(value);
  }
}

/* =========================================================
   JUDGE0 SUBMIT
========================================================= */

async function submitCode(
  languageId,
  sourceCode,
  stdin
) {
  const url =
    `${JUDGE0_URL}/submissions` +
    `?base64_encoded=true&wait=false`;

  const body = {
    language_id: languageId,
    source_code: encodeBase64(sourceCode),
  };

  if (String(stdin || "").length > 0) {
    body.stdin = encodeBase64(stdin);
  }

  console.log(
    `Submitting code to Judge0: language ${languageId}`
  );

  const response = await fetch(url, {
    method: "POST",
    headers: getJudgeHeaders(),
    body: JSON.stringify(body),
  });

  const text = await response.text();

  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error(
      "Judge0 submission response:",
      response.status,
      text
    );

    throw new Error(
      data?.error ||
        data?.message ||
        `Judge0 submission failed with status ${response.status}.`
    );
  }

  if (!data?.token) {
    throw new Error(
      "Judge0 did not return an execution token."
    );
  }

  return data.token;
}

/* =========================================================
   JUDGE0 RESULT
========================================================= */

async function getCodeResult(token) {
  const url =
    `${JUDGE0_URL}/submissions/` +
    `${encodeURIComponent(token)}` +
    `?base64_encoded=true`;

  const response = await fetch(url, {
    method: "GET",
    headers: getJudgeHeaders(),
  });

  const text = await response.text();

  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error(
      "Judge0 result response:",
      response.status,
      text
    );

    throw new Error(
      data?.error ||
        data?.message ||
        `Judge0 result request failed with status ${response.status}.`
    );
  }

  return data;
}

/* =========================================================
   WAIT FOR RESULT
========================================================= */

async function waitForResult(token) {
  const maximumAttempts = 40;

  for (
    let attempt = 0;
    attempt < maximumAttempts;
    attempt++
  ) {
    const result =
      await getCodeResult(token);

    const statusId =
      Number(result?.status?.id || 0);

    console.log(
      `Judge0 status: ${
        result?.status?.description ||
        "Unknown"
      }`
    );

    /*
      1 = In Queue
      2 = Processing
      3+ = Finished
    */

    if (statusId >= 3) {
      return result;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 750)
    );
  }

  throw new Error(
    "Judge0 took too long to execute the program."
  );
}

/* =========================================================
   CODE LAB RUN
========================================================= */

app.post("/api/code/run", async (req, res) => {
  try {
    const language =
      String(req.body?.language || "")
        .toLowerCase();

    const code =
      String(req.body?.code || "");

    const stdin =
      req.body?.stdin == null
        ? ""
        : String(req.body.stdin);

    if (!language) {
      return res.status(400).json({
        error:
          "Please select a programming language.",
      });
    }

    if (!code.trim()) {
      return res.status(400).json({
        error: "Please enter some code.",
      });
    }

    const languageInfo =
      LANGUAGES[language];

    if (!languageInfo) {
      return res.status(400).json({
        error:
          "This programming language is not supported.",
      });
    }

    const token = await submitCode(
      languageInfo.id,
      code,
      stdin
    );

    const result =
      await waitForResult(token);

    const stdout =
      decodeBase64(result.stdout);

    const stderr =
      decodeBase64(result.stderr);

    const compileOutput =
      decodeBase64(
        result.compile_output
      );

    const message =
      decodeBase64(result.message);

    res.json({
      status:
        result.status?.description ||
        "Unknown",

      stdout,

      stderr,

      compileOutput,

      message,

      time:
        result.time || null,

      memory:
        result.memory || null,

      token,
    });
  } catch (error) {
    console.error(
      "CODE LAB ERROR:",
      error
    );

    res.status(500).json({
      error:
        error.message ||
        "Code execution failed.",
    });
  }
});

/* =========================================================
   START
========================================================= */

app.listen(PORT, () => {
  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "          CODEMENTOR AI"
  );
  console.log(
    "======================================"
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
    `Judge0 URL: ${JUDGE0_URL}`
  );
  console.log(
    "======================================"
  );
  console.log("");
});