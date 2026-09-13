import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

const API =
  import.meta.env.VITE_API_URL ||
  "https://codementor-ai-backend-b276.onrender.com";

// ============================================================
// LANGUAGES
// ============================================================

const LANGUAGES = [
  {
    name: "C",
    icon: "C",
    starter: `#include <stdio.h>

int main(void)
{
    // Print a welcome message.
    printf("Hello, CodeMentor AI!\\n");

    // Return 0 to indicate successful execution.
    return 0;
}`,
  },

  {
    name: "C++",
    icon: "C++",
    starter: `#include <iostream>
using namespace std;

int main()
{
    // Print a welcome message.
    cout << "Hello, CodeMentor AI!" << endl;

    // Return 0 to indicate successful execution.
    return 0;
}`,
  },

  {
    name: "Python",
    icon: "Py",
    starter: `print("Hello, CodeMentor AI!")`,
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

const ALGORITHM_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advance",
];

const ALGORITHM_TOPICS = [
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

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function LevelButtons({
  level,
  onSelect,
}) {
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
          onClick={() =>
            onSelect(item)
          }
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function AlgorithmLevelButtons({
  level,
  onSelect,
}) {
  return (
    <div className="level-buttons">
      {ALGORITHM_LEVELS.map((item) => (
        <button
          type="button"
          key={item}
          className={
            level === item
              ? "level-button active"
              : "level-button"
          }
          onClick={() =>
            onSelect(item)
          }
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
          onClick={() =>
            onSelect(item.name)
          }
        >
          <span className="button-language-icon">
            {item.icon}
          </span>

          <span>
            {item.name}
          </span>
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

        <span>
          MODERN STANDARD
        </span>
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

        <span>
          LEGACY TURBO C
        </span>
      </button>
    </div>
  );
}

function CopyButton({
  text,
  label = "COPY",
  copied,
  onCopy,
}) {
  return (
    <button
      type="button"
      className="copy-button"
      onClick={() =>
        onCopy(text)
      }
    >
      {copied
        ? "COPIED ✓"
        : label}
    </button>
  );
}

// ============================================================
// HOME
// ============================================================

function HomePage({
  setPage,
}) {
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
          <span>
            Build the Future.
          </span>
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
            onClick={() =>
              setPage("learn")
            }
          >
            START LEARNING
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setPage("generator")
            }
          >
            GENERATE CODE
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setPage(
                "algorithm-generator"
              )
            }
          >
            GENERATE ALGORITHM
          </button>
        </div>

        <div className="language-showcase">
          {LANGUAGES.map(
            (item) => (
              <div
                className="language-card"
                key={item.name}
              >
                <div className="language-icon">
                  {item.icon}
                </div>

                <span>
                  {item.name}
                </span>
              </div>
            )
          )}
        </div>
      </section>

      <section className="feature-section">
        <div className="section-heading">
          <div className="small-label">
            WHY CODEMENTOR AI?
          </div>

          <h2>
            Your Personal AI Coding Lab
          </h2>

          <p>
            Learn, generate, execute,
            understand algorithms and
            practice in one platform.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-number">
              01
            </div>

            <h3>
              AI Teacher
            </h3>

            <p>
              Ask programming questions
              and receive beginner-friendly
              explanations.
            </p>

            <button
              type="button"
              onClick={() =>
                setPage("teacher")
              }
            >
              OPEN AI TEACHER →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-number">
              02
            </div>

            <h3>
              Code Generator
            </h3>

            <p>
              Generate one complete
              program at a time in your
              selected language.
            </p>

            <button
              type="button"
              onClick={() =>
                setPage("generator")
              }
            >
              OPEN GENERATOR →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-number">
              03
            </div>

            <h3>
              Code Lab
            </h3>

            <p>
              Write code and let the lab
              automatically detect the
              language and code style.
            </p>

            <button
              type="button"
              onClick={() =>
                setPage("lab")
              }
            >
              OPEN CODE LAB →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-number">
              04
            </div>

            <h3>
              Algorithm Generator
            </h3>

            <p>
              Generate short,
              exam-ready algorithms in
              notebook style.
            </p>

            <button
              type="button"
              onClick={() =>
                setPage(
                  "algorithm-generator"
                )
              }
            >
              GENERATE ALGORITHM →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-number">
              06
            </div>

            <h3>
              Practice
            </h3>

            <p>
              Solve programming and
              algorithm challenges.
            </p>

            <button
              type="button"
              onClick={() =>
                setPage("practice")
              }
            >
              START PRACTICE →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// LEARN PAGE
// ============================================================

function LearnPage({
  setLanguage,
  setCode,
  setPage,
  algorithmLevel,
  setAlgorithmLevel,
  algorithmQuestion,
  setAlgorithmQuestion,
  algorithmAnswer,
  algorithmBusy,
  askAlgorithmTeacher,
}) {
  function selectLanguage(name) {
    setLanguage(name);

    const selected =
      LANGUAGES.find(
        (item) =>
          item.name === name
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

        <h1>
          Learn Programming
        </h1>

        <p>
          Build a strong foundation in
          programming and algorithms.
        </p>
      </div>

      <section className="learning-section">
        <div className="section-heading left">
          <div className="small-label">
            PROGRAMMING
          </div>

          <h2>
            Choose a language
          </h2>
        </div>

        <div className="learning-grid">
          {LANGUAGES.map(
            (item) => (
              <button
                type="button"
                className="learning-card"
                key={item.name}
                onClick={() =>
                  selectLanguage(
                    item.name
                  )
                }
              >
                <div className="large-language-icon">
                  {item.icon}
                </div>

                <h2>
                  {item.name}
                </h2>

                <p>
                  Learn {item.name}
                  from beginner to
                  advanced.
                </p>

                <span>
                  START LEARNING →
                </span>
              </button>
            )
          )}
        </div>
      </section>

      <section className="algorithm-learning-card">
        <div className="small-label">
          ALGORITHM LEARNING
        </div>

        <h2>
          Learn Algorithms Easily
        </h2>

        <p>
          Select an algorithm or ask
          your own algorithm question.
        </p>

        <div className="algorithm-topic-grid">
          {ALGORITHM_TOPICS.map(
            (topic) => (
              <button
                type="button"
                key={topic}
                className="algorithm-topic-button"
                onClick={() => {
                  setAlgorithmQuestion(
                    `Explain ${topic} algorithm in very easy language.`
                  );
                }}
              >
                {topic}
              </button>
            )
          )}
        </div>

        <div className="control-section algorithm-learning-level">
          <label>
            LEARNING LEVEL
          </label>

          <AlgorithmLevelButtons
            level={
              algorithmLevel
            }
            onSelect={
              setAlgorithmLevel
            }
          />
        </div>

        <label className="big-label">
          ASK ALGORITHM TEACHER
        </label>

        <textarea
          className="question-box"
          value={algorithmQuestion}
          onChange={(event) =>
            setAlgorithmQuestion(
              event.target.value
            )
          }
          placeholder="Example: Explain Binary Search in very easy language."
        />

        <button
          type="button"
          className="primary-button full-button"
          disabled={
            algorithmBusy
          }
          onClick={
            askAlgorithmTeacher
          }
        >
          {algorithmBusy
            ? "AI IS THINKING..."
            : "✦ TEACH ME ALGORITHM"}
        </button>

        {algorithmAnswer && (
          <div className="answer-panel">
            <div className="answer-title">
              ALGORITHM TEACHER
            </div>

            <div className="answer-content">
              {algorithmAnswer}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

// ============================================================
// AI TEACHER
// ============================================================

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
          <label>
            PROGRAMMING LANGUAGE
          </label>

          <LanguageButtons
            language={language}
            onSelect={setLanguage}
            compact
          />
        </div>

        <div className="control-section">
          <label>
            YOUR LEARNING LEVEL
          </label>

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
            setQuestion(
              event.target.value
            )
          }
          placeholder="Example: Explain loops in Python with a simple example."
        />

        <button
          type="button"
          className="primary-button full-button"
          onClick={() =>
            askTeacher()
          }
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

// ============================================================
// CODE GENERATOR
// ============================================================

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
  generatorBusy,
  generateCode,
  copiedCode,
  copyGeneratedCode,
  sendGeneratedToLab,
}) {
  const showStyle =
    language === "C" ||
    language === "C++";

  return (
    <main className="content-page">
      <div className="page-header">
        <div className="small-label">
          AI CODE GENERATOR
        </div>

        <h1>
          Solve Any Programming
          Problem
        </h1>

        <p>
          Generate one complete program
          at a time. Code Generation
          Style is available only for
          C and C++.
        </p>
      </div>

      <section className="generator-panel">
        <div className="control-section">
          <label>
            YOUR LEARNING LEVEL
          </label>

          <LevelButtons
            level={level}
            onSelect={setLevel}
          />
        </div>

        <div className="control-section">
          <label>
            PROGRAMMING LANGUAGE
          </label>

          <LanguageButtons
            language={language}
            onSelect={setLanguage}
          />
        </div>

        {showStyle && (
          <div className="control-section">
            <label>
              CODE GENERATION STYLE
            </label>

            <StyleButtons
              codeStyle={
                codeStyle
              }
              onSelect={
                setCodeStyle
              }
            />
          </div>
        )}

        <div className="selected-generator-info">
          <span className="selected-dot"></span>

          <strong>
            {language}
          </strong>

          <span>•</span>

          <span>
            {level}
          </span>

          {showStyle && (
            <>
              <span>•</span>

              <span>
                {codeStyle}
              </span>
            </>
          )}
        </div>

        <label className="big-label">
          ENTER YOUR PROGRAMMING
          PROBLEM
        </label>

        <textarea
          className="topic-box"
          value={codeTopic}
          onChange={(event) =>
            setCodeTopic(
              event.target.value
            )
          }
          placeholder="Example: Find the maximum value from an array"
          spellCheck="false"
        />

        <div className="example-section">
          <span>
            TRY AN EXAMPLE:
          </span>

          <div className="example-buttons">
            <button
              type="button"
              onClick={() =>
                setCodeTopic(
                  "Find the maximum value from an array"
                )
              }
            >
              Find maximum
            </button>

            <button
              type="button"
              onClick={() =>
                setCodeTopic(
                  "Check whether a number is prime"
                )
              }
            >
              Prime number
            </button>

            <button
              type="button"
              onClick={() =>
                setCodeTopic(
                  "Reverse a string"
                )
              }
            >
              Reverse string
            </button>

            <button
              type="button"
              onClick={() =>
                setCodeTopic(
                  "Sort an array"
                )
              }
            >
              Sort array
            </button>

            <button
              type="button"
              onClick={() =>
                setCodeTopic(
                  "Check whether a string is palindrome"
                )
              }
            >
              Palindrome
            </button>
          </div>
        </div>

        <div className="generator-note">
          <strong>
            ✓ ONE LANGUAGE AT A TIME
          </strong>

          <span>
            Python is generated without
            comments. C, C++, Java and
            JavaScript receive useful
            comments. Legacy Turbo C is
            available only for C/C++.
          </span>
        </div>

        <button
          type="button"
          className="generate-code-button"
          onClick={
            generateCode
          }
          disabled={
            generatorBusy
          }
        >
          {generatorBusy
            ? "GENERATING CODE..."
            : `✦ GENERATE ${language.toUpperCase()} CODE`}
        </button>

        {generatedCode && (
          <section className="generated-output">
            <div className="output-header">
              <div>
                <span className="result-label">
                  CODE OUTPUT
                </span>

                <h2>
                  Generated {language}
                  Program
                </h2>
              </div>

              {showStyle && (
                <span className="code-style-badge">
                  {codeStyle}
                </span>
              )}
            </div>

            <pre className="generated-code">
              <code>
                {generatedCode}
              </code>
            </pre>

            <div className="generated-actions">
              <CopyButton
                text={generatedCode}
                label="COPY CODE"
                copied={
                  copiedCode
                }
                onCopy={
                  copyGeneratedCode
                }
              />

              <button
                type="button"
                onClick={
                  sendGeneratedToLab
                }
              >
                RUN IN CODE LAB →
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

// ============================================================
// CODE LAB
// ============================================================

function LabPage({
  code,
  setCode,
  stdin,
  setStdin,
  output,
  running,
  runCode,
  detectedLanguage,
  detectedStyle,
  clearLab,
}) {
  // Android WebView fix:
  // Keep the INPUT textarea uncontrolled so React does not rewrite
  // its value on every keystroke. Rewriting a focused textarea on
  // every Android input event can cause the WebView to jump the
  // whole page to the bottom.
  const stdinRef = useRef(null);

  // Synchronize INPUT when its value changes from outside the
  // textarea, for example CLEAR or another part of the app.
  useEffect(() => {
    const textarea = stdinRef.current;

    if (!textarea) {
      return;
    }

    // Never rewrite the DOM value while the user is typing.
    if (document.activeElement === textarea) {
      return;
    }

    const nextValue = stdin || "";

    if (textarea.value !== nextValue) {
      textarea.value = nextValue;
    }
  }, [stdin]);

  function handleStdinChange(event) {
    const textarea = event.currentTarget;

    // Save the current page position before React rerenders.
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    // Keep the parent state updated for RUN CODE.
    // The textarea itself remains uncontrolled.
    setStdin(textarea.value);

    // Restore the Android WebView position after the state update.
    requestAnimationFrame(() => {
      window.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: "auto",
      });

      try {
        textarea.focus({
          preventScroll: true,
        });

        textarea.setSelectionRange(
          selectionStart,
          selectionEnd
        );
      } catch {
        // Ignore Android WebView focus/selection errors.
      }
    });
  }

  return (
    <main className="content-page lab-page">
      <div className="page-header">
        <div className="small-label">
          CODE LAB
        </div>

        <h1>
          Write. Run. Learn.
        </h1>

        <p>
          Write your program and
          CodeMentor AI automatically
          detects the programming language
          and code style.
        </p>
      </div>

      <section className="lab-panel">
        <div className="automatic-detection-banner">
          <div>
            <span className="detection-dot"></span>

            <strong>
              Automatic language &amp;
              code style detection enabled
            </strong>
          </div>

          {detectedLanguage && (
            <div className="detected-result">
              Detected:

              <strong>
                {detectedLanguage}
              </strong>

              <span>•</span>

              <strong>
                {detectedStyle}
              </strong>
            </div>
          )}
        </div>

        <div className="lab-action-row">
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

          <button
            type="button"
            className="clear-button"
            onClick={clearLab}
          >
            CLEAR
          </button>
        </div>

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
              placeholder="Paste or write C, C++, Python, Java or JavaScript code here..."
            />
          </div>

          <div className="output-side">
            <div className="editor-title">
              INPUT
            </div>

            <textarea
              ref={stdinRef}
              className="stdin-editor"
              defaultValue={stdin}
              onChange={handleStdinChange}
              placeholder="Enter program input here..."
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
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
      </section>
    </main>
  );
}

function PracticePage({
  page,
  setPage,
  language,
  level,
  practiceQuestion,
  setPracticeQuestion,
  practiceAnswer,
  practiceBusy,
  generatePractice,
  algorithmLevel,
  setAlgorithmLevel,
  algorithmPracticeTopic,
  setAlgorithmPracticeTopic,
  algorithmStudentAnswer,
  setAlgorithmStudentAnswer,
  algorithmPracticeAnswer,
  algorithmPracticeBusy,
  evaluateAlgorithmPractice,
}) {
  return (
    <main className="content-page">
      <div className="page-header">
        <div className="small-label">
          PRACTICE ARENA
        </div>

        <h1>
          Improve Your Skills
        </h1>

        <p>
          Practice programming and
          algorithms with AI assistance.
        </p>
      </div>

      <div className="practice-tabs">
        <button
          type="button"
          className={
            page === "practice"
              ? "practice-tab active"
              : "practice-tab"
          }
          onClick={() => {}}
        >
          PROGRAMMING PRACTICE
        </button>

        <button
          type="button"
          className="practice-tab"
          onClick={() =>
            setPage(
              "algorithm-practice"
            )
          }
        >
          ALGORITHM PRACTICE
        </button>
      </div>

      <section className="practice-panel">
        <div className="small-label">
          PROGRAMMING PRACTICE
        </div>

        <h2>
          Generate a Coding Challenge
        </h2>

        <p>
          Current language:{" "}
          <strong>
            {language}
          </strong>{" "}
          · Level:{" "}
          <strong>
            {level}
          </strong>
        </p>

        <textarea
          className="question-box"
          value={practiceQuestion}
          onChange={(event) =>
            setPracticeQuestion(
              event.target.value
            )
          }
          placeholder="Example: Give me a beginner array problem."
        />

        <button
          type="button"
          className="primary-button full-button"
          onClick={
            generatePractice
          }
          disabled={
            practiceBusy
          }
        >
          {practiceBusy
            ? "GENERATING..."
            : "GENERATE PRACTICE"}
        </button>

        {practiceAnswer && (
          <div className="answer-panel">
            <div className="answer-title">
              PRACTICE CHALLENGE
            </div>

            <div className="answer-content">
              {practiceAnswer}
            </div>
          </div>
        )}
      </section>

      <section className="practice-panel algorithm-practice-preview">
        <div className="small-label">
          ALGORITHM PRACTICE
        </div>

        <h2>
          Practice Algorithms
        </h2>

        <p>
          Generate an algorithm task,
          write your answer and let the AI
          evaluate it.
        </p>

        <div className="control-section">
          <label>
            LEARNING LEVEL
          </label>

          <AlgorithmLevelButtons
            level={
              algorithmLevel
            }
            onSelect={
              setAlgorithmLevel
            }
          />
        </div>

        <input
          className="practice-input"
          value={
            algorithmPracticeTopic
          }
          onChange={(event) =>
            setAlgorithmPracticeTopic(
              event.target.value
            )
          }
          placeholder="Example: Array Update Operation"
        />

        <textarea
          className="question-box"
          value={
            algorithmStudentAnswer
          }
          onChange={(event) =>
            setAlgorithmStudentAnswer(
              event.target.value
            )
          }
          placeholder="Write your algorithm answer here..."
        />

        <button
          type="button"
          className="primary-button full-button"
          onClick={
            evaluateAlgorithmPractice
          }
          disabled={
            algorithmPracticeBusy
          }
        >
          {algorithmPracticeBusy
            ? "EVALUATING..."
            : "EVALUATE ALGORITHM"}
        </button>

        {algorithmPracticeAnswer && (
          <div className="answer-panel">
            <div className="answer-title">
              ALGORITHM EVALUATION
            </div>

            <div className="answer-content">
              {algorithmPracticeAnswer}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

// ============================================================
// ALGORITHM GENERATOR
// ============================================================

function AlgorithmGeneratorPage({
  algorithmLevel,
  setAlgorithmLevel,
  algorithmTopic,
  setAlgorithmTopic,
  generatedAlgorithm,
  algorithmGenerating,
  generateAlgorithm,
  copiedAlgorithm,
  copyAlgorithm,
}) {
  return (
    <main className="content-page">
      <div className="page-header">
        <div className="small-label">
          ALGORITHM GENERATOR
        </div>

        <h1>
          Generate Easy,
          Exam-Ready Algorithms
        </h1>

        <p>
          Generate a clean algorithm in a
          simple college exam format.
        </p>
      </div>

      <section className="algorithm-generator-card">
        <h2>
          Learning level
        </h2>

        <AlgorithmLevelButtons
          level={algorithmLevel}
          onSelect={
            setAlgorithmLevel
          }
        />

        <div className="form-group top-gap">
          <label>
            ENTER ALGORITHM PROBLEM /
            INSTRUCTIONS
          </label>

          <textarea
            value={algorithmTopic}
            onChange={(event) =>
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
          className="primary-button full-button"
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
        <section className="algorithm-output-card">
          <div className="algorithm-paper">
            <div className="algorithm-paper-title">
              GENERATED ALGORITHM
            </div>

            <pre className="algorithm-output">
              {generatedAlgorithm}
            </pre>

            <div className="copy-action-row">
              <CopyButton
                text={
                  generatedAlgorithm
                }
                label="COPY ALGORITHM"
                copied={
                  copiedAlgorithm
                }
                onCopy={
                  copyAlgorithm
                }
              />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// ============================================================
// FOOTER
// ============================================================

function Footer({
  setPage,
}) {
  return (
    <footer className="footer">
      <div>
        <p className="made-by">
          Made By Kirtan Ka.patel
        </p>
      </div>

      <div className="footer-links">
        <button
          type="button"
          onClick={() =>
            setPage("learn")
          }
        >
          Learn
        </button>

        <button
          type="button"
          onClick={() =>
            setPage("teacher")
          }
        >
          AI Teacher
        </button>

        <button
          type="button"
          onClick={() =>
            setPage("generator")
          }
        >
          Code Generator
        </button>

        <button
          type="button"
          onClick={() =>
            setPage("lab")
          }
        >
          Code Lab
        </button>

        <button
          type="button"
          onClick={() =>
            setPage("practice")
          }
        >
          Practice
        </button>

        <button
          type="button"
          onClick={() =>
            setPage(
              "algorithm-generator"
            )
          }
        >
          Algorithm Generator
        </button>
      </div>

      <div className="copyright">
        © {new Date().getFullYear()}{" "}
        CodeMentor AI
      </div>
    </footer>
  );
}

// ============================================================
// MAIN APP
// ============================================================

function App() {
  const [
    page,
    setPage,
  ] = useState("home");

  // ----------------------------------------------------------
  // PROGRAMMING STATE
  // ----------------------------------------------------------

  const [
    language,
    setLanguage,
  ] = useState("Python");

  const [
    level,
    setLevel,
  ] = useState("Beginner");

  const [
    codeStyle,
    setCodeStyle,
  ] = useState("Modern Standard");

  // ----------------------------------------------------------
  // AI TEACHER
  // ----------------------------------------------------------

  const [
    question,
    setQuestion,
  ] = useState("");

  const [
    answer,
    setAnswer,
  ] = useState("");

  const [
    busy,
    setBusy,
  ] = useState(false);

  // ----------------------------------------------------------
  // CODE GENERATOR
  // ----------------------------------------------------------

  const [
    codeTopic,
    setCodeTopic,
  ] = useState("");

  const [
    generatedCode,
    setGeneratedCode,
  ] = useState("");

  const [
    generatorBusy,
    setGeneratorBusy,
  ] = useState(false);

  const [
    copiedCode,
    setCopiedCode,
  ] = useState(false);

  // ----------------------------------------------------------
  // CODE LAB
  // ----------------------------------------------------------

  const [
    code,
    setCode,
  ] = useState(
    LANGUAGES.find(
      (item) =>
        item.name === "Python"
    )?.starter || ""
  );

  const [
    stdin,
    setStdin,
  ] = useState("");

  const [
    output,
    setOutput,
  ] = useState("");

  const [
    running,
    setRunning,
  ] = useState(false);

  const [
    detectedLanguage,
    setDetectedLanguage,
  ] = useState("");

  const [
    detectedStyle,
    setDetectedStyle,
  ] = useState("");

  // ----------------------------------------------------------
  // ALGORITHM TEACHER
  // ----------------------------------------------------------

  const [
    algorithmLevel,
    setAlgorithmLevel,
  ] = useState("Beginner");

  const [
    algorithmQuestion,
    setAlgorithmQuestion,
  ] = useState("");

  const [
    algorithmAnswer,
    setAlgorithmAnswer,
  ] = useState("");

  const [
    algorithmBusy,
    setAlgorithmBusy,
  ] = useState(false);

  // ----------------------------------------------------------
  // ALGORITHM GENERATOR
  // ----------------------------------------------------------

  const [
    algorithmTopic,
    setAlgorithmTopic,
  ] = useState("");

  const [
    generatedAlgorithm,
    setGeneratedAlgorithm,
  ] = useState("");

  const [
    algorithmGenerating,
    setAlgorithmGenerating,
  ] = useState(false);

  const [
    copiedAlgorithm,
    setCopiedAlgorithm,
  ] = useState(false);

  // ----------------------------------------------------------
  // PROGRAMMING PRACTICE
  // ----------------------------------------------------------

  const [
    practiceQuestion,
    setPracticeQuestion,
  ] = useState("");

  const [
    practiceAnswer,
    setPracticeAnswer,
  ] = useState("");

  const [
    practiceBusy,
    setPracticeBusy,
  ] = useState(false);

  // ----------------------------------------------------------
  // ALGORITHM PRACTICE
  // ----------------------------------------------------------

  const [
    algorithmPracticeTopic,
    setAlgorithmPracticeTopic,
  ] = useState(
    "Array Update Operation"
  );

  const [
    algorithmStudentAnswer,
    setAlgorithmStudentAnswer,
  ] = useState("");

  const [
    algorithmPracticeAnswer,
    setAlgorithmPracticeAnswer,
  ] = useState("");

  const [
    algorithmPracticeBusy,
    setAlgorithmPracticeBusy,
  ] = useState(false);

  // ==========================================================
  // CHANGE PROGRAMMING LANGUAGE
  // ==========================================================

  function changeLanguage(
    newLanguage,
    resetEditor = true
  ) {
    setLanguage(newLanguage);

    if (
      newLanguage !== "C" &&
      newLanguage !== "C++"
    ) {
      setCodeStyle(
        "Modern Standard"
      );
    }

    if (resetEditor) {
      const selected =
        LANGUAGES.find(
          (item) =>
            item.name ===
            newLanguage
        );

      if (selected) {
        setCode(
          selected.starter
        );
      }
    }
  }

  // ==========================================================
  // AI TEACHER
  // ==========================================================

  async function askTeacher(
    customQuestion
  ) {
    const q = (
      customQuestion ??
      question
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
      const response =
        await fetch(
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

      const data =
        await response.json();

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

  // ==========================================================
  // ALGORITHM TEACHER
  // ==========================================================

  async function askAlgorithmTeacher() {
    const q =
      algorithmQuestion.trim();

    if (!q) {
      setAlgorithmAnswer(
        "Please enter an algorithm topic first."
      );

      return;
    }

    setAlgorithmBusy(true);
    setAlgorithmAnswer("");

    try {
      const response =
        await fetch(
          `${API}/api/ai/algorithm`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              level:
                algorithmLevel,
              question: q,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
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
      setAlgorithmBusy(false);
    }
  }

  // ==========================================================
  // CODE GENERATOR
  // ==========================================================

  async function generateCode() {
    const topic =
      codeTopic.trim();

    if (!topic) {
      setGeneratedCode(
        "Enter a programming problem first."
      );

      return;
    }

    setGeneratorBusy(true);
    setGeneratedCode("");
    setCopiedCode(false);

    try {
      const response =
        await fetch(
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
              codeStyle:
                language === "C" ||
                language === "C++"
                  ? codeStyle
                  : "Modern Standard",
              topic,
            }),
          }
        );

      const data =
        await response.json();

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
        `Generation error:\n${error.message}`
      );
    } finally {
      setGeneratorBusy(false);
    }
  }

  // ==========================================================
  // COPY CODE
  // ==========================================================

  async function copyGeneratedCode(
    text
  ) {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopiedCode(true);

      setTimeout(() => {
        setCopiedCode(false);
      }, 1400);
    } catch {
      setCopiedCode(false);
    }
  }

  // ==========================================================
  // SEND GENERATED CODE TO LAB
  // ==========================================================

  function sendGeneratedToLab() {
    if (!generatedCode) {
      return;
    }

    setCode(
      generatedCode
    );

    setStdin("");
    setOutput("");
    setDetectedLanguage("");
    setDetectedStyle("");
    setPage("lab");
  }

  // ==========================================================
  // EXECUTION OUTPUT
  // ==========================================================

  function setRealExecutionOutput(
    data
  ) {
    const parts = [];

    if (
      data.stdout &&
      data.stdout.trimEnd()
    ) {
      parts.push(
        data.stdout.trimEnd()
      );
    }

    if (
      data.stderr &&
      data.stderr.trimEnd()
    ) {
      parts.push(
        data.stderr.trimEnd()
      );
    }

    if (
      data.compileOutput &&
      data.compileOutput.trimEnd()
    ) {
      parts.push(
        data.compileOutput.trimEnd()
      );
    }

    if (
      data.message &&
      data.message.trimEnd()
    ) {
      parts.push(
        data.message.trimEnd()
      );
    }

    setOutput(
      parts.join("\n")
    );
  }

  // ==========================================================
  // CODE LAB RUN
  // ==========================================================

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
      const response =
        await fetch(
          `${API}/api/code/run`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              code,
              stdin,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Code execution failed."
        );
      }

      setDetectedLanguage(
        data.language ||
          ""
      );

      setDetectedStyle(
        data.codeStyle ||
          ""
      );

      setRealExecutionOutput(
        data
      );
    } catch (error) {
      setOutput(
        `Execution error:\n${error.message}`
      );
    } finally {
      setRunning(false);
    }
  }

  // ==========================================================
  // CLEAR CODE LAB
  // ==========================================================

  function clearLab() {
    setCode("");
    setStdin("");
    setOutput("");
    setDetectedLanguage("");
    setDetectedStyle("");
  }

  // ==========================================================
  // ALGORITHM GENERATOR
  // ==========================================================

  async function generateAlgorithm() {
    const topic =
      algorithmTopic.trim();

    if (!topic) {
      setGeneratedAlgorithm(
        "Enter an algorithm problem first."
      );

      return;
    }

    setAlgorithmGenerating(true);
    setGeneratedAlgorithm("");
    setCopiedAlgorithm(false);

    try {
      const response =
        await fetch(
          `${API}/api/ai/generate-algorithm`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              topic,
              level:
                algorithmLevel,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
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
      setAlgorithmGenerating(false);
    }
  }

  // ==========================================================
  // COPY ALGORITHM
  // ==========================================================

  async function copyAlgorithm(
    text
  ) {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopiedAlgorithm(true);

      setTimeout(() => {
        setCopiedAlgorithm(false);
      }, 1400);
    } catch {
      setCopiedAlgorithm(false);
    }
  }

  // ==========================================================
  // PROGRAMMING PRACTICE
  // ==========================================================

  async function generatePractice() {
    const topic =
      practiceQuestion.trim();

    if (!topic) {
      setPracticeAnswer(
        "Enter a practice topic first."
      );

      return;
    }

    setPracticeBusy(true);
    setPracticeAnswer("");

    try {
      const response =
        await fetch(
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

              question: `
Create a programming practice problem.

Topic:
${topic}

Include:

- Problem statement
- Example input
- Expected output
- Constraints
- Small hint

Do not claim execution.
`,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Practice generation failed."
        );
      }

      setPracticeAnswer(
        data.answer || ""
      );
    } catch (error) {
      setPracticeAnswer(
        `Error: ${error.message}`
      );
    } finally {
      setPracticeBusy(false);
    }
  }

  // ==========================================================
  // ALGORITHM PRACTICE
  // ==========================================================

  async function evaluateAlgorithmPractice() {
    if (
      !algorithmPracticeTopic.trim()
    ) {
      setAlgorithmPracticeAnswer(
        "Enter an algorithm topic first."
      );

      return;
    }

    setAlgorithmPracticeBusy(true);

    setAlgorithmPracticeAnswer("");

    try {
      const response =
        await fetch(
          `${API}/api/ai/algorithm-practice`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              level:
                algorithmLevel,

              topic:
                algorithmPracticeTopic,

              studentAnswer:
                algorithmStudentAnswer,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Algorithm evaluation failed."
        );
      }

      setAlgorithmPracticeAnswer(
        data.answer || ""
      );
    } catch (error) {
      setAlgorithmPracticeAnswer(
        `Error: ${error.message}`
      );
    } finally {
      setAlgorithmPracticeBusy(
        false
      );
    }
  }

  // ==========================================================
  // RENDER PAGE
  // ==========================================================

  function renderPage() {
    if (page === "learn") {
      return (
        <LearnPage
          setLanguage={
            setLanguage
          }
          setCode={setCode}
          setPage={setPage}
          algorithmLevel={
            algorithmLevel
          }
          setAlgorithmLevel={
            setAlgorithmLevel
          }
          algorithmQuestion={
            algorithmQuestion
          }
          setAlgorithmQuestion={
            setAlgorithmQuestion
          }
          algorithmAnswer={
            algorithmAnswer
          }
          algorithmBusy={
            algorithmBusy
          }
          askAlgorithmTeacher={
            askAlgorithmTeacher
          }
        />
      );
    }

    if (page === "teacher") {
      return (
        <TeacherPage
          language={language}
          setLanguage={
            (newLanguage) =>
              changeLanguage(
                newLanguage,
                false
              )
          }
          level={level}
          setLevel={setLevel}
          question={question}
          setQuestion={
            setQuestion
          }
          answer={answer}
          busy={busy}
          askTeacher={
            askTeacher
          }
        />
      );
    }

    if (page === "generator") {
      return (
        <GeneratorPage
          language={language}
          setLanguage={
            (newLanguage) =>
              changeLanguage(
                newLanguage,
                false
              )
          }
          level={level}
          setLevel={setLevel}
          codeStyle={codeStyle}
          setCodeStyle={
            setCodeStyle
          }
          codeTopic={codeTopic}
          setCodeTopic={
            setCodeTopic
          }
          generatedCode={
            generatedCode
          }
          generatorBusy={
            generatorBusy
          }
          generateCode={
            generateCode
          }
          copiedCode={
            copiedCode
          }
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
          code={code}
          setCode={setCode}
          stdin={stdin}
          setStdin={setStdin}
          output={output}
          running={running}
          runCode={runCode}
          detectedLanguage={
            detectedLanguage
          }
          detectedStyle={
            detectedStyle
          }
          clearLab={clearLab}
        />
      );
    }

    if (page === "practice") {
      return (
        <PracticePage
          page={page}
          setPage={setPage}
          language={language}
          level={level}
          practiceQuestion={
            practiceQuestion
          }
          setPracticeQuestion={
            setPracticeQuestion
          }
          practiceAnswer={
            practiceAnswer
          }
          practiceBusy={
            practiceBusy
          }
          generatePractice={
            generatePractice
          }
          algorithmLevel={
            algorithmLevel
          }
          setAlgorithmLevel={
            setAlgorithmLevel
          }
          algorithmPracticeTopic={
            algorithmPracticeTopic
          }
          setAlgorithmPracticeTopic={
            setAlgorithmPracticeTopic
          }
          algorithmStudentAnswer={
            algorithmStudentAnswer
          }
          setAlgorithmStudentAnswer={
            setAlgorithmStudentAnswer
          }
          algorithmPracticeAnswer={
            algorithmPracticeAnswer
          }
          algorithmPracticeBusy={
            algorithmPracticeBusy
          }
          evaluateAlgorithmPractice={
            evaluateAlgorithmPractice
          }
        />
      );
    }

    if (
      page ===
      "algorithm-generator"
    ) {
      return (
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
          copiedAlgorithm={
            copiedAlgorithm
          }
          copyAlgorithm={
            copyAlgorithm
          }
        />
      );
    }

    return (
      <HomePage
        setPage={setPage}
      />
    );
  }

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigation = [
    ["home", "Home"],
    ["learn", "Learn"],
    ["teacher", "AI Teacher"],
    ["generator", "Code Generator"],
    ["lab", "Code Lab"],
    ["practice", "Practice"],
    [
      "algorithm-generator",
      "Algorithm Generator",
    ],
  ];

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
            <strong>
              CodeMentor
            </strong>

            <small>
              AI
            </small>
          </span>
        </button>

        <nav className="nav-links">
          {navigation.map(
            ([id, label]) => (
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
            )
          )}
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

      <Footer
        setPage={setPage}
      />
    </div>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);