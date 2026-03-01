from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai, tasks, child, supervisor

app = FastAPI(
    title="Social Skills Platform API",
    version="0.1.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router)
app.include_router(tasks.router)
app.include_router(child.router)
app.include_router(supervisor.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
