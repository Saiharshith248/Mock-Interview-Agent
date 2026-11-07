from typing import Literal, Optional

from pydantic import BaseModel, Field

InterviewType = Literal["technical", "behavioral", "system_design", "mixed"]


class CandidateProfile(BaseModel):
    """Mirrors lib/types.ts CandidateProfile (camelCase on the wire). Required: targetRole, jobDescription."""

    targetRole: str = Field(min_length=1)
    jobDescription: str = Field(min_length=1, max_length=30_000)
    # Everything below is optional; interviewType defaults to "mixed".
    company: Optional[str] = None
    interviewType: InterviewType = "mixed"
    experienceYears: Optional[float] = Field(default=None, ge=0, le=60)
    experienceType: Optional[str] = None
    durationMinutes: Optional[int] = Field(default=None, ge=5, le=60)  # default 15
    resumeText: Optional[str] = Field(default=None, max_length=30_000)


class TokenResponse(BaseModel):
    token: str
    model: str
    expiresAt: str


class InterviewQuestion(BaseModel):
    question: str
    focus: str = Field(description="Skill or topic this probes")
    follow_up: str = Field(description="One follow-up if the answer is shallow")


class InterviewPlan(BaseModel):
    key_requirements: list[str] = Field(description="Top skills the JD demands")
    candidate_strengths: list[str]
    gaps_to_probe: list[str]
    questions: list[InterviewQuestion]


class StartInterviewResponse(TokenResponse):
    plan: InterviewPlan
    durationMinutes: int


class TranscriptTurn(BaseModel):
    role: Literal["user", "ava", "interviewer"]
    text: str


class ReportRequest(BaseModel):
    profile: CandidateProfile
    transcript: list[TranscriptTurn]


class Resource(BaseModel):
    title: str = Field(description="Specific topic or resource to study, e.g. 'SQL window functions tutorial'")
    kind: Literal["article", "course", "video", "practice", "book"]
    why: str = Field(description="One sentence on how it fixes a weakness seen in the interview")
    search_query: str = Field(description="Web search query that finds this resource")


class Report(BaseModel):
    overall_score: int = Field(ge=1, le=10)
    summary: str
    strengths: list[str]
    improvements: list[str]
    question_feedback: list[str] = Field(description="Short feedback per question asked")
    next_steps: list[str]
    resources: list[Resource] = Field(
        default_factory=list, description="3 to 5 learning resources targeted at the weaknesses"
    )
