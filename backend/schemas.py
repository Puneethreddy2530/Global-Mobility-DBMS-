"""schemas.py — Pydantic response models (match what api.js expects)."""

from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ── Shared config ─────────────────────────────────────────────────────────────
class _Base(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── Carrier ───────────────────────────────────────────────────────────────────
class CarrierOut(_Base):
    carrier_id:   int
    name:         str
    carrier_type: str
    country_code: str


# ── Location Node ─────────────────────────────────────────────────────────────
class LocationNodeOut(_Base):
    node_id:   int
    node_type: str
    name:      str
    country:   str
    latitude:  Decimal
    longitude: Decimal


# ── Traffic Segment ───────────────────────────────────────────────────────────
class TrafficSegmentOut(_Base):
    segment_id:   int
    segment_name: str
    segment_type: str
    region:       str


# ── Vehicle ───────────────────────────────────────────────────────────────────
class VehicleOut(_Base):
    vehicle_id:   int
    vehicle_type: str
    reg_number:   str
    model_name:   str
    carrier:      CarrierOut


# ── Route ─────────────────────────────────────────────────────────────────────
class RouteOut(_Base):
    route_id:        int
    route_type:      str
    distance_km:     Decimal
    origin_node:     Optional[LocationNodeOut]
    destination_node: Optional[LocationNodeOut]


# ── Trip ──────────────────────────────────────────────────────────────────────
class TripOut(_Base):
    trip_id:             int
    trip_status:         str
    scheduled_departure: datetime
    scheduled_arrival:   datetime
    actual_departure:    Optional[datetime]
    actual_arrival:      Optional[datetime]
    vehicle:             Optional[VehicleOut]
    route:               Optional[RouteOut]


# ── Congestion Record ─────────────────────────────────────────────────────────
class CongestionOut(_Base):
    congestion_id:    int
    timestamp:        datetime
    congestion_level: int
    avg_speed:        Decimal
    vehicle_count:    int
    segment:          Optional[TrafficSegmentOut]


# ── Delay Event ───────────────────────────────────────────────────────────────
class TripStatusOut(_Base):
    trip_id:    int
    trip_status: str


class DelayOut(_Base):
    delay_id:      int
    trip_id:       Optional[int]
    delay_minutes: int
    delay_reason:  str
    event_time:    datetime
    node:          Optional[LocationNodeOut]
    trip:          Optional[TripStatusOut]


# ── Bottleneck Report ─────────────────────────────────────────────────────────
class BottleneckOut(_Base):
    report_id:      int
    start_time:     datetime
    end_time:       datetime
    severity_score: Decimal
    segment:        Optional[TrafficSegmentOut]


# ── Position Log ──────────────────────────────────────────────────────────────
class PositionOut(_Base):
    pos_id:    int
    trip_id:   Optional[int]
    timestamp: datetime
    latitude:  Decimal
    longitude: Decimal
    altitude:  Optional[Decimal]
    speed:     Decimal

# ── Users ─────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: str

class UserOut(_Base):
    user_id: int
    username: str
    email: str


# ── Transactions ──────────────────────────────────────────────────────────────
class TransactionCreate(BaseModel):
    user_id: int
    amount: Decimal
    transaction_type: str

class TransactionOut(_Base):
    transaction_id: int
    user_id: int
    amount: Decimal
    transaction_type: str
    timestamp: datetime
    user: Optional[UserOut] = None
