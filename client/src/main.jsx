import React, {
  useState,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import "./styles.css";

// ======================================================
// API
// ======================================================

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8787";

// ======================================================
// CONSTANTS
// ======================================================

const LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const ALGORITHM_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advance",
];

const LANGUAGES = [
  "C",
  "C++",
  "Python",
  "Java",
  "JavaScript",
];

const STYLES = [
  "Modern Standard",
  "Legacy Turbo C",
];

// ======================================================
// ICON
// ======================================================

function CodeIcon() {
  return (
    <span className="brand-code-icon">
      {"</>"}
    </span>
  );
}

// ======================================================
// HEADER
// ======================================================

function SiteHeader({
  page,
  navigate,
}) {
  const navigationItems = [
    {
      key: "home",
      label: "Home",
    },
    {
      key: "learn",
      label: "Learn",
    },
    {
      key: "teacher",
      label: "AI Teacher",
    },
    {
      key: "generator",
      label: "Code Generator",
    },
    {
      key: "lab",
      label: "Code Lab",
    },
    {
      key: "practice",
      label: "Practice",
    },
    {
      key:
        "algorithm-generator",
      label:
        "Algorithm Generator",
    },
    {
      key:
        "algorithm-runner",
      label:
        "Algorithm Code Runner",
    },
  ];

  return (
    <header className="site-header">
      <div
        className="brand"
        onClick={() =>
          navigate(
            "home"
          )
        }
      >
        <CodeIcon />

        <span className="brand-name">
          CodeMentor
        </span>

        <span className="brand-ai">
          AI
        </span>
      </div>

      <nav className="main-nav">
        {navigationItems.map(
          (item) => (
            <button
              key={
                item.key
              }
              type="button"
              className={
                page ===
                item.key
                  ? "nav-button active"
                  : "nav-button"
              }
              onClick={() =>
                navigate(
                  item.key
                )
              }
            >
              {
                item.label
              }
            </button>
          )
        )}
      </nav>

      <button
        type="button"
        className="header-action"
        onClick={() =>
          navigate(
            "generator"
          )
        }
      >
        GENERATE CODE
      </button>
    </header>
  );
}

// ======================================================
// PAGE HEADER
// ======================================================

function PageHeader({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="page-header">
      <div className="eyebrow">
        {eyebrow}
      </div>

      <h1>{title}</h1>

      <p>
        {description}
      </p>
    </div>
  );
}

// ======================================================
// LEVEL BUTTONS
// ======================================================

function LevelButtons({
  level,
  setLevel,
}) {
  return (
    <div className="button-row">
      {LEVELS.map(
        (item) => (
          <button
            key={item}
            type="button"
            className={
              level === item
                ? "choice-button active"
                : "choice-button"
            }
            onClick={() =>
              setLevel(item)
            }
          >
            {item}
          </button>
        )
      )}
    </div>
  );
}

// ======================================================
// ALGORITHM LEVEL BUTTONS
// ======================================================

function AlgorithmLevelButtons({
  level,
  setLevel,
}) {
  return (
    <div className="button-row">
      {ALGORITHM_LEVELS.map(
        (item) => (
          <button
            key={item}
            type="button"
            className={
              level === item
                ? "choice-button active"
                : "choice-button"
            }
            onClick={() =>
              setLevel(item)
            }
          >
            {item}
          </button>
        )
      )}
    </div>
  );
}

// ======================================================
// LANGUAGE BUTTONS
// ======================================================

function LanguageButtons({
  language,
  setLanguage,
}) {
  return (
    <div className="language-grid">
      {LANGUAGES.map(
        (item) => (
          <button
            key={item}
            type="button"
            className={
              language === item
                ? "language-button active"
                : "language-button"
            }
            onClick={() =>
              setLanguage(item)
            }
          >
            <span className="language-symbol">
              {item ===
              "C"
                ? "C"
                : item ===
                    "C++"
                ? "C++"
                : item ===
                    "Python"
                ? "Py"
                : item ===
                    "Java"
                ? "Ja"
                : "JS"}
            </span>

            <span>
              {item}
            </span>
          </button>
        )
      )}
    </div>
  );
}

// ======================================================
// STYLE BUTTONS
// ======================================================

function StyleButtons({
  codeStyle,
  setCodeStyle,
}) {
  return (
    <div className="style-grid">
      {STYLES.map(
        (item) => (
          <button
            key={item}
            type="button"
            className={
              codeStyle ===
              item
                ? "style-button active"
                : "style-button"
            }
            onClick={() =>
              setCodeStyle(
                item
              )
            }
          >
            <span className="style-icon">
              {item ===
              "Legacy Turbo C"
                ? "</>"
                : "✓"}
            </span>

            <span>
              {item}
            </span>
          </button>
        )
      )}
    </div>
  );
}

// ======================================================
// RESULT PANEL
// ======================================================

