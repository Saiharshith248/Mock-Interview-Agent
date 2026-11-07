from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)
P = {"targetRole": "Backend Engineer", "company": "Stripe", "interviewType": "mixed",
     "experienceYears": 3, "experienceType": "full-time backend",
     "jobDescription": "Build payment APIs in Go."}

def test_health():
    assert c.get("/health").json()["ok"]

def test_prepare_fallback_no_docs(monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "gemini_api_key", "")
    from app.graphs import prepare_interview
    from app.schemas import CandidateProfile
    plan, prompt = prepare_interview(CandidateProfile(**P))
    assert len(plan.questions) == 5 and "Stripe" in prompt  # default 15 min -> 5 questions
    plan30, _ = prepare_interview(CandidateProfile(**P, durationMinutes=30))
    assert len(plan30.questions) == 9

def test_rejects_bad_profile():
    assert c.post("/api/interview/start", json={**P, "interviewType": "x"}).status_code == 422

def test_only_role_and_jd_required(monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "gemini_api_key", "")
    r = c.post("/api/interview/start", json={"targetRole": "Data Analyst"})
    assert r.status_code == 422  # job description missing
    from app.graphs import prepare_interview
    from app.schemas import CandidateProfile
    p = CandidateProfile(targetRole="Data Analyst", jobDescription="SQL, dashboards")
    plan, prompt = prepare_interview(p)
    assert p.interviewType == "mixed" and plan.questions and "Data Analyst" in prompt

def test_token_needs_key(monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "gemini_api_key", "")
    assert c.post("/api/live-token").status_code == 500
