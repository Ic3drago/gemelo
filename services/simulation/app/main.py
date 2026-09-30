from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import math
from pydantic import BaseModel, Field, model_validator
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
    householdId: str = "hogar_001"
    horizonMonths: int = Field(default=6, alias="months", ge=1, le=24)
    wasteReductionPct: float = Field(default=0, alias="waste", ge=0, le=100)
    energyReductionPct: float = Field(default=0, alias="energy", ge=0, le=100)
    purchaseChangePct: float = Field(default=0, alias="purchases")

    model_config = {"populate_by_name": True, "extra": "ignore"}

    @model_validator(mode="before")
    @classmethod
    def validate_purchase_change(cls, values):
        if not isinstance(values, dict):
            return values
        field = "purchases" if "purchases" in values else "purchaseChangePct"
        if field not in values:
            return values
        try:
            change = float(values[field])
        except (TypeError, ValueError) as error:
            raise ValueError("purchases debe ser un porcentaje numérico.") from error
        minimum = 0 if field == "purchases" else -100
        if not math.isfinite(change) or change < minimum or change > 100:
            raise ValueError(f"{field} debe estar entre {minimum} y 100.")
        return values

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
