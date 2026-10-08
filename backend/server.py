"""Apollo Threat Lab is a fully standalone, on-device mobile app.

It uses NO backend: no authentication, no cloud database, no server-side state.
All configuration, test execution and history live locally on the Android
device.

This file remains only as a tiny health endpoint so the platform's backend
service stays green in the preview/deployment environment. It intentionally has
no database connection, models or business logic — the original FastAPI/MongoDB
starter scaffold has been removed because the app does not need it.
"""

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

app = FastAPI(title="Apollo Threat Lab (no-op backend)")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {
        "app": "Apollo Threat Lab",
        "backend": "none",
        "message": "Standalone on-device app; no backend is used.",
    }


@api_router.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
