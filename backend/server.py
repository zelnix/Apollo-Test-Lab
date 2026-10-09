"""Apollo Threat Lab backend.

The app's test functionality runs entirely on-device (config, execution and
history are local). This FastAPI service provides a lightweight, health/status
layer backed by the Emergent-managed MongoDB so the deployment has a supported,
reachable backend contract. All config comes from environment variables.
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    client.close()


app = FastAPI(title="Apollo Threat Lab Backend", lifespan=lifespan)

api_router = APIRouter(prefix="/api")


class HealthResponse(BaseModel):
    status: str
    service: str
    database: str
    time: str


@api_router.get("/")
async def root():
    return {
        "app": "Apollo Threat Lab",
        "message": "On-device security testing app; this backend exposes health/status only.",
    }


@api_router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    database = "connected"
    try:
        await db.command("ping")
    except Exception:
        database = "unavailable"
    return HealthResponse(
        status="ok",
        service="apollo-threat-lab",
        database=database,
        time=datetime.now(timezone.utc).isoformat(),
    )


app.include_router(api_router)


# Platform health probe hits the un-prefixed /health path; keep a fast,
# dependency-free 200 here in addition to the /api/health endpoint above.
@app.get("/health")
async def platform_health():
    return {"status": "ok", "service": "apollo-threat-lab"}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
