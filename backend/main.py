from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
import psycopg2
import psycopg2.extras
import os

app = FastAPI(title="Global Mobility API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/globalmobility")

def get_conn():
    return psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)

router = APIRouter(prefix="/api")

@router.get("/trips")
def get_trips():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            t.trip_id, t.trip_status,
            t.scheduled_departure, t.scheduled_arrival,
            t.actual_departure, t.actual_arrival,
            r.distance_km, r.route_type,
            o.name AS origin_name, o.country AS origin_country,
            d.name AS dest_name, d.country AS dest_country,
            v.model_name, v.reg_number, v.vehicle_type,
            c.name AS carrier_name, c.country_code
        FROM trip t
        JOIN route r ON t.route_id = r.route_id
        JOIN location_node o ON r.origin_node_id = o.node_id
        JOIN location_node d ON r.destination_node_id = d.node_id
        JOIN vehicle v ON t.vehicle_id = v.vehicle_id
        JOIN carrier c ON v.carrier_id = c.carrier_id
        ORDER BY t.actual_departure DESC NULLS LAST
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [dict(r) for r in rows]

@router.get("/vehicles")
def get_vehicles():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT v.vehicle_id, v.vehicle_type, v.reg_number, v.model_name,
               c.name AS carrier_name, c.country_code, c.carrier_type
        FROM vehicle v
        JOIN carrier c ON v.carrier_id = c.carrier_id
        ORDER BY v.vehicle_type, v.vehicle_id
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [dict(r) for r in rows]

@router.get("/congestion")
def get_congestion():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT cr.congestion_id, cr.congestion_level, cr.avg_speed,
               cr.vehicle_count, cr.timestamp,
               ts.segment_name, ts.region, ts.segment_type
        FROM congestion_record cr
        JOIN traffic_segment ts ON cr.segment_id = ts.segment_id
        ORDER BY cr.timestamp DESC
        LIMIT 6
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [dict(r) for r in rows]

@router.get("/delays")
def get_delays():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT de.delay_id, de.delay_minutes, de.delay_reason, de.event_time,
               de.trip_id,
               ln.name AS node_name, ln.country AS node_country,
               t.trip_status
        FROM delay_event de
        JOIN location_node ln ON de.node_id = ln.node_id
        JOIN trip t ON de.trip_id = t.trip_id
        ORDER BY de.event_time DESC
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [dict(r) for r in rows]

@router.get("/bottleneck")
def get_bottleneck():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT br.report_id, br.severity_score, br.start_time, br.end_time,
               ts.segment_name, ts.region, ts.segment_type
        FROM bottleneck_report br
        JOIN traffic_segment ts ON br.segment_id = ts.segment_id
        ORDER BY br.severity_score DESC
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [dict(r) for r in rows]

@router.get("/position")
def get_position():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(DISTINCT trip_id) AS active_assets FROM position_log")
    row = cur.fetchone()
    cur.close(); conn.close()
    return {"active_assets": row["active_assets"] if row else 0}

@router.get("/stats")
def get_stats():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT AVG(congestion_level) AS avg_congestion, AVG(vehicle_count) AS avg_vehicle_count FROM congestion_record")
    cong = cur.fetchone()

    cur.execute("""
        SELECT
            COUNT(*) FILTER (WHERE trip_status = 'ON_TIME') AS on_time,
            COUNT(*) AS total
        FROM trip
    """)
    trips = cur.fetchone()

    cur.execute("SELECT MAX(severity_score) AS max_severity FROM bottleneck_report")
    sev = cur.fetchone()

    cur.execute("SELECT COUNT(*) AS total_routes FROM route")
    routes = cur.fetchone()

    cur.execute("SELECT COUNT(*) AS total_vehicles FROM vehicle")
    vehicles = cur.fetchone()

    cur.execute("SELECT COUNT(*) AS total_nodes FROM location_node")
    nodes = cur.fetchone()

    cur.close(); conn.close()

    on_time_pct = 0.0
    if trips and trips["total"] and trips["total"] > 0:
        on_time_pct = round((trips["on_time"] / trips["total"]) * 100, 1)

    return {
        "avg_congestion": round(float(cong["avg_congestion"] or 0), 1),
        "avg_vehicle_count": round(float(cong["avg_vehicle_count"] or 0), 1),
        "on_time_pct": on_time_pct,
        "max_severity": round(float(sev["max_severity"] or 0), 1),
        "total_routes": int(routes["total_routes"] or 0),
        "total_vehicles": int(vehicles["total_vehicles"] or 0),
        "total_nodes": int(nodes["total_nodes"] or 0),
    }

app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok"}
