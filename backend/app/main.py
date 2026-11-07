from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .graphs import make_report, minutes_for, prepare_interview
from .live_tokens import create_live_token
from .prompts import INTAKE_PROMPT, INTAKE_TOOLS, INTERVIEW_TOOLS
from .schemas import (CandidateProfile, Report, ReportRequest,
                      StartInterviewResponse, TokenResponse)

app = FastAPI(title="Mock Interview Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",")],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True, "live_model": bool(settings.live_model), "text_model": bool(settings.text_model)}


def _token(**kw) -> TokenResponse:
    try:
        return create_live_token(**kw)
    except RuntimeError as e:
        raise HTTPException(500, str(e))


@app.post("/api/live-token", response_model=TokenResponse)
async def live_token(backup: bool = False):
    """Intake-phase token (Ava). Prompt and tools are locked into the token."""
    return await run_in_threadpool(_token, system_prompt=INTAKE_PROMPT, tools=INTAKE_TOOLS, backup=backup, silence_ms=800)


@app.post("/api/interview/start", response_model=StartInterviewResponse)
async def start_interview(profile: CandidateProfile, backup: bool = False):
    """Handoff: LangGraph builds the plan + prompt, then mint a token locked to it."""
    plan, prompt = await run_in_threadpool(prepare_interview, profile)
    tok = await run_in_threadpool(_token, system_prompt=prompt, tools=INTERVIEW_TOOLS, backup=backup, silence_ms=1200)
    return StartInterviewResponse(**tok.model_dump(), plan=plan, durationMinutes=minutes_for(profile))


@app.post("/api/report", response_model=Report)
async def report(req: ReportRequest):
    return await run_in_threadpool(make_report, req.profile, req.transcript)
