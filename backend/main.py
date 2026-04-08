"""
main.py — FastAPI backend for Orbital Command dashboard.

Endpoints (all return JSON consumed by js/api.js):
  GET /trips        → trip JOIN vehicle JOIN carrier JOIN route JOIN location_node
  GET /vehicles     → vehicle JOIN carrier
  GET /delays       → delay_event JOIN location_node JOIN trip
  GET /congestion   → congestion_record JOIN traffic_segment
  GET /bottlenecks  → bottleneck_report JOIN traffic_segment
  GET /positions    → position_log

Run:
  uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from database import get_db
from models import (
    Trip, Vehicle, Carrier, Route, LocationNode,
    TrafficSegment, CongestionRecord, DelayEvent,
    BottleneckReport, PositionLog
)
from schemas import (
    TripOut, VehicleOut, DelayOut, CongestionOut,
    BottleneckOut, PositionOut
)

app = FastAPI(
    title="Orbital Command API",
    description="Global Mobility Intelligence — globalmobility PostgreSQL backend",
    version="1.0.0"
)

# ── CORS — allow the frontend (any localhost origin) ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
def root():
    return {"status": "operational", "service": "Orbital Command API"}


# ── GET /trips ────────────────────────────────────────────────────────────────
@app.get("/trips", response_model=List[TripOut], tags=["trips"])
def get_trips(
    status: Optional[str] = Query(None, description="Filter by trip_status"),
    limit:  int           = Query(50,   ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Returns trips enriched with vehicle → carrier and
    route → origin_node / destination_node.
    Ordered by scheduled_departure DESC (most recent first).
    """
    q = (
        db.query(Trip)
        .options(
            joinedload(Trip.vehicle).joinedload(Vehicle.carrier),
            joinedload(Trip.route)
                .joinedload(Route.origin_node),
            joinedload(Trip.route)
                .joinedload(Route.destination_node),
        )
        .order_by(Trip.scheduled_departure.desc())
    )
    if status:
        q = q.filter(Trip.trip_status == status.upper())
    return q.limit(limit).all()


# ── GET /vehicles ─────────────────────────────────────────────────────────────
@app.get("/vehicles", response_model=List[VehicleOut], tags=["vehicles"])
def get_vehicles(
    vehicle_type: Optional[str] = Query(None, description="AIRCRAFT | TRAIN | SHIP"),
    db: Session = Depends(get_db)
):
    """
    Returns all vehicles with their carrier.
    Optionally filtered by vehicle_type.
    """
    q = (
        db.query(Vehicle)
        .options(joinedload(Vehicle.carrier))
        .order_by(Vehicle.vehicle_id)
    )
    if vehicle_type:
        q = q.filter(Vehicle.vehicle_type == vehicle_type.upper())
    return q.all()


# ── GET /delays ───────────────────────────────────────────────────────────────
@app.get("/delays", response_model=List[DelayOut], tags=["delays"])
def get_delays(
    reason: Optional[str] = Query(None, description="WEATHER | TRAFFIC | MAINTENANCE | CONTROL | UNKNOWN"),
    limit:  int           = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Returns delay events enriched with location_node and trip status.
    Ordered by event_time DESC.
    """
    q = (
        db.query(DelayEvent)
        .options(
            joinedload(DelayEvent.node),
            joinedload(DelayEvent.trip),
        )
        .order_by(DelayEvent.event_time.desc())
    )
    if reason:
        q = q.filter(DelayEvent.delay_reason == reason.upper())
    return q.limit(limit).all()


# ── GET /congestion ───────────────────────────────────────────────────────────
@app.get("/congestion", response_model=List[CongestionOut], tags=["congestion"])
def get_congestion(
    min_level: Optional[int] = Query(None, ge=0, le=100, description="Min congestion_level"),
    limit:     int           = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Returns congestion records enriched with traffic_segment.
    Ordered by timestamp DESC (most recent first).
    """
    q = (
        db.query(CongestionRecord)
        .options(joinedload(CongestionRecord.segment))
        .order_by(CongestionRecord.timestamp.desc())
    )
    if min_level is not None:
        q = q.filter(CongestionRecord.congestion_level >= min_level)
    return q.limit(limit).all()


# ── GET /bottlenecks ──────────────────────────────────────────────────────────
@app.get("/bottlenecks", response_model=List[BottleneckOut], tags=["bottlenecks"])
def get_bottlenecks(
    min_severity: Optional[float] = Query(None, description="Min severity_score"),
    db: Session = Depends(get_db)
):
    """
    Returns all bottleneck reports enriched with traffic_segment.
    Ordered by severity_score DESC.
    """
    q = (
        db.query(BottleneckReport)
        .options(joinedload(BottleneckReport.segment))
        .order_by(BottleneckReport.severity_score.desc())
    )
    if min_severity is not None:
        q = q.filter(BottleneckReport.severity_score >= min_severity)
    return q.all()


# ── GET /positions ────────────────────────────────────────────────────────────
@app.get("/positions", response_model=List[PositionOut], tags=["positions"])
def get_positions(
    trip_id: Optional[int] = Query(None, description="Filter by trip_id"),
    limit:   int           = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Returns position logs ordered by timestamp DESC.
    Optionally filtered to a single trip.
    """
    q = (
        db.query(PositionLog)
        .order_by(PositionLog.timestamp.desc())
    )
    if trip_id is not None:
        q = q.filter(PositionLog.trip_id == trip_id)
    return q.limit(limit).all()
