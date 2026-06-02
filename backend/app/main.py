from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import products, customers, orders

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management System",
    description="Ethara AI Assessment – Full-Stack API",
    version="1.0.0"
)

# CORS — update origins with your Vercel URL before deploying
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # Vite dev server
        "http://localhost:3000",          # fallback
        "https://your-app.vercel.app",   # replace after deploy
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Inventory API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}