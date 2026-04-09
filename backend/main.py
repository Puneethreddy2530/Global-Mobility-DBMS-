from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
import sqlite3, os

app = FastAPI(title="Global Mobility API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "globalmobility.db")

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

api = APIRouter(prefix="/api")

@api.get("/trips")
def trips():
    conn = db()
    rows = conn.execute("""
        SELECT
            t.trip_id, t.trip_status,
            t.scheduled_departure, t.scheduled_arrival,
            t.actual_departure,   t.actual_arrival,
            r.distance_km, r.route_type,
            o.name AS origin_name, o.country AS origin_country,
            d.name AS dest_name,   d.country AS dest_country,
            v.model_name, v.reg_number, v.vehicle_type,
            c.name AS carrier_name, c.country_code
        FROM trip t
        JOIN route r         ON t.route_id   = r.route_id
        JOIN location_node o ON r.origin_node_id      = o.node_id
        JOIN location_node d ON r.destination_node_id = d.node_id
        JOIN vehicle v       ON t.vehicle_id  = v.vehicle_id
        JOIN carrier c       ON v.carrier_id  = c.carrier_id
        ORDER BY t.actual_departure DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@api.get("/vehicles")
def vehicles():
    conn = db()
    rows = conn.execute("""
        SELECT v.vehicle_id, v.vehicle_type, v.reg_number, v.model_name,
               c.name AS carrier_name, c.country_code
        FROM vehicle v JOIN carrier c ON v.carrier_id = c.carrier_id
        ORDER BY v.vehicle_type, v.vehicle_id
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@api.get("/congestion")
def congestion():
    conn = db()
    rows = conn.execute("""
        SELECT cr.congestion_id, cr.congestion_level, cr.avg_speed,
               cr.vehicle_count, cr.timestamp,
               ts.segment_name, ts.region
        FROM congestion_record cr
        JOIN traffic_segment ts ON cr.segment_id = ts.segment_id
        ORDER BY cr.timestamp DESC LIMIT 6
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@api.get("/delays")
def delays():
    conn = db()
    rows = conn.execute("""
        SELECT de.delay_id, de.delay_minutes, de.delay_reason, de.event_time,
               de.trip_id, ln.name AS node_name, ln.country AS node_country,
               t.trip_status
        FROM delay_event de
        JOIN location_node ln ON de.node_id  = ln.node_id
        JOIN trip t           ON de.trip_id  = t.trip_id
        ORDER BY de.event_time DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@api.get("/bottleneck")
def bottleneck():
    conn = db()
    rows = conn.execute("""
        SELECT br.report_id, br.severity_score, br.start_time, br.end_time,
               ts.segment_name, ts.region
        FROM bottleneck_report br
        JOIN traffic_segment ts ON br.segment_id = ts.segment_id
        ORDER BY br.severity_score DESC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@api.get("/position")
def position():
    conn = db()
    row = conn.execute(
        "SELECT COUNT(DISTINCT trip_id) AS active_assets FROM position_log"
    ).fetchone()
    conn.close()
    return {"active_assets": int(row["active_assets"] or 0)}

@api.get("/stats")
def stats():
    conn = db()
    cong  = conn.execute("SELECT AVG(congestion_level) AS ac, AVG(vehicle_count) AS avc FROM congestion_record").fetchone()
    tr    = conn.execute("SELECT SUM(CASE WHEN trip_status='ON_TIME' THEN 1 ELSE 0 END) AS ot, COUNT(*) AS tot FROM trip").fetchone()
    sev   = conn.execute("SELECT MAX(severity_score) AS ms FROM bottleneck_report").fetchone()
    nr    = conn.execute("SELECT COUNT(*) AS n FROM route").fetchone()
    nv    = conn.execute("SELECT COUNT(*) AS n FROM vehicle").fetchone()
    nn    = conn.execute("SELECT COUNT(*) AS n FROM location_node").fetchone()
    conn.close()
    otp = round((tr["ot"] / tr["tot"]) * 100, 1) if tr["tot"] else 0.0
    return {
        "avg_congestion":    round(float(cong["ac"]  or 0), 1),
        "avg_vehicle_count": round(float(cong["avc"] or 0), 1),
        "on_time_pct":  otp,
        "max_severity": round(float(sev["ms"] or 0), 1),
        "total_routes":   int(nr["n"] or 0),
        "total_vehicles": int(nv["n"] or 0),
        "total_nodes":    int(nn["n"] or 0),
    }

app.include_router(api)

@app.get("/health")
def health():
    return {"status": "ok"}
