"""LangGraph pipelines.

prepare graph:  [analyze_inputs] -> plan_questions -> build_prompt
report graph:   score_interview
Both LLM nodes use structured output and degrade to a deterministic fallback
so the demo never dies on a text-model hiccup.
"""
from typing import Optional, TypedDict

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, START, StateGraph

from .config import settings
from .prompts import build_interview_prompt
from .schemas import (CandidateProfile, InterviewPlan, InterviewQuestion,
                      Report, TranscriptTurn)


def _llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=settings.text_model, google_api_key=settings.gemini_api_key, temperature=0.4
    )


def _llm_ready() -> bool:
    return bool(settings.gemini_api_key and settings.text_model)


# ---------------------------------------------------------------- prepare graph
class PrepState(TypedDict, total=False):
    profile: CandidateProfile
    analysis: str
    plan: InterviewPlan
    system_prompt: str


DEFAULT_MINUTES = 15


def minutes_for(p: CandidateProfile) -> int:
    return p.durationMinutes or DEFAULT_MINUTES


def question_count(minutes: int) -> int:
    """Roughly three minutes per question (answer plus follow-up), between 3 and 12."""
    return max(3, min(12, round(minutes / 3)))


def _has_docs(s: PrepState) -> bool:
    p = s["profile"]
    return bool(p.jobDescription or p.resumeText)


def analyze_inputs(s: PrepState) -> PrepState:
    p = s["profile"]
    if not _llm_ready():
        return {"analysis": ""}
    msg = (
        f"Role: {p.targetRole}{f' at {p.company}' if p.company else ''}.\n\nJOB DESCRIPTION:\n{p.jobDescription or 'n/a'}\n\n"
        f"RESUME:\n{p.resumeText or 'n/a'}\n\n"
        "Briefly list: the top requirements, the candidate's matching strengths, and the gaps."
    )
    return {"analysis": _llm().invoke(msg).text}


def _exp(p: CandidateProfile) -> str:
    if p.experienceYears is None and not p.experienceType:
        return "experience level unknown. "
    yrs = f"{p.experienceYears:g} years " if p.experienceYears is not None else ""
    kind = f"({p.experienceType})" if p.experienceType else ""
    return f"candidate has {yrs}{kind}. "


def plan_questions(s: PrepState) -> PrepState:
    p = s["profile"]
    n = question_count(minutes_for(p))
    if _llm_ready():
        try:
            plan = _llm().with_structured_output(InterviewPlan).invoke(
                f"Create a {p.interviewType} mock interview plan with exactly {n} questions for a "
                f"{p.targetRole}{f' at {p.company}' if p.company else ''}; {_exp(p)}"
                f"Tailor to this analysis:\n{s.get('analysis') or 'No documents provided.'}"
            )
            if plan and plan.questions:
                plan.questions = plan.questions[:n]
                return {"plan": plan}
        except Exception:
            pass
    return {"plan": _fallback_plan(p)}


def _fallback_plan(p: CandidateProfile) -> InterviewPlan:
    generic = {
        "technical": ["Walk me through a technically challenging problem you solved recently.",
                      "How do you debug a production issue you can't reproduce locally?",
                      "Explain a trade-off you made between performance and maintainability."],
        "behavioral": ["Tell me about a time you disagreed with a teammate.",
                       "Describe a project that failed and what you learned.",
                       "Tell me about a tight deadline and how you handled it."],
        "system_design": ["Design a URL shortener. Where are the bottlenecks?",
                          "How would you design a notification service at scale?",
                          "How would you make a read-heavy API faster?"],
    }
    kinds = ["technical", "behavioral", "system_design"] if p.interviewType == "mixed" else [p.interviewType]
    pool = [(k, generic[k][i]) for i in range(3) for k in kinds]  # round-robin across kinds
    qs = [InterviewQuestion(question=q, focus=k, follow_up="Can you give a concrete example?")
          for k, q in pool][: question_count(minutes_for(p))]
    return InterviewPlan(key_requirements=[], candidate_strengths=[], gaps_to_probe=[], questions=qs)


def build_prompt(s: PrepState) -> PrepState:
    return {"system_prompt": build_interview_prompt(s["profile"], s["plan"], minutes_for(s["profile"]))}


_prep = StateGraph(PrepState)
_prep.add_node("analyze_inputs", analyze_inputs)
_prep.add_node("plan_questions", plan_questions)
_prep.add_node("build_prompt", build_prompt)
_prep.add_conditional_edges(START, lambda s: "analyze_inputs" if _has_docs(s) else "plan_questions")
_prep.add_edge("analyze_inputs", "plan_questions")
_prep.add_edge("plan_questions", "build_prompt")
_prep.add_edge("build_prompt", END)
prepare_graph = _prep.compile()


def prepare_interview(profile: CandidateProfile) -> tuple[InterviewPlan, str]:
    out = prepare_graph.invoke({"profile": profile})
    return out["plan"], out["system_prompt"]


# ----------------------------------------------------------------- report graph
class ReportState(TypedDict, total=False):
    profile: CandidateProfile
    transcript: list[TranscriptTurn]
    report: Report


def score_interview(s: ReportState) -> ReportState:
    p = s["profile"]
    convo = "\n".join(f"{t.role.upper()}: {t.text}" for t in s["transcript"])
    report: Optional[Report] = None
    if _llm_ready() and convo.strip():
        report = _llm().with_structured_output(Report).invoke(
            f"You are an interview coach. Evaluate this mock {p.interviewType} interview for "
            f"{p.targetRole}{f' at {p.company}' if p.company else ''}. Be specific and constructive; score 1-10. "
            f"Also recommend 3 to 5 learning resources (articles, courses, videos, practice sets) that target "
            f"the weaknesses you saw, each with a precise web search query.\n\n{convo}"
        )
    if report is None:
        report = Report(overall_score=5, summary="Report unavailable (no transcript or text model).",
                        strengths=[], improvements=[], question_feedback=[], next_steps=[], resources=[])
    return {"report": report}


_rep = StateGraph(ReportState)
_rep.add_node("score_interview", score_interview)
_rep.add_edge(START, "score_interview")
_rep.add_edge("score_interview", END)
report_graph = _rep.compile()


def make_report(profile: CandidateProfile, transcript: list[TranscriptTurn]) -> Report:
    return report_graph.invoke({"profile": profile, "transcript": transcript})["report"]
