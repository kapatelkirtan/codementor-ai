import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createRoot } from "react-dom/client";

import "./styles.css";

/* =========================================================
   API
   ========================================================= */
const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://10.209.49.186:8787"
  : "https://codementor-ai-qbdx.onrender.com";
/* =========================================================
   DESKTOP APP DETECTION
   ========================================================= */

const IS_DESKTOP_APP =
  typeof window !== "undefined" &&
  /Electron/i.test(navigator.userAgent);

/* =========================================================
   CONSTANTS
   ========================================================= */

const LANGUAGES = [
  {
    key: "c",
    name: "C",
    icon: "C",
  },
  {
    key: "cpp",
    name: "C++",
    icon: "C++",
  },
  {
    key: "python",
    name: "Python",
    icon: "Py",
  },
  {
    key: "java",
    name: "Java",
    icon: "J",
  },
  {
    key: "javascript",
    name: "JavaScript",
    icon: "JS",
  },
];

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    icon: "⌂",
  },
  {
    id: "learn",
    label: "Learn",
    icon: "📚",
  },
  {
    id: "teacher",
    label: "AI Teacher",
    icon: "🤖",
  },
  {
    id: "debugger",
    label: "AI Debugger",
    icon: "🐞",
  },
  {
    id: "generator",
    label: "Code Generator",
    icon: "⚡",
  },
  {
    id: "lab",
    label: "Code Lab",
    icon: "💻",
  },
  {
    id: "practice",
    label: "Practice",
    icon: "🎯",
  },
  {
    id: "algorithm",
    label: "Algorithms",
    icon: "🧠",
  },
];

/* =========================================================
   DEFAULT CODE
   ========================================================= */

const DEFAULT_CODE = {
  c: `#include <stdio.h>

int main(void) {
    int a, b;

    scanf("%d %d", &a, &b);

    printf("%d\\n", a + b);

    return 0;
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;

    cin >> a >> b;

    cout << a + b << endl;

    return 0;
}`,

  python: `a, b = map(int, input().split())

print(a + b)`,

  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int a = scanner.nextInt();
        int b = scanner.nextInt();

        System.out.println(a + b);
    }
}`,

  javascript: `const fs = require("fs");

const input = fs.readFileSync(0, "utf8").trim();

const [a, b] = input.split(/\\s+/).map(Number);

console.log(a + b);`,
};

const DEFAULT_ALGORITHM = {
  title: "Two Sum",
  problem:
    "Given an array of integers and a target value, find two numbers whose sum equals the target.",
  idea:
    "Use a hash map to remember values already seen. For each number, check whether target minus the current number has already been seen.",
  steps: [
    "Create an empty hash map.",
    "Traverse the array from left to right.",
    "For each value, calculate target - value.",
    "If the required value exists in the map, the pair has been found.",
    "Otherwise store the current value and its index.",
  ],
  pseudocode: `map = empty map

for each index i:
    needed = target - array[i]

    if needed exists in map:
        return map[needed], i

    map[array[i]] = i`,
  complexity: {
    time: "O(n)",
    space: "O(n)",
  },
  examples: [
    {
      input: "nums = [2, 7, 11, 15], target = 9",
      output: "[0, 1]",
      explanation:
        "2 + 7 = 9, so the first two elements form the answer.",
    },
  ],
};

/* =========================================================
   HELPERS
   ========================================================= */

function languageLabel(key) {
  const item = LANGUAGES.find(
    (language) => language.key === key
  );

  return item ? item.name : key;
}

function normalizeSolutions(data) {
  const source =
    data?.solutions ||
    data?.languages ||
    {};

  return {
    C:
      source.C ||
      source.c ||
      data?.c ||
      "",

    "C++":
      source["C++"] ||
      source.cpp ||
      data?.cpp ||
      "",

    Python:
      source.Python ||
      source.python ||
      data?.python ||
      "",

    Java:
      source.Java ||
      source.java ||
      data?.java ||
      "",

    JavaScript:
      source.JavaScript ||
      source.javascript ||
      data?.javascript ||
      "",
  };
}

function getErrorMessage(error) {
  if (!error) {
    return "Something went wrong.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error.message ||
    "Something went wrong."
  );
}

async function apiRequest(
  endpoint,
  options = {}
) {
  const requestOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  };

  // Only send JSON Content-Type when a request actually has a body.
  // This prevents the GET /api/health request from triggering
  // an unnecessary CORS preflight during local development.
  if (options.body) {
    requestOptions.headers["Content-Type"] =
      requestOptions.headers["Content-Type"] ||
      "application/json";
  }

  const response = await fetch(
    `${API}${endpoint}`,
    requestOptions
  );

  const text =
    await response.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch (_) {
    data = {
      raw: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed with HTTP ${response.status}`
    );
  }

  if (
    data &&
    data.success === false
  ) {
    throw new Error(
      data.error ||
        "The server returned an error."
    );
  }

  return data;
}

function copyText(text) {
  if (!text) {
    return Promise.reject(
      new Error("Nothing to copy.")
    );
  }

  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    return navigator.clipboard.writeText(
      text
    );
  }

  const textarea =
    document.createElement("textarea");

  textarea.value = text;

  textarea.style.position =
    "fixed";

  textarea.style.left = "-9999px";

  document.body.appendChild(
    textarea
  );

  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(
      textarea
    );
  }

  return Promise.resolve();
}

