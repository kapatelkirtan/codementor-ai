import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:8787";

const LANGUAGES = [
  {
    name: "C",
    icon: "C",
    starter: `#include <stdio.h>

int main() {
    // Print a welcome message.
    printf("Hello, CodeMentor AI!\\n");

    // Return 0 to show the program finished successfully.
    return 0;
}`,
  },
  {
    name: "C++",
    icon: "C++",
    starter: `#include <iostream>
using namespace std;

int main() {
    // Print a welcome message.
    cout << "Hello, CodeMentor AI!" << endl;

    // Return 0 to show the program finished successfully.
    return 0;
}`,
  },
  {
    name: "Python",
    icon: "Py",
    starter: `# Print a welcome message.
print("Hello, CodeMentor AI!")`,
  },
  {
    name: "Java",
    icon: "Ja",
    starter: `public class Main {
    public static void main(String[] args) {
        // Print a welcome message.
        System.out.println("Hello, CodeMentor AI!");
    }
}`,
  },
  {
    name: "JavaScript",
    icon: "JS",
    starter: `// Print a welcome message.
console.log("Hello, CodeMentor AI!");`,
  },
];

const LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const EXAMPLES = [
  "Find the maximum number among 5 numbers",
  "Check whether a number is prime",
  "Reverse a string",
  "Sort an array",
  "Check whether a string is palindrome",
];

/* =========================================================
   REUSABLE UI COMPONENTS
   IMPORTANT:
   These components are OUTSIDE App().
   This prevents React from recreating their component
   identity on every keystroke and fixes focus loss.
   ========================================================= */

