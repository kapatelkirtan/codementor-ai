import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

/* =========================================================
   API CONFIGURATION
   Local development -> localhost
   Production -> Render backend
========================================================= */

const API =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:8787"
    : "https://codementor-ai-qbdx.onrender.com");

/* =========================================================
   LANGUAGES
========================================================= */

const LANGUAGES = {
  c: {
    name: "C",
    starter: `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}`,
  },

  cpp: {
    name: "C++",
    starter: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  },

  python: {
    name: "Python",
    starter: `print("Hello, World!")`,
  },

  java: {
    name: "Java",
    starter: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  },

  javascript: {
    name: "JavaScript",
    starter: `console.log("Hello, World!");`,
  },
};

const LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [page, setPage] = useState("home");

  const [language, setLanguage] = useState("c");

  const [level, setLevel] = useState("Beginner");

  const [teacherQuestion, setTeacherQuestion] =
    useState("");

  const [teacherAnswer, setTeacherAnswer] =
    useState("");

  const [teacherBusy, setTeacherBusy] =
    useState(false);

  const [codeTopic, setCodeTopic] =
    useState("");

  const [generatedCode, setGeneratedCode] =
    useState("");

  const [generatorBusy, setGeneratorBusy] =
    useState(false);

  const [code, setCode] =
    useState(LANGUAGES.c.starter);

  const [stdin, setStdin] =
    useState("");

  const [output, setOutput] =
    useState("");

  const [running, setRunning] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  /* =======================================================
     LANGUAGE CHANGE
  ======================================================= */

  function changeLanguage(value) {
    setLanguage(value);

    if (page === "lab") {
      setCode(LANGUAGES[value].starter);
      setOutput("");
    }
  }

  /* =======================================================
     AI TEACHER
  ======================================================= */

  async function askTeacher() {
    if (!teacherQuestion.trim()) {
      setTeacherAnswer(
        "Please enter a question first."
      );
      return;
    }

    setTeacherBusy(true);
    setTeacherAnswer("");

    try {
      const response = await fetch(
        `${API}/api/ai/teach`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            language: LANGUAGES[language].name,
            level,
            question: teacherQuestion,
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Backend returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI Teacher request failed."
        );
      }

      setTeacherAnswer(
        data.answer ||
          "No answer received."
      );
    } catch (error) {
      setTeacherAnswer(
        `Error: ${error.message}`
      );
    } finally {
      setTeacherBusy(false);
    }
  }

  /* =======================================================
     AI CODE GENERATOR
  ======================================================= */

  async function generateCode() {
    if (!codeTopic.trim()) {
      setGeneratedCode(
        "Please enter a code topic first."
      );
      return;
    }

    setGeneratorBusy(true);
    setGeneratedCode("");

    try {
      const response = await fetch(
        `${API}/api/ai/generate-code`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            language,
            level,
            topic: codeTopic,
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "The backend returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Code generation failed."
        );
      }

      setGeneratedCode(
        data.code || ""
      );
    } catch (error) {
      setGeneratedCode(
        `ERROR: ${error.message}`
      );
    } finally {
      setGeneratorBusy(false);
    }
  }

  /* =======================================================
     COPY GENERATED CODE
  ======================================================= */

  async function copyGeneratedCode() {
    if (!generatedCode) return;

    try {
      await navigator.clipboard.writeText(
        generatedCode
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  /* =======================================================
     SEND GENERATED CODE TO LAB
  ======================================================= */

  function sendToLab() {
    if (!generatedCode) return;

    setCode(generatedCode);
    setOutput("");
    setPage("lab");
  }

  /* =======================================================
     RUN CODE
  ======================================================= */

  async function runCode() {
    if (!code.trim()) {
      setOutput(
        "Please enter some code."
      );
      return;
    }

    setRunning(true);

    setOutput(
      "Running your program..."
    );

    try {
      const response = await fetch(
        `${API}/api/code/run`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            language,
            code,
            stdin,
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Backend returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Code execution failed."
        );
      }

      /*
        Only show actual execution information.
        Do not show STATUS / TIME / MEMORY labels.
      */

      let result = "";

      if (data.compileOutput?.trim()) {
        result +=
          data.compileOutput.trim();
      }

      if (data.stderr?.trim()) {
        if (result) result += "\n";
        result += data.stderr.trim();
      }

      if (data.message?.trim()) {
        if (result) result += "\n";
        result += data.message.trim();
      }

      if (data.stdout?.trim()) {
        if (result) result += "\n";
        result += data.stdout.trim();
      }

      if (!result) {
        if (data.status === "Accepted") {
          result =
            "Program executed successfully with no output.";
        } else {
          result =
            data.status ||
            "Program finished.";
        }
      }

      setOutput(result);
    } catch (error) {
      setOutput(
        `Execution error:\n${error.message}`
      );
    } finally {
      setRunning(false);
    }
  }

  /* =======================================================
     QUICK EXAMPLES
  ======================================================= */

  const examples = [
    "Find the maximum number among 5 numbers",
    "Check whether a number is prime",
    "Reverse a string",
    "Sort an array",
    "Check whether a string is palindrome",
  ];

  /* =======================================================
     HOME PAGE
  ======================================================= */

  function HomePage() {
    return (
      <main className="home-page">
        <section className="hero">

          <div className="hero-badge">
            ✦ AI POWERED PROGRAMMING EDUCATION
          </div>

          <h1>
            Learn to Code.
            <br />
            <span>Build with</span>
            <br />
            Confidence.
          </h1>

          <p>
            Learn C, C++, Python, Java and
            JavaScript with your personal AI
            programming teacher.
            <br />
            Generate real programs, execute
            code and practice programming.
          </p>

          <div className="hero-buttons">

            <button
              onClick={() =>
                setPage("learn")
              }
              className="primary-button"
            >
              START LEARNING →
            </button>

            <button
              onClick={() =>
                setPage("generator")
              }
              className="secondary-button"
            >
              GENERATE CODE
            </button>

          </div>
        </section>

        <section className="feature-grid">

          <div className="feature-card">

            <div className="feature-icon">
              AI
            </div>

            <h3>AI Teacher</h3>

            <p>
              Ask programming questions
              and learn concepts step by
              step.
            </p>

            <button
              onClick={() =>
                setPage("teacher")
              }
            >
              OPEN TEACHER →
            </button>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              {"</>"}
            </div>

            <h3>Code Generator</h3>

            <p>
              Describe a programming problem
              and generate a complete program.
            </p>

            <button
              onClick={() =>
                setPage("generator")
              }
            >
              GENERATE →
            </button>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              ▶
            </div>

            <h3>Code Lab</h3>

            <p>
              Run real C, C++, Python, Java
              and JavaScript programs.
            </p>

            <button
              onClick={() =>
                setPage("lab")
              }
            >
              OPEN LAB →
            </button>

          </div>

        </section>
      </main>
    );
  }

  /* =======================================================
     LEARN PAGE
  ======================================================= */

  function LearnPage() {
    return (
      <main className="page-container">

        <div className="page-heading">

          <span>
            LEARNING CENTER
          </span>

          <h2>
            Learn Programming
            <br />
            <strong>
              Step by Step.
            </strong>
          </h2>

          <p>
            Choose a language and build your
            programming foundation.
          </p>

        </div>

        <div className="language-grid">

          {Object.entries(
            LANGUAGES
          ).map(([key, item]) => (

            <button
              key={key}
              className="language-card"
              onClick={() => {
                setLanguage(key);
                setPage("teacher");
              }}
            >

              <span className="language-symbol">

                {key === "python"
                  ? "Py"
                  : key === "javascript"
                  ? "JS"
                  : key === "cpp"
                  ? "C++"
                  : key === "java"
                  ? "J"
                  : "C"}

              </span>

              <h3>
                {item.name}
              </h3>

              <p>
                Learn concepts, syntax,
                problem solving and practical
                programming.
              </p>

              <span className="card-link">
                START →
              </span>

            </button>

          ))}

        </div>
      </main>
    );
  }

  /* =======================================================
     AI TEACHER PAGE
  ======================================================= */

  function TeacherPage() {
    return (
      <main className="page-container">

        <div className="page-heading">

          <span>
            PERSONAL AI TEACHER
          </span>

          <h2>
            Ask Anything.
            <br />
            <strong>
              Understand Everything.
            </strong>
          </h2>

        </div>

        <section className="teacher-card">

          <div className="controls-row">

            <div>

              <label>
                LANGUAGE
              </label>

              <select
                value={language}
                onChange={(e) =>
                  changeLanguage(
                    e.target.value
                  )
                }
              >

                {Object.entries(
                  LANGUAGES
                ).map(([key, item]) => (

                  <option
                    key={key}
                    value={key}
                  >
                    {item.name}
                  </option>

                ))}

              </select>

            </div>

            <div>

              <label>
                LEVEL
              </label>

              <select
                value={level}
                onChange={(e) =>
                  setLevel(
                    e.target.value
                  )
                }
              >

                {LEVELS.map((item) => (

                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>

                ))}

              </select>

            </div>

          </div>

          <label className="large-label">
            ASK YOUR PROGRAMMING QUESTION
          </label>

          <textarea
            className="large-input"
            value={teacherQuestion}
            onChange={(e) =>
              setTeacherQuestion(
                e.target.value
              )
            }
            placeholder="For example: Explain loops in C in very easy language."
          />

          <button
            className="generate-button"
            onClick={askTeacher}
            disabled={teacherBusy}
          >

            {teacherBusy
              ? "AI IS THINKING..."
              : "✦ ASK AI TEACHER"}

          </button>

          {teacherAnswer && (

            <div className="answer-card">

              <div className="answer-title">
                AI TEACHER
              </div>

              <div className="answer-content">
                {teacherAnswer}
              </div>

            </div>

          )}

        </section>
      </main>
    );
  }

  /* =======================================================
     CODE GENERATOR PAGE
  ======================================================= */

  function GeneratorPage() {
    return (
      <main className="page-container">

        <div className="page-heading">

          <span>
            AI CODE GENERATOR
          </span>

          <h2>
            Generate Any
            <br />
            <strong>
              Program.
            </strong>
          </h2>

          <p>
            Describe what you want to build
            and CodeMentor AI will generate
            a complete working program.
          </p>

        </div>

        <section className="generator-card">

          <div className="generator-top">

            <div className="generator-section">

              <label>
                PROGRAMMING LANGUAGE
              </label>

              <div className="generator-language-tabs">

                {Object.entries(
                  LANGUAGES
                ).map(([key, item]) => (

                  <button
                    key={key}
                    className={
                      language === key
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setLanguage(key)
                    }
                  >
                    {item.name}
                  </button>

                ))}

              </div>

            </div>

            <div className="level-control">

              <label>
                LEVEL
              </label>

              <select
                value={level}
                onChange={(e) =>
                  setLevel(
                    e.target.value
                  )
                }
              >

                {LEVELS.map((item) => (

                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>

                ))}

              </select>

            </div>

          </div>

          <label className="large-label">
            ENTER YOUR CODE TOPIC
          </label>

          <textarea
            className="generator-input"
            value={codeTopic}
            onChange={(e) =>
              setCodeTopic(
                e.target.value
              )
            }
            placeholder="Enter your code topic, for example: Find the maximum number among 5 numbers"
          />

          <div className="examples-title">
            QUICK EXAMPLES
          </div>

          <div className="example-buttons">

            {examples.map((example) => (

              <button
                key={example}
                onClick={() =>
                  setCodeTopic(example)
                }
              >
                {example}
              </button>

            ))}

          </div>

          <button
            className="generate-button big"
            onClick={generateCode}
            disabled={generatorBusy}
          >

            {generatorBusy
              ? "✦ GENERATING..."
              : "✦ GENERATE CODE"}

          </button>

          {generatedCode && (

            <div className="generated-code-card">

              <div className="generated-header">

                <div>

                  <span>
                    GENERATED PROGRAM
                  </span>

                  <h3>
                    {LANGUAGES[language].name}
                  </h3>

                </div>

                <button
                  onClick={
                    copyGeneratedCode
                  }
                  className="copy-button"
                >

                  {copied
                    ? "COPIED ✓"
                    : "COPY CODE"}

                </button>

              </div>

              <pre className="generated-code">

                <code>
                  {generatedCode}
                </code>

              </pre>

              <button
                className="send-lab-button"
                onClick={sendToLab}
              >
                SEND TO CODE LAB →
              </button>

            </div>

          )}

        </section>
      </main>
    );
  }

  /* =======================================================
     CODE LAB PAGE
  ======================================================= */

  function LabPage() {
    return (
      <main className="page-container">

        <div className="page-heading">

          <span>
            REAL CODE EXECUTION
          </span>

          <h2>
            Code Lab.
            <br />
            <strong>
              Write. Run. Learn.
            </strong>
          </h2>

          <p>
            Execute your program using
            Judge0.
          </p>

        </div>

        <section className="lab-card">

          <div className="lab-toolbar">

            <div>

              <label>
                LANGUAGE
              </label>

              <select
                value={language}
                onChange={(e) =>
                  changeLanguage(
                    e.target.value
                  )
                }
              >

                {Object.entries(
                  LANGUAGES
                ).map(([key, item]) => (

                  <option
                    key={key}
                    value={key}
                  >
                    {item.name}
                  </option>

                ))}

              </select>

            </div>

            <button
              className="run-button"
              onClick={runCode}
              disabled={running}
            >

              {running
                ? "RUNNING..."
                : "▶ RUN CODE"}

            </button>

          </div>

          <div className="editor-wrapper">

            <div className="editor-header">

              <span>
                SOURCE CODE
              </span>

              <span>
                {LANGUAGES[language].name}
              </span>

            </div>

            <textarea
              className="code-editor"
              value={code}
              onChange={(e) =>
                setCode(e.target.value)
              }
              spellCheck="false"
            />

          </div>

          <div className="lab-bottom">

            <div className="input-panel">

              <div className="panel-header">

                <span>
                  PROGRAM INPUT
                </span>

                <span>
                  STDIN
                </span>

              </div>

              <textarea
                value={stdin}
                onChange={(e) =>
                  setStdin(e.target.value)
                }
                placeholder="Enter input for your program..."
                className="stdin-box"
                spellCheck="false"
              />

            </div>

            <div className="output-panel">

              <div className="panel-header">

                <span>
                  PROGRAM OUTPUT
                </span>

                <span>
                  LIVE RESULT
                </span>

              </div>

              <pre className="output-box">

                {output ||
                  "Program output will appear here..."}

              </pre>

            </div>

          </div>

        </section>
      </main>
    );
  }

  /* =======================================================
     PRACTICE PAGE
  ======================================================= */

  function PracticePage() {
    return (
      <main className="page-container">

        <div className="page-heading">

          <span>
            PROGRAMMING PRACTICE
          </span>

          <h2>
            Practice.
            <br />
            <strong>
              Build Your Skills.
            </strong>
          </h2>

        </div>

        <div className="practice-grid">

          {[
            {
              title:
                "Find the Largest Number",
              level: "Beginner",
            },

            {
              title:
                "Check Prime Number",
              level: "Beginner",
            },

            {
              title:
                "Reverse an Array",
              level: "Intermediate",
            },

            {
              title:
                "Palindrome Checker",
              level: "Intermediate",
            },

            {
              title:
                "Sort Numbers",
              level: "Intermediate",
            },

            {
              title:
                "Student Grade System",
              level: "Advanced",
            },
          ].map((item, index) => (

            <div
              className="practice-card"
              key={index}
            >

              <span>
                CHALLENGE{" "}
                {String(index + 1).padStart(
                  2,
                  "0"
                )}
              </span>

              <h3>
                {item.title}
              </h3>

              <p>
                Difficulty:{" "}
                {item.level}
              </p>

              <button
                onClick={() => {
                  setCodeTopic(
                    item.title
                  );
                  setPage("generator");
                }}
              >
                SOLVE WITH AI →
              </button>

            </div>

          ))}

        </div>

      </main>
    );
  }

  /* =======================================================
     IMPORTANT FIX
     
     DO NOT USE:
     
     return <TeacherPage />;
     
     Calling the page functions directly prevents React
     from treating these inner page functions as newly-created
     component types on every App render.

     This fixes the textarea losing focus while typing.
  ======================================================= */

  function renderPage() {
    if (page === "home") {
      return HomePage();
    }

    if (page === "learn") {
      return LearnPage();
    }

    if (page === "teacher") {
      return TeacherPage();
    }

    if (page === "generator") {
      return GeneratorPage();
    }

    if (page === "lab") {
      return LabPage();
    }

    if (page === "practice") {
      return PracticePage();
    }

    return HomePage();
  }

  /* =======================================================
     MAIN APP LAYOUT
  ======================================================= */

  return (
    <div className="app-shell">

      <header className="top-nav">

        <button
          className="brand"
          onClick={() =>
            setPage("home")
          }
        >

          <span>✦</span>

          CodeMentor

          <strong>
            AI
          </strong>

        </button>

        <nav>

          <button
            className={
              page === "learn"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("learn")
            }
          >
            Learn
          </button>

          <button
            className={
              page === "teacher"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("teacher")
            }
          >
            AI Teacher
          </button>

          <button
            className={
              page === "generator"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("generator")
            }
          >
            Code Generator
          </button>

          <button
            className={
              page === "lab"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("lab")
            }
          >
            Code Lab
          </button>

          <button
            className={
              page === "practice"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("practice")
            }
          >
            Practice
          </button>

        </nav>

        <div className="search-box">

          <span>
            ⌕
          </span>

          <input
            placeholder="Search concepts..."
          />

        </div>

      </header>

      {renderPage()}

      <footer className="footer">

        <div>
          ✦ CodeMentor AI
        </div>

        <div>
          Learn deeply. Code safely.
          Build confidently.
        </div>

        <div>
          AI Programming Education
        </div>

      </footer>

    </div>
  );
}

/* =========================================================
   REACT START
========================================================= */

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);