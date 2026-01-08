from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import date

class AnimalMetadata(BaseModel):
    tag_uid: str         # "ea221ffdb4fbea42" (From Nooploop `uid`)
    name: str            # "Bessie"
    species: str         # "Cow"
    color_hex: str       # "#FF5733"
    
    # Thresholds
    threshold_rest_max_hours: float = 10.0
    threshold_activity_min_meters: float = 500.0

class HealthStatus(BaseModel):
    tag_uid: str
    display_name: str
    last_seen_ts: float  # Unix timestamp
    status: Literal["OK", "WARNING", "CRITICAL"]
    signal_quality_rssi: float 
    
    metrics_24h: dict = {
        "total_distance_km": 0.0,
        "avg_velocity": 0.0,
    }

class SessionData(BaseModel):
    session_id: str
    date: date
    tag_uid: str
    
    # Compact Structure: 
    # [Timestamp, X, Y, Z, V_x, V_y, V_z, RSSI]
    track_points: List[List[float]] = []