function LevelButtons({ level, onSelect }) {
  return (
    <div className="level-buttons">
      {LEVELS.map((item) => (
        <button
          type="button"
          key={item}
          className={
            level === item
              ? "level-button active"
              : "level-button"
          }
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function LanguageButtons({
  language,
  onSelect,
  compact = false,
}) {
  return (
    <div
      className={
        compact
          ? "language-buttons compact"
          : "language-buttons"
      }
    >
      {LANGUAGES.map((item) => (
        <button
          type="button"
          key={item.name}
          className={
            language === item.name
              ? "language-button active"
              : "language-button"
          }
          onClick={() => onSelect(item.name)}
        >
          <span className="button-language-icon">
            {item.icon}
          </span>

          <span>{item.name}</span>
        </button>
      ))}
    </div>
  );
}

function StyleButtons({
  codeStyle,
  onSelect,
}) {
  return (
    <div className="style-buttons">
      <button
        type="button"
        className={
          codeStyle === "Modern Standard"
            ? "style-button active"
            : "style-button"
        }
        onClick={() =>
          onSelect("Modern Standard")
        }
      >
        <span className="style-icon">
          ✓
        </span>

        <span>MODERN STANDARD</span>
      </button>

      <button
        type="button"
        className={
          codeStyle === "Legacy Turbo C"
            ? "style-button turbo-active"
            : "style-button"
        }
        onClick={() =>
          onSelect("Legacy Turbo C")
        }
      >
        <span className="style-icon">
          &lt;/&gt;
        </span>

        <span>LEGACY TURBO C</span>
      </button>
    </div>
  );
}

/* =========================================================
   HOME PAGE
   ========================================================= */

function HomePage({ setPage }) {
  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-badge">
          <span>✦</span>
          AI-POWERED PROGRAMMING EDUCATION
        </div>

        <h1>
          Learn to Code.
          <br />
          <span>Build the Future.</span>
        </h1>

        <p className="hero-text">
          Master C, C++, Python, Java and
          JavaScript with your personal
          AI-powered programming mentor.
        </p>

        <div className="hero-buttons">
          <button
            type="button"
            className="primary-button"
            onClick={() => setPage("learn")}
          >
            START LEARNING
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setPage("generator")}
          >
            GENERATE CODE
          </button>
        </div>

        <div className="language-showcase">
          {LANGUAGES.map((item) => (
            <div
              className="language-card"
              key={item.name}
            >
              <div className="language-icon">
                {item.icon}
              </div>

              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="feature-section">
        <div className="section-heading">
          <div className="small-label">
            WHY CODEMENTOR AI?
          </div>

          <h2>Your Personal AI Coding Lab</h2>

          <p>
            Learn, generate, execute and
            practice code in one powerful
            platform.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-number">
              01
            </div>

            <h3>AI Teacher</h3>

            <p>
              Ask programming questions and
              receive beginner-friendly
              explanations, examples and
              step-by-step guidance.
            </p>

            <button
              type="button"
              onClick={() => setPage("teacher")}
            >
              OPEN AI TEACHER →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-number">
              02
            </div>

            <h3>Code Generator</h3>

            <p>
              Choose a language, style and
              learning level, then generate
              one complete program at a time.
            </p>

            <button
              type="button"
              onClick={() => setPage("generator")}
            >
              OPEN GENERATOR →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-number">
              03
            </div>

            <h3>Real Code Lab</h3>

            <p>
              Write code, provide input and
              execute programs using the real
              Judge0 execution engine.
            </p>

            <button
              type="button"
              onClick={() => setPage("lab")}
            >
              OPEN CODE LAB →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-number">
              04
            </div>

            <h3>Practice</h3>

            <p>
              Improve your programming skills
              with coding challenges and
              structured practice.
            </p>

            <button
              type="button"
              onClick={() => setPage("practice")}
            >
              START PRACTICE →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   LEARN PAGE
   ========================================================= */

function LearnPage({
  language,
  setLanguage,
  setCode,
  setPage,
}) {
  function selectLanguage(name) {
    setLanguage(name);

    const selected = LANGUAGES.find(
      (item) => item.name === name
    );

    if (selected) {
      setCode(selected.starter);
    }

    setPage("teacher");
  }

  return (
    <main className="content-page">
      <div className="page-header">
        <div className="small-label">
          LEARNING CENTER
        </div>

        <h1>Learn Programming</h1>

        <p>
          Build a strong programming
          foundation with simple
          explanations and practical
          examples.
        </p>
      </div>

      <div className="learning-grid">
        {LANGUAGES.map((item) => (
          <button
            type="button"
            className="learning-card"
            key={item.name}
            onClick={() =>
              selectLanguage(item.name)
            }
          >
            <div className="large-language-icon">
              {item.icon}
            </div>

            <h2>{item.name}</h2>

            <p>
              Learn {item.name} from
              beginner to advanced.
            </p>

            <span>START LEARNING →</span>
          </button>
        ))}
      </div>
    </main>
  );
}

/* =========================================================
   AI TEACHER PAGE
   ========================================================= */

function TeacherPage({
  language,
  setLanguage,
  level,
  setLevel,
  question,
  setQuestion,
  answer,
  busy,
  askTeacher,
}) {
  return (
    <main className="content-page">
      <div className="page-header">
        <div className="small-label">
          AI TEACHER
        </div>

        <h1>
          Your Personal
          <br />
          Programming Mentor
        </h1>

        <p>
          Ask anything about programming
          and learn through simple,
          step-by-step explanations.
        </p>
      </div>

      <section className="teacher-panel">
        <div className="control-section">
          <label>PROGRAMMING LANGUAGE</label>

          <LanguageButtons
            language={language}
            onSelect={setLanguage}
            compact
          />
        </div>

        <div className="control-section">
          <label>YOUR LEARNING LEVEL</label>

          <LevelButtons
            level={level}
            onSelect={setLevel}
          />
        </div>

        <label className="big-label">
          ASK YOUR QUESTION
        </label>

        <textarea
          className="question-box"
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          placeholder="Example: Explain loops in Python with a simple example."
        />

        <button
          type="button"
          className="primary-button full-button"
          onClick={() => askTeacher()}
          disabled={busy}
        >
          {busy
            ? "AI IS THINKING..."
            : "✦ ASK AI TEACHER"}
        </button>

        {answer && (
          <div className="answer-panel">
            <div className="answer-title">
              AI TEACHER RESPONSE
            </div>

            <div className="answer-content">
              {answer}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

/* =========================================================
   CODE GENERATOR PAGE
   ========================================================= */

function GeneratorPage({
  language,
  setLanguage,
  level,
  setLevel,
  codeStyle,
  setCodeStyle,
  codeTopic,
  setCodeTopic,
  generatedCode,
  generatedAnswer,
  generatorBusy,
  generateCode,
  copyGeneratedCode,
  sendGeneratedToLab,
}) {
  return (
    <main className="content-page">
      <div className="page-header">
        <div className="small-label">
          AI CODE GENERATOR
        </div>

        <h1>
          Solve Any Programming Problem
        </h1>

        <p>
          Select a language and generate
          its code separately. No dropdowns.
          No multi-language output.
        </p>
      </div>

      <section className="generator-panel">
        <div className="control-section">
          <label>YOUR LEARNING LEVEL</label>

          <LevelButtons
            level={level}
            onSelect={setLevel}
          />
        </div>

        <div className="control-section">
          <label>PROGRAMMING LANGUAGE</label>

          <LanguageButtons
            language={language}
            onSelect={setLanguage}
          />
        </div>

        <div className="control-section">
          <label>CODE GENERATION STYLE</label>

          <StyleButtons
            codeStyle={codeStyle}
            onSelect={setCodeStyle}
          />
        </div>

        <div className="selected-generator-info">
          <span className="selected-dot"></span>

          <strong>{language}</strong>

          <span>•</span>

          <span>{level}</span>

          <span>•</span>

          <span>{codeStyle}</span>
        </div>

        <label className="big-label">
          ENTER YOUR PROGRAMMING PROBLEM
        </label>

        <textarea
          className="topic-box"
          value={codeTopic}
          onChange={(event) =>
            setCodeTopic(event.target.value)
          }
          placeholder="Example: Find the maximum number among 5 numbers"
          spellCheck="false"
        />

        <div className="example-section">
          <span>TRY AN EXAMPLE:</span>

          <div className="example-buttons">
            {EXAMPLES.map((example) => (
              <button
                type="button"
                key={example}
                onClick={() =>
                  setCodeTopic(example)
                }
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="generator-note">
          <strong>
            ✓ ONE LANGUAGE AT A TIME
          </strong>

          <span>
            Generate only the selected
            language. The generated program
            contains beginner-friendly comments.
            Legacy Turbo C is available for C
            and C++.
          </span>
        </div>

        <button
          type="button"
          className="generate-code-button"
          onClick={() => generateCode()}
          disabled={generatorBusy}
        >
          {generatorBusy
            ? "GENERATING CODE..."
            : `✦ GENERATE ${language.toUpperCase()} CODE`}
        </button>

        {generatedAnswer &&
          generatedAnswer.startsWith("Error:") && (
            <div className="generator-error">
              {generatedAnswer}
            </div>
          )}

        {generatedCode && (
          <section className="generated-output">
            <div className="output-header">
              <div>
                <span className="result-label">
                  CODE OUTPUT
                </span>

                <h2>
                  Generated {language} Program
                </h2>
              </div>

              <span className="code-style-badge">
                {codeStyle}
              </span>
            </div>

            <pre className="generated-code">
              <code>{generatedCode}</code>
            </pre>

            <div className="generated-actions">
              <button
                type="button"
                onClick={copyGeneratedCode}
              >
                COPY CODE
              </button>

              <button
                type="button"
                onClick={sendGeneratedToLab}
              >
                RUN IN CODE LAB →
              </button>
            </div>

            {generatedAnswer &&
              !generatedAnswer.startsWith(
                "Error:"
              ) && (
                <div className="generated-explanation">
                  <h3>HOW IT WORKS</h3>

                  <p>{generatedAnswer}</p>
                </div>
              )}
          </section>
        )}
      </section>
    </main>
  );
}

/* =========================================================
   CODE LAB PAGE
   ========================================================= */

function LabPage({
  language,
  setLanguage,
  codeStyle,
  setCodeStyle,
  code,
  setCode,
  stdin,
  setStdin,
  output,
  running,
  runCode,
}) {
  function selectLanguage(newLanguage) {
    setLanguage(newLanguage);

    const selected = LANGUAGES.find(
      (item) => item.name === newLanguage
    );

    if (selected) {
      setCode(selected.starter);
    }
  }

  return (
    <main className="content-page lab-page">
      <div className="page-header">
        <div className="small-label">
          CODE LAB
        </div>

        <h1>Write. Run. Learn.</h1>

        <p>
          Execute your programs using
          the real online code execution
          engine.
        </p>
      </div>

      <section className="lab-panel">
        <div className="control-section">
          <label>PROGRAMMING LANGUAGE</label>

          <LanguageButtons
            language={language}
            onSelect={selectLanguage}
            compact
          />
        </div>

        <div className="control-section">
          <label>CODE STYLE</label>

          <StyleButtons
            codeStyle={codeStyle}
            onSelect={setCodeStyle}
          />
        </div>

        <button
          type="button"
          className="run-button"
          onClick={runCode}
          disabled={running}
        >
          {running
            ? "RUNNING..."
            : "▶ RUN CODE"}
        </button>

        <div className="editor-layout">
          <div className="editor-side">
            <div className="editor-title">
              SOURCE CODE
            </div>

            <textarea
              className="code-editor"
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              spellCheck="false"
            />
          </div>

          <div className="output-side">
            <div className="editor-title">
              INPUT
            </div>

            <textarea
              className="stdin-editor"
              value={stdin}
              onChange={(event) =>
                setStdin(event.target.value)
              }
              placeholder="Enter program input here..."
              spellCheck="false"
            />

            <div className="editor-title output-title">
              OUTPUT
            </div>

            <pre className="execution-output">
              {output ||
                "Program output will appear here..."}
            </pre>
          </div>
        </div>

        <div className="lab-note">
          For Legacy Turbo C, CodeMentor
          keeps the old-style source visible
          but converts unsupported Turbo C
          console constructs for modern Judge0
          execution.
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   PRACTICE PAGE
   ========================================================= */

function PracticePage({
  setCodeTopic,
  setPage,
}) {
  const challenges = [
    {
      title: "Find the Maximum",
      description:
        "Write a program to find the largest number in an array.",
      difficulty: "BEGINNER",
    },
    {
      title: "Prime Number",
      description:
        "Check whether a given number is prime.",
      difficulty: "BEGINNER",
    },
    {
      title: "Palindrome",
      description:
        "Determine whether a string is a palindrome.",
      difficulty: "BEGINNER",
    },
    {
      title: "Array Sorting",
      description:
        "Sort an array without using a built-in sorting function.",
      difficulty: "INTERMEDIATE",
    },
    {
      title: "Fibonacci Sequence",
      description:
        "Generate the first N Fibonacci numbers.",
      difficulty: "INTERMEDIATE",
    },
    {
      title: "String Frequency",
      description:
        "Count the frequency of every character in a string.",
      difficulty: "INTERMEDIATE",
    },
  ];

  return (
    <main className="content-page">
      <div className="page-header">
        <div className="small-label">
          PRACTICE ARENA
        </div>

        <h1>
          Improve Your Coding Skills
        </h1>

        <p>
          Solve programming challenges
          and strengthen your
          problem-solving skills.
        </p>
      </div>

      <div className="challenge-grid">
        {challenges.map((challenge) => (
          <div
            className="challenge-card"
            key={challenge.title}
          >
            <div className="challenge-top">
              <span>
                {challenge.difficulty}
              </span>
            </div>

            <h2>{challenge.title}</h2>

            <p>{challenge.description}</p>

            <button
              type="button"
              onClick={() => {
                setCodeTopic(
                  challenge.description
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

/* =========================================================
   FOOTER
   ========================================================= */

function Footer({ setPage }) {
  return (
    <footer className="footer">
      <div>
        <div className="footer-brand">
          <span className="brand-mark">
            &lt;/&gt;
          </span>

          <strong>CodeMentor AI</strong>
        </div>

        <p>
          Learn programming. Build
          projects. Master code with AI.
        </p>
      </div>

      <div className="footer-links">
        <button
          type="button"
          onClick={() => setPage("learn")}
        >
          Learn
        </button>

        <button
          type="button"
          onClick={() => setPage("teacher")}
        >
          AI Teacher
        </button>

        <button
          type="button"
          onClick={() => setPage("generator")}
        >
          Generator
        </button>

        <button
          type="button"
          onClick={() => setPage("lab")}
        >
          Code Lab
        </button>

        <button
          type="button"
          onClick={() => setPage("practice")}
        >
          Practice
        </button>
      </div>

      <div className="copyright">
        © {new Date().getFullYear()} CodeMentor AI
      </div>
    </footer>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const [page, setPage] = useState("home");

  const [language, setLanguage] =
    useState("Python");

  const [level, setLevel] =
    useState("Beginner");

  const [codeStyle, setCodeStyle] =
    useState("Modern Standard");

  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [codeTopic, setCodeTopic] =
    useState("");

  const [generatedCode, setGeneratedCode] =
    useState("");

  const [generatedAnswer, setGeneratedAnswer] =
    useState("");

  const [generatorBusy, setGeneratorBusy] =
    useState(false);

  const [code, setCode] = useState(
    LANGUAGES.find(
      (item) => item.name === "Python"
    )?.starter || ""
  );

  const [stdin, setStdin] =
    useState("");

  const [output, setOutput] =
    useState("");

  const [running, setRunning] =
    useState(false);

  /* =======================================================
     CHANGE LANGUAGE
     ======================================================= */

  function changeLanguage(
    newLanguage,
    resetEditor = true
  ) {
    setLanguage(newLanguage);

    if (resetEditor) {
      const selected = LANGUAGES.find(
        (item) => item.name === newLanguage
      );

      if (selected) {
        setCode(selected.starter);
      }
    }
  }

  /* =======================================================
     AI TEACHER
     ======================================================= */

  async function askTeacher(customQuestion) {
    const q = (
      customQuestion ?? question
    ).trim();

    if (!q) {
      setAnswer(
        "Please enter a programming question first."
      );
      return;
    }

    setBusy(true);
    setAnswer("");

    try {
      const response = await fetch(
        `${API}/api/ai/teach`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            language,
            level,
            question: q,
          }),
        }
      );

      const raw =
        await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          "The backend returned an invalid response. Make sure the CodeMentor AI backend is running."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI request failed."
        );
      }

      setAnswer(
        data.answer ||
          "No answer was returned."
      );
    } catch (error) {
      setAnswer(
        `Error: ${error.message}`
      );
    } finally {
      setBusy(false);
    }
  }

  /* =======================================================
     CODE GENERATOR
     ======================================================= */

  async function generateCode(
    customTopic
  ) {
    const topic = (
      customTopic ?? codeTopic
    ).trim();

    if (!topic) {
      setGeneratedAnswer(
        "Please enter a programming problem first."
      );
      return;
    }

    setGeneratorBusy(true);
    setGeneratedCode("");
    setGeneratedAnswer("");

    try {
      const response = await fetch(
        `${API}/api/ai/generate-code`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            language,
            level,
            codeStyle,
            topic,
          }),
        }
      );

      const raw =
        await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          "The backend returned an invalid response. Make sure the CodeMentor AI backend is running."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Code generation failed."
        );
      }

      /*
       * The backend may return:
       *
       * data.code
       * data.explanation
       *
       * Keep this flexible so the frontend
       * works with the current API.
       */

      setGeneratedCode(
        data.code || ""
      );

      setGeneratedAnswer(
        data.explanation ||
          "Code generated successfully."
      );
    } catch (error) {
      setGeneratedAnswer(
        `Error: ${error.message}`
      );
    } finally {
      setGeneratorBusy(false);
    }
  }

  /* =======================================================
     COPY GENERATED CODE
     ======================================================= */

  async function copyGeneratedCode() {
    if (!generatedCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedCode
      );

      window.alert(
        `${language} code copied successfully!`
      );
    } catch {
      window.alert(
        "Unable to copy the code."
      );
    }
  }

  /* =======================================================
     SEND GENERATED CODE TO CODE LAB
     ======================================================= */

  function sendGeneratedToLab() {
    if (!generatedCode) {
      return;
    }

    setCode(generatedCode);
    setStdin("");
    setOutput("");
    setPage("lab");
  }

  /* =======================================================
     RUN CODE
     ======================================================= */

  async function runCode() {
    if (!code.trim()) {
      setOutput(
        "Please enter some code first."
      );
      return;
    }

    setRunning(true);
    setOutput("");

    try {
      const response = await fetch(
        `${API}/api/code/run`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            language,
            code,
            stdin,
            codeStyle,
          }),
        }
      );

      const raw =
        await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          "The backend returned an invalid response. Make sure the backend is running."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Code execution failed."
        );
      }

      /*
       * Show ONLY actual execution output.
       * No fake STATUS / TIME / MEMORY text.
       */

      if (data.stdout) {
        setOutput(
          data.stdout.trimEnd()
        );
      } else if (data.compileOutput) {
        setOutput(
          data.compileOutput.trimEnd()
        );
      } else if (data.stderr) {
        setOutput(
          data.stderr.trimEnd()
        );
      } else if (data.message) {
        setOutput(
          data.message.trimEnd()
        );
      } else {
        setOutput("");
      }
    } catch (error) {
      setOutput(
        `Execution error:\n${error.message}`
      );
    } finally {
      setRunning(false);
    }
  }

  /* =======================================================
     RENDER PAGE
     ======================================================= */

  function renderPage() {
    if (page === "learn") {
      return (
        <LearnPage
          language={language}
          setLanguage={setLanguage}
          setCode={setCode}
          setPage={setPage}
        />
      );
    }

    if (page === "teacher") {
      return (
        <TeacherPage
          language={language}
          setLanguage={setLanguage}
          level={level}
          setLevel={setLevel}
          question={question}
          setQuestion={setQuestion}
          answer={answer}
          busy={busy}
          askTeacher={askTeacher}
        />
      );
    }

    if (page === "generator") {
      return (
        <GeneratorPage
          language={language}
          setLanguage={(newLanguage) =>
            changeLanguage(
              newLanguage,
              false
            )
          }
          level={level}
          setLevel={setLevel}
          codeStyle={codeStyle}
          setCodeStyle={setCodeStyle}
          codeTopic={codeTopic}
          setCodeTopic={setCodeTopic}
          generatedCode={generatedCode}
          generatedAnswer={generatedAnswer}
          generatorBusy={generatorBusy}
          generateCode={generateCode}
          copyGeneratedCode={
            copyGeneratedCode
          }
          sendGeneratedToLab={
            sendGeneratedToLab
          }
        />
      );
    }

    if (page === "lab") {
      return (
        <LabPage
          language={language}
          setLanguage={setLanguage}
          codeStyle={codeStyle}
          setCodeStyle={setCodeStyle}
          code={code}
          setCode={setCode}
          stdin={stdin}
          setStdin={setStdin}
          output={output}
          running={running}
          runCode={runCode}
        />
      );
    }

    if (page === "practice") {
      return (
        <PracticePage
          setCodeTopic={setCodeTopic}
          setPage={setPage}
        />
      );
    }

    return (
      <HomePage setPage={setPage} />
    );
  }

  /* =======================================================
     APP UI
     ======================================================= */

  return (
    <div className="app">
      <header className="navbar">
        <button
          type="button"
          className="brand"
          onClick={() =>
            setPage("home")
          }
        >
          <span className="brand-mark">
            &lt;/&gt;
          </span>

          <span>
            <strong>CodeMentor</strong>
            <small>AI</small>
          </span>
        </button>

        <nav className="nav-links">
          {[
            ["home", "Home"],
            ["learn", "Learn"],
            ["teacher", "AI Teacher"],
            [
              "generator",
              "Code Generator",
            ],
            ["lab", "Code Lab"],
            ["practice", "Practice"],
          ].map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={
                page === id
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={() =>
                setPage(id)
              }
            >
              {label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="nav-cta"
          onClick={() =>
            setPage("generator")
          }
        >
          GENERATE CODE
        </button>
      </header>

      {renderPage()}

      <Footer setPage={setPage} />
    </div>
  );
}

/* =========================================================
   START REACT
   ========================================================= */

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);