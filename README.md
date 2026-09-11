# CodeMentor AI

A real AI programming teacher + real code execution starter.

## Features
- AI teacher for C, C++, Python, Java and JavaScript
- Deep explanations in easy language
- Explain/debug/review code
- Monaco code editor
- Real code execution through Judge0
- Real stdout/stderr/compile output
- Futuristic responsive UI

## Setup

1. Install Node.js 18+.
2. Copy `.env.example` to `.env`.
3. Add your OpenAI API key.
4. Configure a Judge0 CE instance/service in `JUDGE0_URL` and, if required, `JUDGE0_API_KEY`.
5. Run:

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Important security note
Never expose OPENAI_API_KEY or JUDGE0 credentials to the browser. They are used only by the Express server.

Judge0 provides sandboxed compilation/execution and runtime limits. The server also enforces input/code-size limits.
