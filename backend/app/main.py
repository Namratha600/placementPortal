from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# --- add near your other model imports so create_all sees the table ---
from app.models import company  # noqa: F401
from app.models import placement_record  # noqa: F401
from app.models import blog  # noqa: F401
# --- add near your other router imports ---
from app.routers import companies
from app.routers import placement_records
from app.routers import blogs
from app.routers import password_reset
from app.models import notification  # noqa: F401
from app.routers import notifications
from app.routers import admin_tasks

# --- add near your other app.include_router(...) calls ---


from app.routers import auth_student, auth_admin, admin_management, opportunities, students

app = FastAPI(
    title="Campus Placement Portal API",
    description="Authentication service for the Campus Placement Portal",
    version="0.1.0",
)


# Allows the React dev server (different origin: localhost:5173 vs
# localhost:8000) to call this API from the browser. Without this,
# every request would be blocked by the browser's CORS policy before
# it even reaches our routes.
app.add_middleware(
    CORSMiddleware,
    # Both localhost (for testing on this same machine) and the LAN IP
    # (for testing from a phone/other device on the same WiFi) need to
    # be allowed — the browser sends whichever origin it's actually
    # running from, and it must exactly match one of these.
    allow_origins=["http://localhost:5173", "http://192.168.1.5:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Each router owns one feature area's endpoints. As we build
# protected routes, they'll be included here the same way.
app.include_router(auth_student.router)
app.include_router(auth_admin.router)
app.include_router(admin_management.router)
app.include_router(opportunities.router)
app.include_router(students.router)
app.include_router(companies.router)
app.include_router(placement_records.router)
app.include_router(blogs.router)
app.include_router(password_reset.router)
app.include_router(notifications.router)
app.include_router(admin_tasks.router)


@app.get("/health")
def health_check():
    """Simple endpoint to confirm the server is up and reachable."""
    return {"status": "ok"}