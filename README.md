# Mock Interview Agent

A voice-first mock interview app with a neon UI.

1. **Setup (intake):** you talk to **Ava**, a voice assistant, who collects your target role, plus a pasted job description (both required) and optionally company, interview type, duration, experience and resume.
2. **Interview:** Ava becomes your interviewer and asks a question plan tailored to your job description, sized to your chosen duration. Two animated characters stand on screen and animate when they talk. An optional self-camera preview helps you feel confident (it is never recorded or sent anywhere).
3. **Feedback:** End the interview to get a score, strengths, improvements and learning resources.

## How it works

```
Browser (Next.js)  ──mic/audio (WebSocket, short-lived token)──►  Gemini Live API
      │
      └── REST ──► Backend (FastAPI + LangGraph) ──► Gemini text model
                    • mints single-use Live tokens (your API key never reaches the browser)
                    • builds the interview plan and the final report
```

| Folder | What it is |
|---|---|
| `backend/` | FastAPI server: `/api/live-token`, `/api/interview/start`, `/api/report`, `/health` |
| `mock-interview-ui/` | Next.js (App Router) + TypeScript + Tailwind frontend |

## Prerequisites

- **Node.js 20.9+** and npm
- **Python 3.11+**
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)
- **Google Chrome** and **headphones** (otherwise the mic hears Ava and it interrupts itself)

## Run it, step by step

You need two terminals: one for the backend, one for the frontend.

### 1. Clone and enter the project

```bash
git clone <your-repo-url> mock-interview-agent
cd mock-interview-agent
```

### 2. Backend (terminal 1)

```bash
cd backend

# create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# install dependencies
pip install -r requirements.txt

# create your env file, then open it and paste your key into GEMINI_API_KEY
cp .env.example .env

# start the server on http://localhost:8000
python -m uvicorn app.main:app --reload --port 8000
```

Check it: open <http://localhost:8000/health>. You should see `{"ok":true,"live_model":true,"text_model":true}`.

### 3. Frontend (terminal 2)

```bash
cd mock-interview-ui

# install dependencies
npm install

# point the UI at the backend
cp .env.example .env.local

# start the app on http://localhost:3000
npm run dev
```

### 4. Use it

1. Open <http://localhost:3000> in **Chrome** and put on headphones.
2. Tap the **Ava** bot at the bottom and allow the microphone.
3. Say your target role, then paste the job description into the box on screen. Answer the rest by voice, or skip them.
4. Confirm Ava's recap. The interview room loads.
5. Click **Begin interview**. Click **End interview** when done, then **Feedback** for your score and resources, or **Exit** to start over.

## Configuration

`backend/.env`

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Your key. Stays on the server. |
| `LIVE_MODEL` | Voice model, default `gemini-3.8-live` |
| `LIVE_MODEL_BACKUP` | Fallback voice model, default `gemini-3.1-flash-live-preview` |
| `TEXT_MODEL` | Planning and report model, default `gemini-3.5-flash-lite` |
| `ALLOWED_ORIGINS` | Frontend origin(s) allowed by CORS |

`mock-interview-ui/.env.local`

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL, default `http://localhost:8000` |

Model IDs change often. If a model is rejected, copy the current ID from [Google AI Studio](https://aistudio.google.com).

## Useful commands

```bash
# backend tests (from backend/, venv active)
python -m pytest -q tests_smoke.py

# frontend checks (from mock-interview-ui/)
npx tsc --noEmit
npm run lint
npm run build
```

## Troubleshooting

- **`/api/live-token` says "GEMINI_API_KEY is not set"**: check `backend/.env`, make sure the file is saved, then restart the backend (it reads `.env` only at startup).
- **Ava doesn't connect or the mic is silent**: use Chrome, allow microphone access, and check the browser console. The Live API connects straight from the browser to Google, so a restrictive Wi-Fi network can block it. Try a phone hotspot.
- **Ava keeps interrupting itself**: use headphones.
- **"Cannot reach backend"**: confirm the backend is running on port 8000 and `NEXT_PUBLIC_BACKEND_URL` matches. Restart `npm run dev` after editing `.env.local`.

## Privacy notes

- Your API key is only read by the backend. The browser receives a short-lived, single-use token locked to the prompt and tools.
- The camera preview is local only: it is never recorded, uploaded, or sent to the model.
- On the free tier Google may use prompts to improve its products. Use a sample resume, not a real one.
