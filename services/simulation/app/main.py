from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .simulation import SimulationEngine
from . import models, database
from .database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Simulation Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    householdId: str
    horizonMonths: int
    wasteReductionPct: float
    energyReductionPct: float
    purchaseChangePct: float

class PredictRequest(BaseModel):
    householdId: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "simulation-svc"}

@app.post("/simulate")
async def simulate(req: SimulationRequest, db: Session = Depends(database.get_db)):
    engine = SimulationEngine(db)
    return await engine.run(req)

@app.get("/predict")
async def predict(householdId: str, db: Session = Depends(database.get_db)):
    engine = SimulationEngine(db)
    return await engine.predict(householdId)

@app.post("/retrain")
async def retrain(req: PredictRequest, db: Session = Depends(database.get_db)):
    engine = SimulationEngine(db)
    return await engine.retrain(req.householdId)
