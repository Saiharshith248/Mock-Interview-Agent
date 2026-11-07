"""Ephemeral, single-use Gemini Live tokens. The real API key never leaves the server."""
from datetime import datetime, timedelta, timezone

from google import genai

from .config import settings
from .schemas import TokenResponse


def _client() -> genai.Client:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    return genai.Client(
        api_key=settings.gemini_api_key,
        http_options={"api_version": "v1alpha"},  # ephemeral tokens need v1alpha
    )


def create_live_token(
    *, system_prompt: str, tools: list[dict], backup: bool = False, silence_ms: int = 1200
) -> TokenResponse:
    model = (settings.live_model_backup if backup else settings.live_model)
    if not model:
        raise RuntimeError("LIVE_MODEL is not set")
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=settings.token_ttl_minutes)
    # Config is locked into the token: the browser cannot swap the system prompt/tools.
    client = _client()  # keep a reference: a temporary client is closed on GC mid-request
    token = client.auth_tokens.create(
        config={
            "uses": 1,
            "expire_time": expires,
            "new_session_expire_time": now + timedelta(minutes=settings.new_session_window_minutes),
            "live_connect_constraints": {
                "model": model,
                "config": {
                    "response_modalities": ["AUDIO"],
                    "system_instruction": system_prompt,
                    "tools": tools,
                    # How long the candidate must be quiet before the model treats the turn as
                    # finished and answers. Longer = tolerates thinking pauses, but replies later.
                    "realtime_input_config": {
                        "automatic_activity_detection": {
                            "silence_duration_ms": silence_ms,
                            "end_of_speech_sensitivity": "END_SENSITIVITY_HIGH",
                        }
                    },
                    "input_audio_transcription": {},
                    "output_audio_transcription": {},
                    # Longer interview phase: see Live docs for resumption/compression.
                    "context_window_compression": {"sliding_window": {}},
                },
            },
        }
    )
    return TokenResponse(token=token.name, model=model, expiresAt=expires.isoformat())