function ResultPanel({
  title,
  children,
}) {
  return (
    <div className="result-panel">
      <div className="result-title">
        {title}
      </div>

      <div className="result-content">
        {children}
      </div>
    </div>
  );
}

// ======================================================
// COPY BUTTON
// ======================================================

function CopyButton({
  text,
  defaultLabel,
}) {
  const [
    copied,
    setCopied,
  ] = useState(false);

  async function copyText() {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopied(true);

      window.setTimeout(
        () =>
          setCopied(
            false
          ),
        1800
      );
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  }

  return (
    <button
      type="button"
      className="copy-button"
      onClick={
        copyText
      }
    >
      {copied
        ? "COPIED ✓"
        : defaultLabel}
    </button>
  );
}

// ======================================================
// HOME
// ======================================================

function HomePage({
  navigate,
}) {
  return (
    <main className="page-shell home-page">
      <section className="hero-section">
        <div className="hero-badge">
          AI-POWERED PROGRAMMING &
          ALGORITHM LEARNING
        </div>

        <h1>
          Welcome to{" "}
          <span>
            CodeMentor AI
          </span>
        </h1>

        <p>
          Learn programming, algorithms,
          generate code, practice and run
          programs in one platform.
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                "generator"
              )
            }
          >
            GENERATE CODE
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(
                "algorithm-generator"
              )
            }
          >
            ALGORITHM GENERATOR
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(
                "algorithm-runner"
              )
            }
          >
            ALGORITHM CODE RUNNER
          </button>
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature-card">
          <div className="feature-number">
            01
          </div>

          <h3>
            AI Teacher
          </h3>

          <p>
            Learn programming and algorithms
            with simple explanations.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-number">
            02
          </div>

          <h3>
            Learn
          </h3>

          <p>
            Study concepts and algorithms
            step-by-step.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-number">
            03
          </div>

          <h3>
            Practice
          </h3>

          <p>
            Practice programming and algorithm
            problems.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-number">
            04
          </div>

          <h3>
            Algorithm Generator
          </h3>

          <p>
            Generate exam-ready algorithm notes.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-number">
            05
          </div>

          <h3>
            Algorithm Code Runner
          </h3>

          <p>
            Run algorithm programs independently.
          </p>
        </div>
      </section>
    </main>
  );
}

// ======================================================
// LEARN
// ======================================================

function LearnPage({
  level,
  setLevel,
  algorithmTopic,
  setAlgorithmTopic,
  algorithmAnswer,
  algorithmLoading,
  askAlgorithm,
}) {
  const topics = [
    "Variables",
    "Loops",
    "Conditions",
    "Functions",
    "Arrays",
    "Pointers",
    "Classes",
  ];

  const algorithms = [
    "Linear Search",
    "Binary Search",
    "Bubble Sort",
    "Selection Sort",
    "Insertion Sort",
    "Array Insertion",
    "Array Deletion",
    "Array Update",
    "Stack",
    "Queue",
    "Linked List",
  ];

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="LEARN"
        title="Learn Programming & Algorithms"
        description="Understand difficult topics in simple language."
      />

      <section className="content-card">
        <h2>
          Learning Level
        </h2>

        <LevelButtons
          level={level}
          setLevel={setLevel}
        />
      </section>

      <section className="content-card">
        <div className="eyebrow">
          PROGRAMMING LEARNING
        </div>

        <h2>
          Programming Topics
        </h2>

        <div className="topic-grid">
          {topics.map(
            (topic) => (
              <div
                className="topic-card"
                key={topic}
              >
                <strong>
                  {topic}
                </strong>

                <span>
                  Learn{" "}
                  {topic.toLowerCase()}
                  easily.
                </span>
              </div>
            )
          )}
        </div>
      </section>

      <section className="content-card">
        <div className="eyebrow">
          ALGORITHM LEARNING
        </div>

        <h2>
          Learn Algorithms Easily
        </h2>

        <p className="section-description">
          Select an algorithm to get an
          easy explanation.
        </p>

        <div className="topic-grid">
          {algorithms.map(
            (algorithm) => (
              <button
                key={algorithm}
                type="button"
                className="topic-card topic-button"
                onClick={() => {
                  setAlgorithmTopic(
                    algorithm
                  );

                  askAlgorithm(
                    algorithm,
                    "teach"
                  );
                }}
              >
                <strong>
                  {algorithm}
                </strong>

                <span>
                  Click to learn
                </span>
              </button>
            )
          )}
        </div>

        <div className="form-group">
          <label>
            ASK ABOUT ANY ALGORITHM
          </label>

          <textarea
            value={
              algorithmTopic
            }
            onChange={(
              event
            ) =>
              setAlgorithmTopic(
                event.target.value
              )
            }
            placeholder="Example: Explain binary search in very easy language"
            rows={5}
          />
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={
            algorithmLoading
          }
          onClick={() =>
            askAlgorithm(
              algorithmTopic,
              "teach"
            )
          }
        >
          {algorithmLoading
            ? "TEACHING..."
            : "TEACH ME THIS ALGORITHM"}
        </button>

        {algorithmAnswer && (
          <ResultPanel
            title="ALGORITHM LESSON"
          >
            <div className="ai-text">
              {
                algorithmAnswer
              }
            </div>
          </ResultPanel>
        )}
      </section>
    </main>
  );
}

