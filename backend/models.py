"""models.py — SQLAlchemy ORM models mirroring the globalmobility schema."""

from sqlalchemy import (
    Column, Integer, String, Numeric, Text,
    TIMESTAMP, ForeignKey, CheckConstraint
)
from sqlalchemy.orm import relationship
from database import Base


class Carrier(Base):
    __tablename__ = "carrier"

    carrier_id   = Column(Integer, primary_key=True)
    name         = Column(String(100), nullable=False)
    carrier_type = Column(String(10),  nullable=False)   # AIR | RAIL | SEA
    country_code = Column(String(2),   nullable=False)

    vehicles = relationship("Vehicle", back_populates="carrier")


class Vehicle(Base):
    __tablename__ = "vehicle"

    vehicle_id   = Column(Integer, primary_key=True)
    carrier_id   = Column(Integer, ForeignKey("carrier.carrier_id"))
    vehicle_type = Column(String(10),  nullable=False)   # AIRCRAFT | TRAIN | SHIP
    reg_number   = Column(String(50),  nullable=False)
    model_name   = Column(String(100), nullable=False)

    carrier  = relationship("Carrier",  back_populates="vehicles")
    trips    = relationship("Trip",     back_populates="vehicle")
    positions = relationship("PositionLog",
                             primaryjoin="Vehicle.vehicle_id == foreign(Trip.vehicle_id)",
                             secondary="trip",
                             secondaryjoin="Trip.trip_id == foreign(PositionLog.trip_id)",
                             viewonly=True)


class LocationNode(Base):
    __tablename__ = "location_node"

    node_id   = Column(Integer, primary_key=True)
    node_type = Column(String(10),  nullable=False)   # AIRPORT | PORT | STATION
    name      = Column(String(100), nullable=False)
    country   = Column(String(50),  nullable=False)
    latitude  = Column(Numeric(9, 6), nullable=False)
    longitude = Column(Numeric(9, 6), nullable=False)

    origin_routes      = relationship("Route", foreign_keys="Route.origin_node_id",
                                      back_populates="origin_node")
    destination_routes = relationship("Route", foreign_keys="Route.destination_node_id",
                                      back_populates="destination_node")
    delay_events       = relationship("DelayEvent", back_populates="node")


class TrafficSegment(Base):
    __tablename__ = "traffic_segment"

    segment_id   = Column(Integer, primary_key=True)
    segment_name = Column(String(100), nullable=False)
    segment_type = Column(String(10),  nullable=False)   # ROAD | SEA_LANE
    geometry     = Column(Text,        nullable=False)
    region       = Column(String(50),  nullable=False)

    congestion_records  = relationship("CongestionRecord",  back_populates="segment")
    bottleneck_reports  = relationship("BottleneckReport",  back_populates="segment")
    routes              = relationship("Route",             back_populates="segment")


class Route(Base):
    __tablename__ = "route"

    route_id            = Column(Integer, primary_key=True)
    route_type          = Column(String(10),     nullable=False)  # AIR | RAIL | SEA | ROAD
    origin_node_id      = Column(Integer, ForeignKey("location_node.node_id"))
    destination_node_id = Column(Integer, ForeignKey("location_node.node_id"))
    distance_km         = Column(Numeric(10, 2), nullable=False)
    segment_id          = Column(Integer, ForeignKey("traffic_segment.segment_id"))

    origin_node      = relationship("LocationNode", foreign_keys=[origin_node_id],
                                    back_populates="origin_routes")
    destination_node = relationship("LocationNode", foreign_keys=[destination_node_id],
                                    back_populates="destination_routes")
    segment          = relationship("TrafficSegment", back_populates="routes")
    trips            = relationship("Trip", back_populates="route")


class Trip(Base):
    __tablename__ = "trip"

    trip_id              = Column(Integer, primary_key=True)
    vehicle_id           = Column(Integer, ForeignKey("vehicle.vehicle_id"))
    route_id             = Column(Integer, ForeignKey("route.route_id"))
    scheduled_departure  = Column(TIMESTAMP, nullable=False)
    scheduled_arrival    = Column(TIMESTAMP, nullable=False)
    actual_departure     = Column(TIMESTAMP)
    actual_arrival       = Column(TIMESTAMP)
    trip_status          = Column(String(10), nullable=False)  # ON_TIME | DELAYED | CANCELLED

    vehicle      = relationship("Vehicle",     back_populates="trips")
    route        = relationship("Route",       back_populates="trips")
    delay_events = relationship("DelayEvent",  back_populates="trip")
    positions    = relationship("PositionLog", back_populates="trip")


class CongestionRecord(Base):
    __tablename__ = "congestion_record"

    congestion_id    = Column(Integer, primary_key=True)
    segment_id       = Column(Integer, ForeignKey("traffic_segment.segment_id"))
    timestamp        = Column(TIMESTAMP, nullable=False)
    congestion_level = Column(Integer,   nullable=False)
    avg_speed        = Column(Numeric(6, 2), nullable=False)
    vehicle_count    = Column(Integer,   nullable=False)

    segment = relationship("TrafficSegment", back_populates="congestion_records")


class DelayEvent(Base):
    __tablename__ = "delay_event"

    delay_id     = Column(Integer, primary_key=True)
    trip_id      = Column(Integer, ForeignKey("trip.trip_id"))
    node_id      = Column(Integer, ForeignKey("location_node.node_id"))
    delay_minutes = Column(Integer, nullable=False)
    delay_reason  = Column(String(20), nullable=False)  # WEATHER | TRAFFIC | MAINTENANCE | CONTROL | UNKNOWN
    event_time    = Column(TIMESTAMP, nullable=False)

    trip = relationship("Trip",         back_populates="delay_events")
    node = relationship("LocationNode", back_populates="delay_events")


class BottleneckReport(Base):
    __tablename__ = "bottleneck_report"

    report_id      = Column(Integer, primary_key=True)
    segment_id     = Column(Integer, ForeignKey("traffic_segment.segment_id"))
    start_time     = Column(TIMESTAMP,   nullable=False)
    end_time       = Column(TIMESTAMP,   nullable=False)
    severity_score = Column(Numeric(5, 2), nullable=False)

    segment = relationship("TrafficSegment", back_populates="bottleneck_reports")


class PositionLog(Base):
    __tablename__ = "position_log"

    pos_id    = Column(Integer, primary_key=True)
    trip_id   = Column(Integer, ForeignKey("trip.trip_id"))
    timestamp = Column(TIMESTAMP,     nullable=False)
    latitude  = Column(Numeric(9, 6), nullable=False)
    longitude = Column(Numeric(9, 6), nullable=False)
    altitude  = Column(Numeric(8, 2))
    speed     = Column(Numeric(6, 2), nullable=False)

    trip = relationship("Trip", back_populates="positions")


class User(Base):
    __tablename__ = "users"
    
    user_id  = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email    = Column(String(100), unique=True, nullable=False)
    
    transactions = relationship("Transaction", back_populates="user")


class Transaction(Base):
    __tablename__ = "transactions"
    
    transaction_id   = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.user_id"))
    amount           = Column(Numeric(10, 2), nullable=False)
    transaction_type = Column(String(50), nullable=False)
    timestamp        = Column(TIMESTAMP, nullable=False)

    user = relationship("User", back_populates="transactions")
