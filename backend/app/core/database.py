from sqlalchemy import create_engine, Column, Integer, String, Float, BigInteger, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base
import time
import math

DATABASE_URL = "sqlite:///./app_data.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TagHistory(Base):
    __tablename__ = "tag_history"
    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String, index=True)
    device_name = Column(String)
    x = Column(Float)
    y = Column(Float)
    z = Column(Float)
    timestamp = Column(BigInteger, index=True)

class TagState(Base):
    __tablename__ = "tag_state"
    uid = Column(String, primary_key=True, index=True)
    device_name = Column(String)
    x = Column(Float)
    y = Column(Float)
    z = Column(Float)
    last_seen = Column(BigInteger)
    is_online = Column(Boolean, default=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def record_position(uid: str, device_name: str, x: float, y: float, z: float, timestamp: int):
    session = SessionLocal()
    try:
        # 1. Insert History
        history = TagHistory(uid=uid, device_name=device_name, x=x, y=y, z=z, timestamp=timestamp)
        session.add(history)
        
        # 2. Update/Insert State
        state = session.query(TagState).filter(TagState.uid == uid).first()
        if not state:
            state = TagState(uid=uid, device_name=device_name, x=x, y=y, z=z, last_seen=timestamp, is_online=True)
            session.add(state)
        else:
            state.x = x
            state.y = y
            state.z = z
            if device_name: state.device_name = device_name
            state.last_seen = timestamp
            state.is_online = True
            
        session.commit()
    except Exception as e:
        print(f"DB Error: {e}")
    finally:
        session.close()

def check_hibernation(timeout_seconds: float = 3.0):
    session = SessionLocal()
    try:
        # Current time in ms
        now_ms = int(time.time() * 1000)
        cutoff = now_ms - int(timeout_seconds * 1000)
        
        # Find tags that are online but haven't been seen since cutoff
        tags = session.query(TagState).filter(TagState.is_online == True, TagState.last_seen < cutoff).all()
        for tag in tags:
            tag.is_online = False
        
        if tags:
            session.commit()
    finally:
        session.close()

def get_all_tags():
    session = SessionLocal()
    try:
        tags = session.query(TagState).all()
        return [
            {
                "uid": t.uid, 
                "deviceName": t.device_name, 
                "pos": [t.x, t.y, t.z], 
                "online": t.is_online,
                "lastSeen": t.last_seen
            } 
            for t in tags
        ]
    finally:
        session.close()

def get_history_range(start_ms: int, end_ms: int):
    session = SessionLocal()
    try:
        logs = session.query(TagHistory).filter(TagHistory.timestamp >= start_ms, TagHistory.timestamp <= end_ms).order_by(TagHistory.timestamp.asc()).all()
        return [
            {
                "uid": l.uid,
                "deviceName": l.device_name,
                "pos": [l.x, l.y, l.z],
                "time": l.timestamp
            }
            for l in logs
        ]
    finally:
        session.close()

def calculate_stats(start_ms: int, end_ms: int):
    """
    Calculate movement stats for all tags within the timeframe.
    Returns: { uid: { deviceName, totalDistance, movingTimeSeconds, avgSpeed } }
    """
    session = SessionLocal()
    try:
        # Fetch ordered logs
        logs = session.query(TagHistory)\
            .filter(TagHistory.timestamp >= start_ms, TagHistory.timestamp <= end_ms)\
            .order_by(TagHistory.uid, TagHistory.timestamp.asc())\
            .all()

        stats = {}
        
        # Group by UID
        logs_by_uid = {}
        for log in logs:
            if log.uid not in logs_by_uid:
                logs_by_uid[log.uid] = []
            logs_by_uid[log.uid].append(log)

        for uid, user_logs in logs_by_uid.items():
            total_dist = 0.0
            moving_time_ms = 0
            
            if not user_logs:
                continue
                
            device_name = user_logs[0].device_name
            
            # Iterate points to calculate distance and simple movement check
            for i in range(1, len(user_logs)):
                prev = user_logs[i-1]
                curr = user_logs[i]
                
                # Distance 2D
                dx = curr.x - prev.x
                dy = curr.y - prev.y
                dist = math.sqrt(dx*dx + dy*dy)
                
                time_diff = curr.timestamp - prev.timestamp
                
                # Filter crazy jumps or very long gaps (e.g. tag turned off)
                if time_diff > 5000: # 5 second gap means disconnected
                    continue

                if time_diff <= 0:
                    continue

                speed = dist / (time_diff / 1000.0) # m/s
                
                # Threshold for "moving": e.g. > 0.1 m/s to ignore noise
                if speed > 0.05: # 5 cm/s threshold
                    total_dist += dist
                    moving_time_ms += time_diff

            stats[uid] = {
                "deviceName": device_name,
                "totalDistance": round(total_dist, 2),
                "movingTimeMinutes": round(moving_time_ms / 1000.0 / 60.0, 2)
            }
            
        return stats

    finally:
        session.close()