// ======================================================
// AI TEACHER
// ======================================================

function TeacherPage({
  level,
  setLevel,
  language,
  setLanguage,
  teacherQuestion,
  setTeacherQuestion,
  teacherAnswer,
  teacherLoading,
  askTeacher,
  algorithmMode,
  setAlgorithmMode,
}) {
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="AI TEACHER"
        title="Learn With Your AI Teacher"
        description="Ask programming or algorithm questions."
      />

      <section className="content-card">
        <div className="teacher-mode-row">
          <button
            type="button"
            className={
              !algorithmMode
                ? "mode-button active"
                : "mode-button"
            }
            onClick={() =>
              setAlgorithmMode(
                false
              )
            }
          >
            PROGRAMMING TEACHER
          </button>

          <button
            type="button"
            className={
              algorithmMode
                ? "mode-button active"
                : "mode-button"
            }
            onClick={() =>
              setAlgorithmMode(
                true
              )
            }
          >
            ALGORITHM TEACHER
          </button>
        </div>
      </section>

      <section className="content-card">
        <h2>
          Learning Level
        </h2>

        <LevelButtons
          level={level}
          setLevel={setLevel}
        />

        {!algorithmMode && (
          <>
            <h2 className="top-gap">
              Programming Language
            </h2>

            <LanguageButtons
              language={
                language
              }
              setLanguage={
                setLanguage
              }
            />
          </>
        )}

        <div className="form-group top-gap">
          <label>
            {algorithmMode
              ? "ASK ABOUT AN ALGORITHM"
              : "ASK YOUR PROGRAMMING QUESTION"}
          </label>

          <textarea
            value={
              teacherQuestion
            }
            onChange={(
              event
            ) =>
              setTeacherQuestion(
                event.target.value
              )
            }
            placeholder={
              algorithmMode
                ? "Example: Explain binary search in very easy language"
                : "Example: Explain arrays in C"
            }
            rows={8}
          />
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={
            teacherLoading
          }
          onClick={
            askTeacher
          }
        >
          {teacherLoading
            ? "THINKING..."
            : "ASK AI TEACHER"}
        </button>

        {teacherAnswer && (
          <ResultPanel
            title={
              algorithmMode
                ? "ALGORITHM LESSON"
                : "AI TEACHER ANSWER"
            }
          >
            <div className="ai-text">
              {
                teacherAnswer
              }
            </div>
          </ResultPanel>
        )}
      </section>
    </main>
  );
}

// ======================================================
// CODE GENERATOR
// ======================================================

function GeneratorPage({
  level,
  setLevel,
  language,
  setLanguage,
  codeStyle,
  setCodeStyle,
  topic,
  setTopic,
  generatedCode,
  generating,
  generateCode,
}) {
  const showCodeStyle =
    language === "C" ||
    language === "C++";

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="CODE GENERATOR"
        title="Generate Programming Code"
        description="Generate clean, complete programs one language at a time."
      />

      <section className="content-card">
        <h2>
          Learning Level
        </h2>

        <LevelButtons
          level={level}
          setLevel={setLevel}
        />

        <h2 className="top-gap">
          Programming Language
        </h2>

        <LanguageButtons
          language={
            language
          }
          setLanguage={
            setLanguage
          }
        />

        {showCodeStyle && (
          <>
            <h2 className="top-gap">
              Code Generation Style
            </h2>

            <StyleButtons
              codeStyle={
                codeStyle
              }
              setCodeStyle={
                setCodeStyle
              }
            />
          </>
        )}

        <div className="selection-summary">
          <span className="summary-dot" />
          {language}
          <span>•</span>
          {level}

          {showCodeStyle && (
            <>
              <span>
                •
              </span>
              {codeStyle}
            </>
          )}
        </div>

        <div className="form-group">
          <label>
            ENTER YOUR PROGRAMMING PROBLEM
          </label>

          <textarea
            value={topic}
            onChange={(
              event
            ) =>
              setTopic(
                event.target.value
              )
            }
            placeholder="Example: Find maximum value from an array"
            rows={8}
          />
        </div>

        <button
          type="button"
          className="primary-button full-width"
          disabled={
            generating
          }
          onClick={
            generateCode
          }
        >
          {generating
            ? "GENERATING..."
            : "GENERATE CODE"}
        </button>

        {generatedCode && (
          <div className="generated-code-section">
            <ResultPanel
              title="GENERATED CODE"
            >
              <pre className="code-output">
                {
                  generatedCode
                }
              </pre>

              <div className="copy-action-row">
                <CopyButton
                  text={
                    generatedCode
                  }
                  defaultLabel="COPY CODE"
                />
              </div>
            </ResultPanel>
          </div>
        )}
      </section>
    </main>
  );
}