function downloadTextFile(
  filename,
  text
) {
  const blob = new Blob(
    [text],
    {
      type: "text/plain;charset=utf-8",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(url);
}

function languageExtension(
  language
) {
  switch (language) {
    case "c":
      return "c";

    case "cpp":
      return "cpp";

    case "python":
      return "py";

    case "java":
      return "java";

    case "javascript":
      return "js";

    default:
      return "txt";
  }
}

function getRunOutput(data) {
  return (
    data?.stdout ||
    data?.output ||
    data?.stderr ||
    data?.compile_output ||
    data?.message ||
    "Program finished without output."
  );
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [page, setPage] =
    useState("home");

  const [toast, setToast] =
    useState("");

  const [labInitialCode, setLabInitialCode] =
    useState("");

  const [labInitialLanguage, setLabInitialLanguage] =
    useState("python");

  const [isBackendOnline, setIsBackendOnline] =
    useState(null);

  useEffect(() => {
    let cancelled = false;

    apiRequest("/api/health")
      .then(() => {
        if (!cancelled) {
          setIsBackendOnline(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsBackendOnline(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const showToast =
    useCallback((message) => {
      setToast(message);

      window.setTimeout(() => {
        setToast("");
      }, 2800);
    }, []);

  const openLab = useCallback(
    (language, code) => {
      setLabInitialLanguage(
        language || "python"
      );

      setLabInitialCode(
        code || ""
      );

      setPage("lab");
    },
    []
  );

  return (
    <div className="app">
      <TopBar
        page={page}
        onHome={() =>
          setPage("home")
        }
        backendOnline={
          isBackendOnline
        }
      />

      <div className="main-layout">
        <Sidebar
          page={page}
          setPage={setPage}
        />

        <main className="content-area">
          {page === "home" && (
            <HomePage
              setPage={setPage}
            />
          )}

          {page === "learn" && (
            <LearnPage
              setPage={setPage}
            />
          )}

          {page === "teacher" && (
            <TeacherPage
              showToast={showToast}
            />
          )}

          {page === "debugger" && (
            <DebuggerPage
              showToast={showToast}
              openLab={openLab}
            />
          )}

          {page === "generator" && (
            <CodeGeneratorPage
              showToast={showToast}
              openLab={openLab}
            />
          )}

          {page === "lab" && (
            <LabPage
              initialCode={
                labInitialCode
              }
              initialLanguage={
                labInitialLanguage
              }
              showToast={showToast}
            />
          )}

          {page === "practice" && (
            <PracticePage
              showToast={showToast}
            />
          )}

          {page === "algorithm" && (
            <AlgorithmPage
              showToast={showToast}
              openLab={openLab}
            />
          )}
        </main>
      </div>


      <footer className="footer">
        Made By Kirtan Ka.patel
      </footer>

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TOP BAR
   ========================================================= */

function TopBar({
  page,
  onHome,
  backendOnline,
}) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="brand"
        onClick={onHome}
        aria-label="CodeMentor AI Home"
        style={{
          border: 0,
          background: "transparent",
          color: "inherit",
          padding: 0,
        }}
      >
        <div className="brand-logo">
          &lt;/&gt;
        </div>

        <div className="brand-text">
          <div className="brand-title">
            CodeMentor AI
          </div>

          <div className="brand-subtitle">
            Learn • Code • Practice
          </div>
        </div>
      </button>

      <div className="topbar-status">
        {backendOnline === true && (
          <span className="status success">
            ● AI Online
          </span>
        )}

        {backendOnline === false && (
          <span className="status error">
            ● Backend Offline
          </span>
        )}

        {backendOnline === null && (
          <span className="status">
            ● Connecting...
          </span>
        )}
      </div>
    </header>
  );
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function Sidebar({
  page,
  setPage,
}) {
  return (
    <aside className="sidebar">
      <div className="nav-section-title">
        Workspace
      </div>

      <nav className="nav-list">
        {NAV_ITEMS.map(
          (item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-button ${
                page === item.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage(item.id)
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span className="nav-label">
                {item.label}
              </span>
            </button>
          )
        )}
      </nav>
    </aside>
  );
}

/* =========================================================
   HOME
   ========================================================= */

function HomePage({
  setPage,
}) {
  return (
    <div className="content-page">
      <section className="hero">
        <h1>
          Learn programming
          <br />
          with AI.
        </h1>

        <p>
          CodeMentor AI helps you learn
          programming, generate code,
          practice algorithms, run programs,
          and understand difficult concepts
          using C, C++, Python, Java and
          JavaScript.
        </p>

        <div className="hero-actions">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() =>
              setPage("teacher")
            }
          >
            🤖 Ask AI Teacher
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() =>
              setPage("debugger")
            }
          >
            🐞 Debug Code
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() =>
              setPage("generator")
            }
          >
            ⚡ Generate Code
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() =>
              setPage("lab")
            }
          >
            💻 Open Code Lab
          </button>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            Supported Languages
          </div>

          <div className="stat-value">
            5
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            AI Learning Tools
          </div>

          <div className="stat-value">
            8+
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Online Code Runner
          </div>

          <div className="stat-value">
            ✓
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Desktop App
          </div>

          <div className="stat-value">
            EXE
          </div>
        </div>
      </div>

      <div className="grid grid-3">
        <FeatureCard
          icon="🤖"
          title="AI Teacher"
          text="Ask programming questions and receive step-by-step explanations."
          onClick={() =>
            setPage("teacher")
          }
        />

        <FeatureCard
          icon="⚡"
          title="Code Generator"
          text="Generate complete programs in C, C++, Python, Java and JavaScript."
          onClick={() =>
            setPage("generator")
          }
        />

        <FeatureCard
          icon="🧠"
          title="Algorithms"
          text="Learn algorithms, complexity, pseudocode and implementations."
          onClick={() =>
            setPage("algorithm")
          }
        />

        <FeatureCard
          icon="💻"
          title="Code Lab"
          text="Write, edit and execute programs with custom input."
          onClick={() =>
            setPage("lab")
          }
        />

        <FeatureCard
          icon="🎯"
          title="Practice"
          text="Generate programming practice questions with AI."
          onClick={() =>
            setPage("practice")
          }
        />

        <FeatureCard
          icon="🐞"
          title="AI Code Debugger"
          text="Find programming errors, understand why they happen, get fixes, and open corrected code in Code Lab."
          onClick={() =>
            setPage("debugger")
          }
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  onClick,
}) {
  return (
    <button
      type="button"
      className="topic-card"
      onClick={onClick}
      style={{
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontSize: 27,
          marginBottom: 10,
        }}
      >
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>
    </button>
  );
}

/* =========================================================
   LEARN
   ========================================================= */

function LearnPage({
  setPage,
}) {
  const topics = [
    {
      title: "Programming Basics",
      text: "Variables, data types, operators, input, output and expressions.",
    },

    {
      title: "Conditions",
      text: "Learn if, else, switch and logical decision making.",
    },

    {
      title: "Loops",
      text: "Understand for, while and do-while loops.",
    },

    {
      title: "Functions",
      text: "Create reusable functions and understand parameters and return values.",
    },

    {
      title: "Arrays",
      text: "Store and process multiple values efficiently.",
    },

    {
      title: "Strings",
      text: "Work with text and common string operations.",
    },

    {
      title: "Pointers",
      text: "Understand memory addresses and pointer operations in C and C++.",
    },

    {
      title: "Object Oriented Programming",
      text: "Classes, objects, inheritance, polymorphism and encapsulation.",
    },

    {
      title: "Data Structures",
      text: "Stacks, queues, linked lists, trees, heaps and hash tables.",
    },

    {
      title: "Algorithms",
      text: "Searching, sorting, recursion, greedy algorithms and dynamic programming.",
    },

    {
      title: "Complexity",
      text: "Learn Big-O time and space complexity.",
    },

    {
      title: "Problem Solving",
      text: "Develop a systematic approach to solving programming problems.",
    },
  ];

  return (
    <div className="content-page">
      <div className="page-header">
        <h1 className="page-title">
          Learn Programming
        </h1>

        <p className="page-subtitle">
          Build your programming knowledge
          from fundamentals to algorithms
          and problem solving.
        </p>
      </div>

      <div className="topic-grid">
        {topics.map(
          (topic) => (
            <button
              type="button"
              key={topic.title}
              className="topic-card"
              onClick={() =>
                setPage("teacher")
              }
              style={{
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <h3>
                {topic.title}
              </h3>

              <p>
                {topic.text}
              </p>
            </button>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   AI CODE DEBUGGER
   ========================================================= */

function DebuggerPage({
  showToast,
  openLab,
}) {
  const codeRef = useRef(null);

  const [language, setLanguage] =
    useState("C++");

  const [cCppStyle, setCCppStyle] =
    useState("modern");

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [code, setCode] =
    useState(DEFAULT_CODE.cpp);

  async function debugCode() {
    const sourceCode =
      codeRef.current?.value?.trim() ||
      code.trim();

    if (!sourceCode) {
      showToast(
        "Paste some code to debug first."
      );

      codeRef.current?.focus();
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await apiRequest(
        "/api/ai/debug-code",
        {
          method: "POST",
          body: JSON.stringify({
            language,
            codeStyle:
              language === "C" ||
              language === "C++"
                ? cCppStyle
                : "modern",
            code: sourceCode,
          }),
        }
      );

      setResult({
        hasErrors: Boolean(data.hasErrors),
        summary:
          data.summary ||
          "Analysis completed.",
        issues: Array.isArray(data.issues)
          ? data.issues
          : [],
        correctedCode:
          data.correctedCode ||
          sourceCode,
      });

      showToast(
        data.hasErrors
          ? "Code debugging completed."
          : "No obvious errors found."
      );
    } catch (error) {
      showToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyCorrectedCode() {
    if (!result?.correctedCode) {
      showToast(
        "No corrected code available."
      );
      return;
    }

    try {
      await copyText(result.correctedCode);
      showToast("Corrected code copied.");
    } catch (error) {
      showToast(getErrorMessage(error));
    }
  }

  function sendToCodeLab() {
    if (!result?.correctedCode) {
      showToast(
        "No corrected code available."
      );
      return;
    }

    const labLanguage =
      LANGUAGES.find(
        (item) => item.name === language
      )?.key || "python";

    openLab(
      labLanguage,
      result.correctedCode
    );
  }

  function loadExample() {
    const key =
      LANGUAGES.find(
        (item) => item.name === language
      )?.key || "cpp";

    const examples = {
      c: `#include <stdio.h>

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b)
    return 0;
}`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl
    return 0;
}`,
      python: `numbers = [1, 2, 3, 4]
print(numbers[4])`,
      java: `public class Main {
    public static void main(String[] args) {
        int a = 10;
        System.out.println(a)
    }
}`,
      javascript: `const numbers = [1, 2, 3];
console.log(numbers[3]);
console.log(missingVariable);`,
    };

    const nextCode =
      examples[key] || DEFAULT_CODE[key] || "";

    setCode(nextCode);

    if (codeRef.current) {
      codeRef.current.value = nextCode;
    }

    setResult(null);
    showToast("Example code loaded.");
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <h1 className="page-title">
          AI Code Debugger
        </h1>

        <p className="page-subtitle">
          Paste your code, let AI find programming
          errors, understand why they happen, get
          suggested fixes, and receive corrected code.
        </p>
      </div>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">
            Debug Your Code
          </h2>

          <p className="card-description">
            Supports C, C++, Python, Java and
            JavaScript. C and C++ also support
            Modern and Legacy Turbo C/Turbo C++ code.
          </p>
        </div>

        <div className="card-body">
          <div className="debugger-controls">
            <div className="form-group">
              <label
                className="label"
                htmlFor="debugger-language"
              >
                Programming Language
              </label>

              <select
                id="debugger-language"
                className="select"
                value={language}
                onChange={(event) => {
                  const nextLanguage =
                    event.target.value;

                  setLanguage(nextLanguage);

                  const key =
                    LANGUAGES.find(
                      (item) =>
                        item.name === nextLanguage
                    )?.key || "cpp";

                  const nextCode =
                    DEFAULT_CODE[key] || "";

                  setCode(nextCode);

                  if (codeRef.current) {
                    codeRef.current.value = nextCode;
                  }

                  setResult(null);
                }}
              >
                {LANGUAGES.map((item) => (
                  <option
                    key={item.key}
                    value={item.name}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {(language === "C" ||
              language === "C++") && (
              <div className="form-group">
                <label
                  className="label"
                  htmlFor="debugger-style"
                >
                  C/C++ Code Style
                </label>

                <select
                  id="debugger-style"
                  className="select"
                  value={cCppStyle}
                  onChange={(event) =>
                    setCCppStyle(
                      event.target.value
                    )
                  }
                >
                  <option value="modern">
                    Modern Standard C/C++
                  </option>

                  <option value="legacy">
                    Legacy Turbo C/Turbo C++
                  </option>
                </select>
              </div>
            )}
          </div>

          <label
            className="label"
            htmlFor="debugger-code"
          >
            Source Code
          </label>

          <textarea
            id="debugger-code"
            ref={codeRef}
            className="code-editor debugger-editor"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setResult(null);
            }}
            spellCheck="false"
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Paste your code here..."
          />

          <div className="debugger-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={debugCode}
              disabled={loading}
            >
              {loading
                ? "🐞 Debugging..."
                : "🐞 Debug Code"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadExample}
              disabled={loading}
            >
              Load Error Example
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const key =
                  LANGUAGES.find(
                    (item) =>
                      item.name === language
                  )?.key || "cpp";

                const nextCode =
                  DEFAULT_CODE[key] || "";

                setCode(nextCode);

                if (codeRef.current) {
                  codeRef.current.value = nextCode;
                }

                setResult(null);
              }}
              disabled={loading}
            >
              Reset Code
            </button>
          </div>

          {loading && (
            <div className="alert alert-info debugger-loading">
              <div className="loading">
                <span className="spinner" />
                <span>
                  AI is analyzing your code...
                </span>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="empty-state debugger-ready">
              <div className="empty-state-title">
                Ready to debug
              </div>

              <div className="empty-state-text">
                Paste code above and click Debug Code
                to find errors and get a corrected version.
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="debugger-results">
              <section className="card">
                <div className="card-body">
                  <div
                    className={`status ${
                      result.hasErrors
                        ? "error"
                        : "success"
                    }`}
                  >
                    {result.hasErrors
                      ? "● Issues Found"
                      : "● No Obvious Errors"}
                  </div>

                  <div className="debugger-summary">
                    {result.hasErrors
                      ? "Debugging Summary"
                      : "Analysis Summary"}
                  </div>

                  <p className="debugger-summary-text">
                    {result.summary}
                  </p>
                </div>
              </section>

              {result.issues.length > 0 && (
                <section className="card">
                  <div className="card-header">
                    <h2 className="card-title">
                      Problems & Fixes
                    </h2>
                  </div>

                  <div className="card-body">
                    <div className="debugger-issues">
                      {result.issues.map(
                        (issue, index) => (
                          <article
                            className="debugger-issue"
                            key={`${issue.line || "x"}-${index}`}
                          >
                            <div className="debugger-issue-header">
                              <span className="status">
                                Line {issue.line || "—"}
                              </span>

                              <span className="status warning">
                                {issue.type ||
                                  "Problem"}
                              </span>
                            </div>

                            <div className="debugger-issue-content">
                              <div>
                                <strong>
                                  Problem:
                                </strong>{" "}
                                {issue.problem ||
                                  "No problem description provided."}
                              </div>

                              <div>
                                <strong>
                                  Why:
                                </strong>{" "}
                                {issue.why ||
                                  "No explanation provided."}
                              </div>

                              <div>
                                <strong>
                                  Fix:
                                </strong>{" "}
                                {issue.fix ||
                                  "No fix provided."}
                              </div>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  </div>
                </section>
              )}

              <section className="card">
                <div className="card-header">
                  <h2 className="card-title">
                    Corrected Code
                  </h2>

                  <p className="card-description">
                    Review the corrected source before
                    running it in Code Lab.
                  </p>
                </div>

                <div className="card-body">
                  <pre className="debugger-code-output">
                    {result.correctedCode}
                  </pre>

                  <div className="debugger-actions">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={copyCorrectedCode}
                    >
                      📋 Copy Corrected Code
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={sendToCodeLab}
                    >
                      💻 Open in Code Lab
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   AI TEACHER
   ========================================================= */

function TeacherPage({
  showToast,
}) {
  const inputRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  const [messages, setMessages] =
    useState([
      {
        role: "assistant",
        text:
          "Hello! I am CodeMentor AI. Ask me anything about programming, algorithms, C, C++, Python, Java or JavaScript.",
      },
    ]);

  const [level, setLevel] =
    useState("beginner");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages]);

  async function askTeacher() {
    const question =
      inputRef.current?.value?.trim();

    if (!question || loading) {
      return;
    }

    inputRef.current.value = "";

    setMessages((current) => [
      ...current,
      {
        role: "user",
        text: question,
      },
    ]);

    setLoading(true);

    try {
      const data =
        await apiRequest(
          "/api/ai/teach",
          {
            method: "POST",

            body: JSON.stringify({
              question,
              level,
            }),
          }
        );

      const answer =
        data.answer ||
        data.response ||
        "No answer was returned.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: answer,
        },
      ]);
    } catch (error) {
      const message =
        getErrorMessage(error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            `Error: ${message}`,
        },
      ]);

      showToast(
        "AI Teacher request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      askTeacher();
    }
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <h1 className="page-title">
          AI Teacher
        </h1>

        <p className="page-subtitle">
          Ask questions and learn
          programming step by step.
        </p>
      </div>

      <div className="card chat-container">
        <div className="chat-messages">
          {messages.map(
            (message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-message ${message.role}`}
              >
                {message.text}
              </div>
            )
          )}

          {loading && (
            <div className="chat-message assistant">
              <span className="loading">
                <span className="spinner" />
                Thinking...
              </span>
            </div>
          )}

          <div
            ref={messagesEndRef}
          />
        </div>

        <div
          style={{
            padding:
              "10px 14px 0",
          }}
        >
          <label className="label">
            Student Level
          </label>

          <select
            className="select"
            value={level}
            onChange={(event) =>
              setLevel(
                event.target.value
              )
            }
          >
            <option value="beginner">
              Beginner
            </option>

            <option value="intermediate">
              Intermediate
            </option>

            <option value="advanced">
              Advanced
            </option>
          </select>
        </div>

        <div className="chat-input">
          <textarea
            ref={inputRef}
            className="textarea"
            placeholder="Ask a programming question..."
            onKeyDown={handleKeyDown}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
          />

          <button
            type="button"
            className="btn btn-primary"
            onClick={askTeacher}
            disabled={loading}
          >
            {loading
              ? "..."
              : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CODE GENERATOR
   ========================================================= */

function CodeGeneratorPage({
  showToast,
  openLab,
}) {
  const topicRef =
    useRef(null);

  const [level, setLevel] =
    useState("beginner");

  const [codeStyle, setCodeStyle] =
    useState("clean and educational");

  const [selectedLanguage, setSelectedLanguage] =
    useState("Python");

  const [cCppStyle, setCCppStyle] =
    useState("modern");

  const [solutions, setSolutions] =
    useState({
      C: "",
      "C++": "",
      Python: "",
      Java: "",
      JavaScript: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [generatedTopic, setGeneratedTopic] =
    useState("");

  async function generateCode() {
    const topic =
      topicRef.current?.value?.trim();

    if (!topic) {
      showToast(
        "Enter a programming topic or problem first."
      );

      topicRef.current?.focus();

      return;
    }

    setLoading(true);

    try {
      const data =
        await apiRequest(
          "/api/ai/generate-code",
          {
            method: "POST",

            body: JSON.stringify({
              topic,
              level,
              codeStyle:
                selectedLanguage === "C" ||
                selectedLanguage === "C++"
                  ? cCppStyle
                  : codeStyle,
            }),
          }
        );

      const nextSolutions =
        normalizeSolutions(data);

      setSolutions(
        nextSolutions
      );

      setGeneratedTopic(
        topic
      );

      showToast(
        "Code generated in all five languages."
      );
    } catch (error) {
      showToast(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  async function regenerateCppStyle(nextStyle) {
    const topic =
      topicRef.current?.value?.trim() ||
      generatedTopic;

    if (!topic || loading) {
      return;
    }

    setCCppStyle(nextStyle);
    setLoading(true);

    try {
      const data =
        await apiRequest(
          "/api/ai/generate-code",
          {
            method: "POST",

            body: JSON.stringify({
              topic,
              level,
              codeStyle: nextStyle,
            }),
          }
        );

      const nextSolutions =
        normalizeSolutions(data);

      setSolutions(
        nextSolutions
      );

      setGeneratedTopic(
        topic
      );

      showToast(
        nextStyle === "legacy"
          ? "Legacy Turbo C/Turbo C++ code generated."
          : "Modern C/C++ code generated."
      );
    } catch (error) {
      showToast(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedCode =
    solutions[
      selectedLanguage
    ] || "";

  return (
    <div className="content-page">
      <div className="page-header">
        <h1 className="page-title">
          Code Generator
        </h1>

        <p className="page-subtitle">
          Generate the same programming
          solution in C, C++, Python, Java
          and JavaScript.
        </p>
      </div>

      <div className="generator-layout">
        <div className="card generator-controls">
          <div className="card-header">
            <h2 className="card-title">
              Generate Program
            </h2>

            <p className="card-description">
              Describe what you want to
              build or solve.
            </p>
          </div>

          <div className="card-body">
            <div className="form-group">
              <label className="label">
                Topic / Problem
              </label>

              <textarea
                ref={topicRef}
                className="textarea"
                placeholder="Example: Write a program to find the largest number in an array."
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
              />
            </div>

            <div
              style={{
                height: 15,
              }}
            />

            <div className="form-group">
              <label className="label">
                Level
              </label>

              <select
                className="select"
                value={level}
                onChange={(event) =>
                  setLevel(
                    event.target.value
                  )
                }
              >
                <option value="beginner">
                  Beginner
                </option>

                <option value="intermediate">
                  Intermediate
                </option>

                <option value="advanced">
                  Advanced
                </option>
              </select>
            </div>

            <div
              style={{
                height: 15,
              }}
            />

            <div className="form-group">
              <label className="label">
                Code Style
              </label>

              <select
                className="select"
                value={codeStyle}
                onChange={(event) =>
                  setCodeStyle(
                    event.target.value
                  )
                }
              >
                <option value="clean and educational">
                  Clean and Educational
                </option>

                <option value="short and simple">
                  Short and Simple
                </option>

                <option value="optimized">
                  Optimized
                </option>

                <option value="interview style">
                  Interview Style
                </option>
              </select>
            </div>

            <div
              style={{
                height: 18,
              }}
            />

            <button
              type="button"
              className="btn btn-primary"
              onClick={generateCode}
              disabled={loading}
              style={{
                width: "100%",
              }}
            >
              {loading
                ? "Generating..."
                : "⚡ Generate All Languages"}
            </button>
          </div>
        </div>

        <div>
          {!generatedTopic &&
            !loading && (
              <div className="empty-state">
                <div className="empty-state-title">
                  No code generated yet
                </div>

                <div className="empty-state-text">
                  Enter a programming
                  problem and click Generate.
                </div>
              </div>
            )}

          {loading && (
            <div className="empty-state">
              <div className="spinner" />

              <div
                className="empty-state-title"
                style={{
                  marginTop: 15,
                }}
              >
                Generating solutions...
              </div>

              <div className="empty-state-text">
                C • C++ • Python • Java •
                JavaScript
              </div>
            </div>
          )}

          {generatedTopic && !loading && (
            <div className="card solution-card">
              <div className="solution-header">
                <div>
                  <div className="solution-language">
                    {generatedTopic}
                  </div>

                  <div
                    style={{
                      color:
                        "var(--muted)",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    Five-language solution
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    onClick={() =>
                      copyText(
                        selectedCode
                      ).then(() =>
                        showToast(
                          `${selectedLanguage} code copied.`
                        )
                      )
                    }
                  >
                    Copy
                  </button>

                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={() =>
                      openLab(
                        LANGUAGES.find(
                          (item) =>
                            item.name ===
                            selectedLanguage
                        )?.key ||
                          "python",
                        selectedCode
                      )
                    }
                  >
                    Open in Code Lab
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderBottom:
                    "1px solid var(--border)",
                }}
              >
                <div className="language-tabs">
                  {LANGUAGES.map(
                    (language) => (
                      <button
                        key={language.key}
                        type="button"
                        className={`language-tab ${
                          selectedLanguage ===
                          language.name
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedLanguage(
                            language.name
                          )
                        }
                      >
                        {language.name}
                      </button>
                    )
                  )}
                </div>

                {(selectedLanguage === "C" ||
                  selectedLanguage === "C++") && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 10,
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      background: "var(--panel)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        marginBottom: 8,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {selectedLanguage} Code Style
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className={`btn btn-small ${
                          cCppStyle === "modern"
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                        onClick={() =>
                          regenerateCppStyle("modern")
                        }
                        disabled={loading || cCppStyle === "modern"}
                      >
                        Modern Style
                      </button>

                      <button
                        type="button"
                        className={`btn btn-small ${
                          cCppStyle === "legacy"
                            ? "btn-primary"
                            : "btn-secondary"
                        }`}
                        onClick={() =>
                          regenerateCppStyle("legacy")
                        }
                        disabled={loading || cCppStyle === "legacy"}
                      >
                        Legacy Turbo C Style
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <pre className="solution-code">
                {selectedCode ||
                  "No code returned for this language."}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CODE LAB
   ========================================================= */

function LabPage({
  initialCode,
  initialLanguage,
  showToast,
}) {
  const codeRef =
    useRef(null);

  const stdinRef =
    useRef(null);

  const outputRef =
    useRef(null);

  const [language, setLanguage] =
    useState(
      initialLanguage ||
        "python"
    );

  const [output, setOutput] =
    useState("");

  const [status, setStatus] =
    useState(null);

  const [running, setRunning] =
    useState(false);

  /*
   * Important:
   *
   * The editor is intentionally UNCONTROLLED.
   *
   * We do NOT put code in React state on every
   * keystroke. This prevents Android WebView from
   * rerendering the textarea while the keyboard is
   * open and jumping the page.
   */

  useEffect(() => {
    const editor =
      codeRef.current;

    if (!editor) {
      return;
    }

    if (
      initialCode &&
      initialCode !== editor.value
    ) {
      editor.value =
        initialCode;
    }
  }, [initialCode]);

  useEffect(() => {
    const editor =
      codeRef.current;

    if (!editor) {
      return;
    }

    if (
      !initialCode &&
      !editor.value
    ) {
      editor.value =
        DEFAULT_CODE[
          language
        ] || "";
    }
  }, [
    language,
    initialCode,
  ]);

  useEffect(() => {
    if (
      !codeRef.current
    ) {
      return;
    }

    /*
     * Only replace editor contents when
     * changing language and the current editor
     * still contains the previous default code.
     */
    const current =
      codeRef.current.value;

    const previousDefaults =
      Object.values(
        DEFAULT_CODE
      );

    if (
      !current ||
      previousDefaults.includes(
        current
      )
    ) {
      codeRef.current.value =
        DEFAULT_CODE[
          language
        ] || "";
    }
  }, [language]);

  function selectLanguage(
    nextLanguage
  ) {
    setLanguage(
      nextLanguage
    );

    setOutput("");
    setStatus(null);

    window.setTimeout(() => {
      if (
        codeRef.current
      ) {
        codeRef.current.focus();
      }
    }, 0);
  }

  async function runCode() {
    const code =
      codeRef.current?.value ||
      "";

    const stdin =
      stdinRef.current?.value ||
      "";

    if (!code.trim()) {
      showToast(
        "Write some code first."
      );

      return;
    }

    setRunning(true);
    setOutput(
      "Running program..."
    );
    setStatus("running");

    try {
      const data =
        await apiRequest(
          "/api/code/run",
          {
            method: "POST",

            body: JSON.stringify({
              language,
              code,
              stdin,
            }),
          }
        );

      const result =
        getRunOutput(data);

      setOutput(result);

      if (
        data?.stderr ||
        data?.compile_output
      ) {
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch (error) {
      const message =
        getErrorMessage(error);

      setOutput(
        `Execution Error\n\n${message}`
      );

      setStatus("error");

      showToast(
        "Code execution failed."
      );
    } finally {
      setRunning(false);
    }
  }

  function clearEditor() {
    if (
      codeRef.current
    ) {
      codeRef.current.value =
        "";
    }

    if (
      stdinRef.current
    ) {
      stdinRef.current.value =
        "";
    }

    setOutput("");
    setStatus(null);
  }

  function resetEditor() {
    if (
      codeRef.current
    ) {
      codeRef.current.value =
        DEFAULT_CODE[
          language
        ] || "";
    }

    setOutput("");
    setStatus(null);
  }

  function downloadCode() {
    const code =
      codeRef.current?.value ||
      "";

    downloadTextFile(
      `codementor-${languageExtension(
        language
      )}`,
      code
    );

    showToast(
      "Code file downloaded."
    );
  }

  return (
    <main className="content-page lab-page">
      <div className="page-header">
        <h1 className="page-title">
          Code Lab
        </h1>

        <p className="page-subtitle">
          Write and run programs in C,
          C++, Python, Java and JavaScript.
        </p>
      </div>

      <div className="lab-layout">
        <section className="card editor-panel">
          <div className="editor-toolbar">
            <div className="editor-toolbar-left">
              <div className="language-tabs">
                {LANGUAGES.map(
                  (item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`language-tab ${
                        language ===
                        item.key
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        selectLanguage(
                          item.key
                        )
                      }
                    >
                      {item.name}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="editor-toolbar-right">
              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={
                  resetEditor
                }
              >
                Reset
              </button>

              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={
                  clearEditor
                }
              >
                Clear
              </button>

              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={
                  downloadCode
                }
              >
                Download
              </button>
            </div>
          </div>

          <div
            style={{
              padding: 16,
            }}
          >
            <label className="label">
              SOURCE CODE
            </label>

            <textarea
              ref={codeRef}
              className="code-editor"
              defaultValue={
                DEFAULT_CODE[
                  language
                ]
              }
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
              placeholder="Write your code here..."
              onKeyDown={(event) => {
                /*
                 * Basic Tab support without
                 * updating React state.
                 */
                if (
                  event.key ===
                  "Tab"
                ) {
                  event.preventDefault();

                  const target =
                    event.currentTarget;

                  const start =
                    target.selectionStart;

                  const end =
                    target.selectionEnd;

                  const value =
                    target.value;

                  target.value =
                    value.slice(
                      0,
                      start
                    ) +
                    "  " +
                    value.slice(
                      end
                    );

                  target.selectionStart =
                    start + 2;

                  target.selectionEnd =
                    start + 2;
                }
              }}
            />

            <div className="lab-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  runCode
                }
                disabled={running}
              >
                {running
                  ? "Running..."
                  : "▶ Run Code"}
              </button>
            </div>
          </div>
        </section>

        <aside className="lab-side">
          <section className="card input-panel">
            <div className="card-header">
              <h2 className="card-title">
                INPUT
              </h2>

              <p className="card-description">
                Provide standard input for
                your program.
              </p>
            </div>

            <div className="card-body">
              <textarea
                ref={stdinRef}
                className="stdin-editor"
                defaultValue=""
                placeholder="Example: 10 20"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                inputMode="text"
              />
            </div>
          </section>

          <section className="card output-panel">
            <div className="card-header">
              <h2 className="card-title">
                OUTPUT
              </h2>

              {status ===
                "success" && (
                <div
                  style={{
                    marginTop: 8,
                  }}
                >
                  <span className="status success">
                    ● Program finished
                  </span>
                </div>
              )}

              {status ===
                "error" && (
                <div
                  style={{
                    marginTop: 8,
                  }}
                >
                  <span className="status error">
                    ● Execution error
                  </span>
                </div>
              )}

              {status ===
                "running" && (
                <div
                  style={{
                    marginTop: 8,
                  }}
                >
                  <span className="status">
                    ● Running
                  </span>
                </div>
              )}
            </div>

            <div className="card-body">
              <textarea
                ref={outputRef}
                className="output-editor"
                value={output}
                readOnly
                placeholder="Program output will appear here..."
              />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

/* =========================================================
   PRACTICE
   ========================================================= */

function PracticePage({
  showToast,
}) {
  const topicRef =
    useRef(null);

  const [level, setLevel] =
    useState("beginner");

  const [question, setQuestion] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [showAnswer, setShowAnswer] =
    useState(false);

  async function generatePractice() {
    const topic =
      topicRef.current?.value?.trim() ||
      "programming";

    setLoading(true);
    setShowAnswer(false);

    try {
      const data =
        await apiRequest(
          "/api/ai/practice",
          {
            method: "POST",

            body: JSON.stringify({
              topic,
              level,
            }),
          }
        );

      setQuestion({
        question:
          data.question || "",
        answer:
          data.answer || "",
        hint:
          data.hint || "",
        explanation:
          data.explanation || "",
      });
    } catch (error) {
      showToast(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <h1 className="page-title">
          Practice
        </h1>

        <p className="page-subtitle">
          Generate programming questions
          and test your understanding.
        </p>
      </div>

      <div className="practice-grid">
        <section className="card practice-card">
          <h3>
            Create Practice Question
          </h3>

          <p>
            Choose a topic and difficulty
            level.
          </p>

          <label className="label">
            Topic
          </label>

          <textarea
            ref={topicRef}
            className="textarea"
            placeholder="Example: arrays, loops, recursion, sorting..."
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
          />

          <div
            style={{
              height: 14,
            }}
          />

          <label className="label">
            Level
          </label>

          <select
            className="select"
            value={level}
            onChange={(event) =>
              setLevel(
                event.target.value
              )
            }
          >
            <option value="beginner">
              Beginner
            </option>

            <option value="intermediate">
              Intermediate
            </option>

            <option value="advanced">
              Advanced
            </option>
          </select>

          <div
            style={{
              marginTop: 15,
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={
                generatePractice
              }
              disabled={loading}
              style={{
                width: "100%",
              }}
            >
              {loading
                ? "Generating..."
                : "🎯 Generate Question"}
            </button>
          </div>
        </section>

        <section className="card practice-card">
          {!question && (
            <div className="empty-state">
              <div className="empty-state-title">
                Ready to practice?
              </div>

              <div className="empty-state-text">
                Generate a question to
                begin.
              </div>
            </div>
          )}

          {question && (
            <>
              <h3>
                Question
              </h3>

              <div className="question-box">
                {question.question}
              </div>

              {question.hint && (
                <div
                  className="alert alert-info"
                  style={{
                    marginTop: 14,
                  }}
                >
                  <strong>
                    Hint:
                  </strong>

                  <span>
                    {question.hint}
                  </span>
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setShowAnswer(
                    (value) =>
                      !value
                  )
                }
              >
                {showAnswer
                  ? "Hide Answer"
                  : "Show Answer"}
              </button>

              {showAnswer && (
                <div
                  className="question-box"
                  style={{
                    marginTop: 15,
                  }}
                >
                  <strong>
                    Answer
                  </strong>

                  <div
                    style={{
                      marginTop: 8,
                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    {question.answer ||
                      "No answer returned."}
                  </div>

                  {question.explanation && (
                    <>
                      <hr
                        style={{
                          border: 0,
                          borderTop:
                            "1px solid var(--border)",
                          margin:
                            "16px 0",
                        }}
                      />

                      <strong>
                        Explanation
                      </strong>

                      <div
                        style={{
                          marginTop: 8,
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {
                          question.explanation
                        }
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   ALGORITHM GENERATOR
   ========================================================= */

function AlgorithmPage({
  showToast,
}) {
  const topicRef = useRef(null);

  const [level, setLevel] =
    useState("beginner");

  const [algorithm, setAlgorithm] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  function getAlgorithmCopyText() {
    if (!algorithm) return "";

    const lines = [
      `Algorithm: ${algorithm.title}`,
      "",
      algorithm.name,
      algorithm.operation || "",
      "",
      "Variables:",
      ...algorithm.variables,
      "",
      "Steps:",
      ...algorithm.steps,
    ];

    return lines.join("\n").trim();
  }

  async function copyAlgorithm() {
    const text = getAlgorithmCopyText();

    if (!text) {
      showToast("No algorithm to copy.");
      return;
    }

    try {
      await copyText(text);
      showToast("Algorithm copied to clipboard.");
    } catch (error) {
      showToast(getErrorMessage(error));
    }
  }

  async function generateAlgorithm() {
    const topic =
      topicRef.current?.value?.trim();

    if (!topic) {
      showToast(
        "Enter an algorithm topic or problem."
      );

      topicRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const data =
        await apiRequest(
          "/api/ai/generate-algorithm",
          {
            method: "POST",

            body: JSON.stringify({
              topic,
              level,
            }),
          }
        );

      setAlgorithm({
        title:
          data.title || topic,

        name:
          data.name || topic,

        operation:
          data.operation || "",

        variables:
          Array.isArray(data.variables)
            ? data.variables
            : [],

        steps:
          Array.isArray(data.steps)
            ? data.steps
            : [],
      });

      showToast(
        "Algorithm generated."
      );
    } catch (error) {
      showToast(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <h1 className="page-title">
          Algorithm Generator
        </h1>

        <p className="page-subtitle">
          Generate simple exam-ready algorithms in notebook style.
        </p>
      </div>

      <div className="algorithm-layout">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">
              Algorithm Topic
            </h2>

            <p className="card-description">
              Enter the algorithm or operation you want to generate.
            </p>
          </div>

          <div className="card-body">
            <label className="label">
              Topic / Operation
            </label>

            <textarea
              ref={topicRef}
              className="textarea"
              placeholder="Example: Array Update Operation"
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
            />

            <div
              style={{
                height: 14,
              }}
            />

            <label className="label">
              Level
            </label>

            <select
              className="select"
              value={level}
              onChange={(event) =>
                setLevel(
                  event.target.value
                )
              }
            >
              <option value="beginner">
                Beginner
              </option>

              <option value="intermediate">
                Intermediate
              </option>

              <option value="advanced">
                Advanced
              </option>
            </select>

            <div
              style={{
                marginTop: 16,
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  generateAlgorithm
                }
                disabled={loading}
                style={{
                  width: "100%",
                }}
              >
                {loading
                  ? "Generating..."
                  : "🧠 Generate Algorithm"}
              </button>
            </div>
          </div>
        </section>

        {!algorithm && !loading && (
          <div className="empty-state">
            <div className="empty-state-title">
              No algorithm generated
            </div>

            <div className="empty-state-text">
              Enter a topic or operation and click Generate.
            </div>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <span className="spinner" />

            <div
              className="empty-state-title"
              style={{
                marginTop: 15,
              }}
            >
              Generating algorithm...
            </div>

            <div className="empty-state-text">
              Creating title, variables and steps.
            </div>
          </div>
        )}

        {algorithm && !loading && (
          <section className="card">
            <div className="card-body">
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 16,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={copyAlgorithm}
                >
                  📋 Copy Algorithm
                </button>
              </div>

              <div className="algorithm-notebook">
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: 8,
                  }}
                >
                  Algorithm: {algorithm.title}
                </h2>

                <div
                  style={{
                    fontFamily:
                      "var(--mono)",
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  Algorithm:
                </div>

                <div
                  style={{
                    fontFamily:
                      "var(--mono)",
                    fontWeight: 700,
                    whiteSpace: "pre-wrap",
                    marginBottom: 4,
                  }}
                >
                  {algorithm.name}
                </div>

                {algorithm.operation && (
                  <div
                    style={{
                      fontFamily:
                        "var(--mono)",
                      whiteSpace: "pre-wrap",
                      marginBottom: 22,
                    }}
                  >
                    {algorithm.operation}
                  </div>
                )}

                <h3
                  style={{
                    marginBottom: 10,
                  }}
                >
                  Variables:
                </h3>

                <div
                  style={{
                    fontFamily:
                      "var(--mono)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.75,
                  }}
                >
                  {algorithm.variables.length >
                  0 ? (
                    algorithm.variables.map(
                      (variable, index) => (
                        <div
                          key={index}
                        >
                          {variable}
                        </div>
                      )
                    )
                  ) : (
                    <div>
                      No variables specified.
                    </div>
                  )}
                </div>

                <h3
                  style={{
                    marginTop: 24,
                    marginBottom: 10,
                  }}
                >
                  Steps:
                </h3>

                <div
                  className="algorithm-handwritten"
                >
                  {algorithm.steps.length >
                  0 ? (
                    algorithm.steps.map(
                      (step, index) => (
                        <div
                          key={index}
                          style={{
                            whiteSpace:
                              "pre-wrap",
                            minHeight: 24,
                          }}
                        >
                          {step}
                        </div>
                      )
                    )
                  ) : (
                    <div>
                      No steps returned.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TOAST
   ========================================================= */

function ToastStyle() {
  return null;
}

/* =========================================================
   ROOT
   ========================================================= */

const rootElement =
  document.getElementById(
    "root"
  );

if (!rootElement) {
  throw new Error(
    "Could not find #root element."
  );
}

createRoot(
  rootElement
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);