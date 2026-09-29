from sqlalchemy import Column, Integer, String, Float
from .database import Base

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(String, index=True)
    category = Column(String, index=True)
    month = Column(String, index=True)
    actual = Column(Float, nullable=True)
    predicted = Column(Float)
    error = Column(Float, nullable=True)