// ======================================================
// CODE LAB
// ======================================================

function LabPage({
  language,
  setLanguage,
  codeStyle,
  setCodeStyle,
  labCode,
  setLabCode,
  labInput,
  setLabInput,
  labResult,
  labRunning,
  runLabCode,
  clearLab,
}) {
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="CODE LAB"
        title="Run & Test Your Code"
        description="Run normal programming code with real execution."
      />

      <section className="content-card">
        <h2>
          Programming Language
        </h2>

        <LanguageButtons
          language={
            language
          }
          setLanguage={
            setLanguage
          }
        />

        <h2 className="top-gap">
          Code Style
        </h2>

        <StyleButtons
          codeStyle={
            codeStyle
          }
          setCodeStyle={
            setCodeStyle
          }
        />

        <div className="editor-label">
          CODE
        </div>

        <textarea
          className="code-editor"
          value={labCode}
          onChange={(
            event
          ) =>
            setLabCode(
              event.target.value
            )
          }
          placeholder="Write or paste code here..."
          spellCheck={false}
        />

        <div className="editor-label top-gap">
          STANDARD INPUT
        </div>

        <textarea
          className="input-editor"
          value={labInput}
          onChange={(
            event
          ) =>
            setLabInput(
              event.target.value
            )
          }
          placeholder="Enter program input here..."
          rows={5}
          spellCheck={false}
        />

        <div className="action-row">
          <button
            type="button"
            className="primary-button"
            disabled={
              labRunning
            }
            onClick={
              runLabCode
            }
          >
            {labRunning
              ? "RUNNING..."
              : "RUN CODE"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={
              clearLab
            }
          >
            CLEAR
          </button>
        </div>

        {labResult && (
          <ResultPanel
            title="ACTUAL OUTPUT"
          >
            <div className="runner-status">
              {
                labResult.status
              }
            </div>

            {labResult.stdout && (
              <pre className="terminal-output">
                {
                  labResult.stdout
                }
              </pre>
            )}

            {labResult.stderr && (
              <pre className="error-output">
                {
                  labResult.stderr
                }
              </pre>
            )}

            {labResult.compileOutput && (
              <pre className="error-output">
                {
                  labResult.compileOutput
                }
              </pre>
            )}

            {labResult.message && (
              <pre className="error-output">
                {
                  labResult.message
                }
              </pre>
            )}
          </ResultPanel>
        )}
      </section>
    </main>
  );
}

// ======================================================
// PRACTICE
// ======================================================

function PracticePage({
  level,
  setLevel,
  practiceQuestion,
  setPracticeQuestion,
  practiceAnswer,
  setPracticeAnswer,
  practiceResult,
  practiceLoading,
  generatePractice,
  evaluatePractice,
}) {
  const algorithms = [
    "Linear Search",
    "Binary Search",
    "Bubble Sort",
    "Selection Sort",
    "Insertion Sort",
    "Array Update",
    "Stack",
    "Queue",
  ];

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="PRACTICE"
        title="Practice Programming & Algorithms"
        description="Practice problems and improve your answers."
      />

      <section className="content-card">
        <h2>
          Learning Level
        </h2>

        <LevelButtons
          level={level}
          setLevel={setLevel}
        />

        <div className="form-group">
          <label>
            PRACTICE QUESTION
          </label>

          <textarea
            value={
              practiceQuestion
            }
            onChange={(
              event
            ) =>
              setPracticeQuestion(
                event.target.value
              )
            }
            placeholder="Enter a programming or algorithm problem..."
            rows={5}
          />
        </div>
      </section>

      <section className="content-card">
        <div className="eyebrow">
          ALGORITHM PRACTICE
        </div>

        <h2>
          Practice Algorithms
        </h2>

        <div className="topic-grid">
          {algorithms.map(
            (algorithm) => (
              <button
                key={
                  algorithm
                }
                type="button"
                className="topic-card topic-button"
                onClick={() =>
                  generatePractice(
                    algorithm
                  )
                }
              >
                <strong>
                  {
                    algorithm
                  }
                </strong>

                <span>
                  Generate practice
                </span>
              </button>
            )
          )}
        </div>

        {practiceResult && (
          <ResultPanel
            title="PRACTICE RESULT"
          >
            <div className="ai-text">
              {
                practiceResult
              }
            </div>
          </ResultPanel>
        )}

        <div className="form-group">
          <label>
            YOUR ANSWER
          </label>

          <textarea
            value={
              practiceAnswer
            }
            onChange={(
              event
            ) =>
              setPracticeAnswer(
                event.target.value
              )
            }
            placeholder="Write your answer here..."
            rows={7}
          />
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={
            practiceLoading
          }
          onClick={
            evaluatePractice
          }
        >
          {practiceLoading
            ? "CHECKING..."
            : "CHECK MY ANSWER"}
        </button>
      </section>
    </main>
  );
}

// ======================================================
// ALGORITHM GENERATOR
// ======================================================

function AlgorithmGeneratorPage({
  algorithmLevel,
  setAlgorithmLevel,
  algorithmTopic,
  setAlgorithmTopic,
  generatedAlgorithm,
  algorithmGenerating,
  generateAlgorithm,
}) {
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="ALGORITHM GENERATOR"
        title="Generate Easy, Exam-Ready Algorithms"
        description="Generate a clean algorithm in a simple college exam format."
      />

      <section className="content-card algorithm-generator-card">
        <h2>
          Learning level
        </h2>

        <AlgorithmLevelButtons
          level={
            algorithmLevel
          }
          setLevel={
            setAlgorithmLevel
          }
        />

        <div className="form-group top-gap">
          <label>
            ENTER ALGORITHM PROBLEM / INSTRUCTIONS
          </label>

          <textarea
            value={
              algorithmTopic
            }
            onChange={(
              event
            ) =>
              setAlgorithmTopic(
                event.target.value
              )
            }
            placeholder="Enter algorithm or problem here..."
            rows={8}
          />
        </div>

        <button
          type="button"
          className="primary-button full-width"
          disabled={
            algorithmGenerating
          }
          onClick={
            generateAlgorithm
          }
        >
          {algorithmGenerating
            ? "GENERATING..."
            : "GENERATE ALGORITHM"}
        </button>
      </section>

      {generatedAlgorithm && (
        <section className="content-card">
          <div className="algorithm-paper">
            <div className="algorithm-paper-title">
              GENERATED ALGORITHM
            </div>

            <pre className="algorithm-output">
              {
                generatedAlgorithm
              }
            </pre>

            <div className="copy-action-row">
              <CopyButton
                text={
                  generatedAlgorithm
                }
                defaultLabel="COPY ALGORITHM"
              />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// ======================================================
// ALGORITHM CODE RUNNER
// ======================================================

function AlgorithmRunnerPage({
  algorithmCode,
  setAlgorithmCode,
  algorithmInput,
  setAlgorithmInput,
  runnerResult,
  runnerRunning,
  runAlgorithmCode,
  clearAlgorithmRunner,
}) {
  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="ALGORITHM CODE RUNNER"
        title="Run Algorithm Programs"
        description="A completely separate runner for algorithm program code."
      />

      <section className="runner-warning">
        <div className="runner-warning-icon">
          ALGO
        </div>

        <div>
          <strong>
            Dedicated Algorithm Execution
          </strong>

          <p>
            The runner automatically detects the
            programming language from your code.
            No language or code-style selection is
            required.
          </p>
        </div>
      </section>

      <section className="content-card">
        <div className="selection-summary runner-auto-summary">
          <span className="summary-dot" />
          Automatic language detection enabled
        </div>

        <div className="editor-label">
          ALGORITHM PROGRAM CODE
        </div>

        <textarea
          className="code-editor algorithm-editor"
          value={
            algorithmCode
          }
          onChange={(
            event
          ) =>
            setAlgorithmCode(
              event.target.value
            )
          }
          placeholder={`Paste algorithm program code here...

C:
#include <stdio.h>

int main(void)
{
    return 0;
}

C++, Python, Java and JavaScript are also supported.`}
          spellCheck={false}
        />

        <div className="editor-label top-gap">
          INPUT
        </div>

        <textarea
          className="input-editor"
          value={
            algorithmInput
          }
          onChange={(
            event
          ) =>
            setAlgorithmInput(
              event.target.value
            )
          }
          placeholder="Enter input for your algorithm program..."
          rows={6}
          spellCheck={false}
        />

        <div className="action-row">
          <button
            type="button"
            className="primary-button"
            disabled={
              runnerRunning
            }
            onClick={
              runAlgorithmCode
            }
          >
            {runnerRunning
              ? "RUNNING ALGORITHM..."
              : "RUN ALGORITHM CODE"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={
              clearAlgorithmRunner
            }
          >
            CLEAR
          </button>
        </div>
      </section>

      {runnerResult && (
        <section className="content-card">
          <ResultPanel
            title="ALGORITHM EXECUTION RESULT"
          >
            {runnerResult.detectedLanguage && (
              <div className="selection-summary">
                <span className="summary-dot" />

                Detected:
                {" "}
                {
                  runnerResult.detectedLanguage
                }
              </div>
            )}

            <div className="runner-status">
              {
                runnerResult.status
              }
            </div>

            {runnerResult.stdout && (
              <pre className="terminal-output">
                {
                  runnerResult.stdout
                }
              </pre>
            )}

            {runnerResult.stderr && (
              <pre className="error-output">
                {
                  runnerResult.stderr
                }
              </pre>
            )}

            {runnerResult.compileOutput && (
              <pre className="error-output">
                {
                  runnerResult.compileOutput
                }
              </pre>
            )}

            {runnerResult.message && (
              <pre className="error-output">
                {
                  runnerResult.message
                }
              </pre>
            )}
          </ResultPanel>
        </section>
      )}
    </main>
  );
}

// ======================================================
// FOOTER
// ======================================================

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <CodeIcon />

        <strong>
          CodeMentor AI
        </strong>
      </div>

      <span>
        Learn • Generate • Practice • Execute
      </span>
    </footer>
  );
}

// ======================================================
// APP
// ======================================================

function App() {
  // ----------------------------------------------------
  // Navigation
  // ----------------------------------------------------

  const [
    page,
    setPage,
  ] = useState(
    "home"
  );

  // ----------------------------------------------------
  // General level
  // ----------------------------------------------------

  const [
    level,
    setLevel,
  ] = useState(
    "Beginner"
  );

  // ----------------------------------------------------
  // Language
  // ----------------------------------------------------

  const [
    language,
    setLanguage,
  ] = useState(
    "C"
  );

  // ----------------------------------------------------
  // Code style
  // ----------------------------------------------------

  const [
    codeStyle,
    setCodeStyle,
  ] = useState(
    "Modern Standard"
  );

  // ----------------------------------------------------
  // AI Teacher
  // ----------------------------------------------------

  const [
    teacherQuestion,
    setTeacherQuestion,
  ] = useState(
    ""
  );

  const [
    teacherAnswer,
    setTeacherAnswer,
  ] = useState(
    ""
  );

  const [
    teacherLoading,
    setTeacherLoading,
  ] = useState(
    false
  );

  const [
    algorithmMode,
    setAlgorithmMode,
  ] = useState(
    false
  );

  // ----------------------------------------------------
  // Algorithm Learning
  // ----------------------------------------------------

  const [
    algorithmTopic,
    setAlgorithmTopic,
  ] = useState(
    ""
  );

  const [
    algorithmAnswer,
    setAlgorithmAnswer,
  ] = useState(
    ""
  );

  const [
    algorithmLoading,
    setAlgorithmLoading,
  ] = useState(
    false
  );

  // ----------------------------------------------------
  // Code Generator
  // ----------------------------------------------------

  const [
    topic,
    setTopic,
  ] = useState(
    "Find maximum value from an array"
  );

  const [
    generatedCode,
    setGeneratedCode,
  ] = useState(
    ""
  );

  const [
    generating,
    setGenerating,
  ] = useState(
    false
  );

  // ----------------------------------------------------
  // Code Lab
  // ----------------------------------------------------

  const [
    labCode,
    setLabCode,
  ] = useState(
    ""
  );

  const [
    labInput,
    setLabInput,
  ] = useState(
    ""
  );

  const [
    labResult,
    setLabResult,
  ] = useState(
    null
  );

  const [
    labRunning,
    setLabRunning,
  ] = useState(
    false
  );

  // ----------------------------------------------------
  // Practice
  // ----------------------------------------------------

  const [
    practiceQuestion,
    setPracticeQuestion,
  ] = useState(
    ""
  );

  const [
    practiceAnswer,
    setPracticeAnswer,
  ] = useState(
    ""
  );

  const [
    practiceResult,
    setPracticeResult,
  ] = useState(
    ""
  );

  const [
    practiceLoading,
    setPracticeLoading,
  ] = useState(
    false
  );

  // ----------------------------------------------------
  // Algorithm Generator
  // ----------------------------------------------------

  const [
    algorithmLevel,
    setAlgorithmLevel,
  ] = useState(
    "Beginner"
  );

  const [
    generatedAlgorithm,
    setGeneratedAlgorithm,
  ] = useState(
    ""
  );

  const [
    algorithmGenerating,
    setAlgorithmGenerating,
  ] = useState(
    false
  );

  // ----------------------------------------------------
  // Algorithm Runner
  // ----------------------------------------------------

  const [
    algorithmCode,
    setAlgorithmCode,
  ] = useState(
    ""
  );

  const [
    algorithmInput,
    setAlgorithmInput,
  ] = useState(
    ""
  );

  const [
    runnerResult,
    setRunnerResult,
  ] = useState(
    null
  );

  const [
    runnerRunning,
    setRunnerRunning,
  ] = useState(
    false
  );

  // ====================================================
  // NAVIGATION
  // ====================================================

  function navigate(
    nextPage
  ) {
    setPage(
      nextPage
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ====================================================
  // AI TEACHER
  // ====================================================

  async function askTeacher() {
    if (
      !teacherQuestion.trim()
    ) {
      return;
    }

    setTeacherLoading(
      true
    );

    setTeacherAnswer(
      ""
    );

    try {
      const response =
        await fetch(
          `${API}/api/ai/teach`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                language,
                level,
                question:
                  teacherQuestion.trim(),
                algorithmMode,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "AI Teacher request failed."
        );
      }

      setTeacherAnswer(
        data.answer || ""
      );
    } catch (error) {
      setTeacherAnswer(
        `Error: ${error.message}`
      );
    } finally {
      setTeacherLoading(
        false
      );
    }
  }

  // ====================================================
  // ALGORITHM LEARNING
  // ====================================================

  async function askAlgorithm(
    selectedTopic,
    mode
  ) {
    const cleanTopic =
      String(
        selectedTopic || ""
      ).trim();

    if (!cleanTopic) {
      return;
    }

    setAlgorithmLoading(
      true
    );

    setAlgorithmAnswer(
      ""
    );

    try {
      const response =
        await fetch(
          `${API}/api/ai/algorithm`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                topic:
                  cleanTopic,
                level,
                mode,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Algorithm request failed."
        );
      }

      setAlgorithmAnswer(
        data.answer || ""
      );
    } catch (error) {
      setAlgorithmAnswer(
        `Error: ${error.message}`
      );
    } finally {
      setAlgorithmLoading(
        false
      );
    }
  }

  // ====================================================
  // CODE GENERATOR
  // ====================================================

  async function generateCode() {
    if (
      !topic.trim()
    ) {
      return;
    }

    setGenerating(
      true
    );

    setGeneratedCode(
      ""
    );

    try {
      const response =
        await fetch(
          `${API}/api/ai/generate-code`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                language,
                level,
                codeStyle,
                topic:
                  topic.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
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
        `Error: ${error.message}`
      );
    } finally {
      setGenerating(
        false
      );
    }
  }

  // ====================================================
  // CODE LAB
  // ====================================================

  async function runLabCode() {
    if (
      !labCode.trim()
    ) {
      return;
    }

    setLabRunning(
      true
    );

    setLabResult(
      null
    );

    try {
      const response =
        await fetch(
          `${API}/api/code/run`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                language,
                code:
                  labCode,
                stdin:
                  labInput,
                codeStyle,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Code execution failed."
        );
      }

      setLabResult(
        data
      );
    } catch (error) {
      setLabResult({
        status:
          "ERROR",
        stdout:
          "",
        stderr:
          error.message,
        compileOutput:
          "",
        message:
          "",
      });
    } finally {
      setLabRunning(
        false
      );
    }
  }

  function clearLab() {
    setLabCode(
      ""
    );

    setLabInput(
      ""
    );

    setLabResult(
      null
    );
  }

  // ====================================================
  // PRACTICE
  // ====================================================

  async function generatePractice(
    algorithm
  ) {
    setPracticeLoading(
      true
    );

    setPracticeResult(
      ""
    );

    try {
      const response =
        await fetch(
          `${API}/api/ai/algorithm`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                topic:
                  algorithm,
                level,
                mode:
                  "practice",
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Practice generation failed."
        );
      }

      setPracticeQuestion(
        algorithm
      );

      setPracticeResult(
        data.answer || ""
      );
    } catch (error) {
      setPracticeResult(
        `Error: ${error.message}`
      );
    } finally {
      setPracticeLoading(
        false
      );
    }
  }

  async function evaluatePractice() {
    if (
      !practiceQuestion.trim() &&
      !practiceAnswer.trim()
    ) {
      return;
    }

    setPracticeLoading(
      true
    );

    try {
      const response =
        await fetch(
          `${API}/api/ai/algorithm`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                topic:
                  practiceQuestion.trim() ||
                  "Algorithm practice",
                level,
                mode:
                  "practice",
                userAnswer:
                  practiceAnswer.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Answer evaluation failed."
        );
      }

      setPracticeResult(
        data.answer || ""
      );
    } catch (error) {
      setPracticeResult(
        `Error: ${error.message}`
      );
    } finally {
      setPracticeLoading(
        false
      );
    }
  }

  // ====================================================
  // ALGORITHM GENERATOR
  // ====================================================

  async function generateAlgorithm() {
    if (
      !algorithmTopic.trim()
    ) {
      return;
    }

    setAlgorithmGenerating(
      true
    );

    setGeneratedAlgorithm(
      ""
    );

    try {
      const response =
        await fetch(
          `${API}/api/ai/generate-algorithm`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                topic:
                  algorithmTopic.trim(),
                level:
                  algorithmLevel,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Algorithm generation failed."
        );
      }

      setGeneratedAlgorithm(
        data.algorithm || ""
      );
    } catch (error) {
      setGeneratedAlgorithm(
        `Error: ${error.message}`
      );
    } finally {
      setAlgorithmGenerating(
        false
      );
    }
  }

  // ====================================================
  // ALGORITHM CODE RUNNER
  // ====================================================

  async function runAlgorithmCode() {
    if (
      !algorithmCode.trim()
    ) {
      return;
    }

    setRunnerRunning(
      true
    );

    setRunnerResult(
      null
    );

    try {
      const response =
        await fetch(
          `${API}/api/algorithm/run`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                code:
                  algorithmCode,
                stdin:
                  algorithmInput,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Algorithm code execution failed."
        );
      }

      setRunnerResult(
        data
      );
    } catch (error) {
      setRunnerResult({
        status:
          "ERROR",
        stderr:
          error.message,
        stdout:
          "",
        compileOutput:
          "",
        message:
          "",
      });
    } finally {
      setRunnerRunning(
        false
      );
    }
  }

  function clearAlgorithmRunner() {
    setAlgorithmCode(
      ""
    );

    setAlgorithmInput(
      ""
    );

    setRunnerResult(
      null
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  let currentPage;

  switch (page) {
    case "learn":
      currentPage = (
        <LearnPage
          level={
            level
          }
          setLevel={
            setLevel
          }
          algorithmTopic={
            algorithmTopic
          }
          setAlgorithmTopic={
            setAlgorithmTopic
          }
          algorithmAnswer={
            algorithmAnswer
          }
          algorithmLoading={
            algorithmLoading
          }
          askAlgorithm={
            askAlgorithm
          }
        />
      );
      break;

    case "teacher":
      currentPage = (
        <TeacherPage
          level={
            level
          }
          setLevel={
            setLevel
          }
          language={
            language
          }
          setLanguage={
            setLanguage
          }
          teacherQuestion={
            teacherQuestion
          }
          setTeacherQuestion={
            setTeacherQuestion
          }
          teacherAnswer={
            teacherAnswer
          }
          teacherLoading={
            teacherLoading
          }
          askTeacher={
            askTeacher
          }
          algorithmMode={
            algorithmMode
          }
          setAlgorithmMode={
            setAlgorithmMode
          }
        />
      );
      break;

    case "generator":
      currentPage = (
        <GeneratorPage
          level={
            level
          }
          setLevel={
            setLevel
          }
          language={
            language
          }
          setLanguage={
            setLanguage
          }
          codeStyle={
            codeStyle
          }
          setCodeStyle={
            setCodeStyle
          }
          topic={
            topic
          }
          setTopic={
            setTopic
          }
          generatedCode={
            generatedCode
          }
          generating={
            generating
          }
          generateCode={
            generateCode
          }
        />
      );
      break;

    case "lab":
      currentPage = (
        <LabPage
          language={
            language
          }
          setLanguage={
            setLanguage
          }
          codeStyle={
            codeStyle
          }
          setCodeStyle={
            setCodeStyle
          }
          labCode={
            labCode
          }
          setLabCode={
            setLabCode
          }
          labInput={
            labInput
          }
          setLabInput={
            setLabInput
          }
          labResult={
            labResult
          }
          labRunning={
            labRunning
          }
          runLabCode={
            runLabCode
          }
          clearLab={
            clearLab
          }
        />
      );
      break;

    case "practice":
      currentPage = (
        <PracticePage
          level={
            level
          }
          setLevel={
            setLevel
          }
          practiceQuestion={
            practiceQuestion
          }
          setPracticeQuestion={
            setPracticeQuestion
          }
          practiceAnswer={
            practiceAnswer
          }
          setPracticeAnswer={
            setPracticeAnswer
          }
          practiceResult={
            practiceResult
          }
          practiceLoading={
            practiceLoading
          }
          generatePractice={
            generatePractice
          }
          evaluatePractice={
            evaluatePractice
          }
        />
      );
      break;

    case "algorithm-generator":
      currentPage = (
        <AlgorithmGeneratorPage
          algorithmLevel={
            algorithmLevel
          }
          setAlgorithmLevel={
            setAlgorithmLevel
          }
          algorithmTopic={
            algorithmTopic
          }
          setAlgorithmTopic={
            setAlgorithmTopic
          }
          generatedAlgorithm={
            generatedAlgorithm
          }
          algorithmGenerating={
            algorithmGenerating
          }
          generateAlgorithm={
            generateAlgorithm
          }
        />
      );
      break;

    case "algorithm-runner":
      currentPage = (
        <AlgorithmRunnerPage
          algorithmCode={
            algorithmCode
          }
          setAlgorithmCode={
            setAlgorithmCode
          }
          algorithmInput={
            algorithmInput
          }
          setAlgorithmInput={
            setAlgorithmInput
          }
          runnerResult={
            runnerResult
          }
          runnerRunning={
            runnerRunning
          }
          runAlgorithmCode={
            runAlgorithmCode
          }
          clearAlgorithmRunner={
            clearAlgorithmRunner
          }
        />
      );
      break;

    default:
      currentPage = (
        <HomePage
          navigate={
            navigate
          }
        />
      );
  }

  return (
    <div className="app">
      <SiteHeader
        page={
          page
        }
        navigate={
          navigate
        }
      />

      <div className="page-content">
        {
          currentPage
        }
      </div>

      <Footer />
    </div>
  );
}

// ======================================================
// START
// ======================================================

createRoot(
  document.getElementById(
    "root"
  )
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);