// js/api.js — All API calls with automatic mock-data fallback.
// Mirrors the globalmobility PostgreSQL schema exactly.

const BASE_URL = 'http://localhost:8000';

// ── Mock data (mirrors globalmobility seed) ─────────────────────────────────
const MOCK = {
  trips: [
    {
      trip_id: 8, trip_status: 'DELAYED',
      scheduled_departure: '2026-03-15T06:00:00', scheduled_arrival: '2026-03-15T18:00:00',
      actual_departure: '2026-03-15T06:10:00', actual_arrival: null,
      vehicle: {
        vehicle_id: 7, vehicle_type: 'AIRCRAFT', reg_number: 'LH-900', model_name: 'Airbus A350',
        carrier: { carrier_id: 6, name: 'Lufthansa', carrier_type: 'AIR', country_code: 'DE' }
      },
      route: {
        route_id: 8, route_type: 'AIR', distance_km: 9300,
        origin_node: { node_id: 11, name: 'Frankfurt Airport', country: 'Germany', node_type: 'AIRPORT' },
        destination_node: { node_id: 12, name: 'Tokyo Haneda Airport', country: 'Japan', node_type: 'AIRPORT' }
      }
    },
    {
      trip_id: 1, trip_status: 'DELAYED',
      scheduled_departure: '2026-03-10T08:00:00', scheduled_arrival: '2026-03-10T11:00:00',
      actual_departure: '2026-03-10T08:10:00', actual_arrival: '2026-03-10T11:20:00',
      vehicle: {
        vehicle_id: 1, vehicle_type: 'AIRCRAFT', reg_number: 'VT-AIA', model_name: 'Boeing 787',
        carrier: { carrier_id: 1, name: 'Air India', carrier_type: 'AIR', country_code: 'IN' }
      },
      route: {
        route_id: 1, route_type: 'AIR', distance_km: 2200,
        origin_node: { node_id: 1, name: 'Chennai International Airport', country: 'India', node_type: 'AIRPORT' },
        destination_node: { node_id: 2, name: 'Delhi International Airport', country: 'India', node_type: 'AIRPORT' }
      }
    },
    {
      trip_id: 2, trip_status: 'ON_TIME',
      scheduled_departure: '2026-03-11T06:00:00', scheduled_arrival: '2026-03-11T11:00:00',
      actual_departure: '2026-03-11T06:00:00', actual_arrival: '2026-03-11T10:55:00',
      vehicle: {
        vehicle_id: 2, vehicle_type: 'TRAIN', reg_number: 'IR-2201', model_name: 'Shatabdi Express',
        carrier: { carrier_id: 2, name: 'Indian Railways', carrier_type: 'RAIL', country_code: 'IN' }
      },
      route: {
        route_id: 2, route_type: 'RAIL', distance_km: 350,
        origin_node: { node_id: 5, name: 'Chennai Central', country: 'India', node_type: 'STATION' },
        destination_node: { node_id: 6, name: 'Bangalore City Station', country: 'India', node_type: 'STATION' }
      }
    },
    {
      trip_id: 3, trip_status: 'DELAYED',
      scheduled_departure: '2026-03-05T14:00:00', scheduled_arrival: '2026-03-15T16:00:00',
      actual_departure: '2026-03-05T14:30:00', actual_arrival: null,
      vehicle: {
        vehicle_id: 3, vehicle_type: 'SHIP', reg_number: 'MSK-8891', model_name: 'Maersk Container Vessel',
        carrier: { carrier_id: 3, name: 'Maersk Line', carrier_type: 'SEA', country_code: 'DK' }
      },
      route: {
        route_id: 3, route_type: 'SEA', distance_km: 3100,
        origin_node: { node_id: 3, name: 'Chennai Port', country: 'India', node_type: 'PORT' },
        destination_node: { node_id: 4, name: 'Singapore Port', country: 'Singapore', node_type: 'PORT' }
      }
    },
    {
      trip_id: 4, trip_status: 'ON_TIME',
      scheduled_departure: '2026-03-12T05:00:00', scheduled_arrival: '2026-03-12T09:00:00',
      actual_departure: '2026-03-12T05:05:00', actual_arrival: '2026-03-12T08:55:00',
      vehicle: {
        vehicle_id: 4, vehicle_type: 'AIRCRAFT', reg_number: 'A6-EM1', model_name: 'Airbus A380',
        carrier: { carrier_id: 4, name: 'Emirates', carrier_type: 'AIR', country_code: 'AE' }
      },
      route: {
        route_id: 4, route_type: 'AIR', distance_km: 2950,
        origin_node: { node_id: 7, name: 'Dubai International Airport', country: 'UAE', node_type: 'AIRPORT' },
        destination_node: { node_id: 1, name: 'Chennai International Airport', country: 'India', node_type: 'AIRPORT' }
      }
    },
    {
      trip_id: 11, trip_status: 'DELAYED',
      scheduled_departure: '2026-03-12T14:00:00', scheduled_arrival: '2026-03-22T10:00:00',
      actual_departure: '2026-03-12T14:20:00', actual_arrival: null,
      vehicle: {
        vehicle_id: 10, vehicle_type: 'SHIP', reg_number: 'MSC-001', model_name: 'MSC Container Vessel',
        carrier: { carrier_id: 8, name: 'MSC Shipping', carrier_type: 'SEA', country_code: 'CH' }
      },
      route: {
        route_id: 9, route_type: 'SEA', distance_km: 9500,
        origin_node: { node_id: 13, name: 'Hamburg Port', country: 'Germany', node_type: 'PORT' },
        destination_node: { node_id: 14, name: 'Tokyo Port', country: 'Japan', node_type: 'PORT' }
      }
    },
    {
      trip_id: 9, trip_status: 'ON_TIME',
      scheduled_departure: '2026-03-16T09:00:00', scheduled_arrival: '2026-03-16T20:00:00',
      actual_departure: '2026-03-16T09:00:00', actual_arrival: '2026-03-16T19:45:00',
      vehicle: {
        vehicle_id: 8, vehicle_type: 'AIRCRAFT', reg_number: 'LH-901', model_name: 'Airbus A350',
        carrier: { carrier_id: 6, name: 'Lufthansa', carrier_type: 'AIR', country_code: 'DE' }
      },
      route: {
        route_id: 8, route_type: 'AIR', distance_km: 9300,
        origin_node: { node_id: 11, name: 'Frankfurt Airport', country: 'Germany', node_type: 'AIRPORT' },
        destination_node: { node_id: 12, name: 'Tokyo Haneda Airport', country: 'Japan', node_type: 'AIRPORT' }
      }
    },
    {
      trip_id: 10, trip_status: 'ON_TIME',
      scheduled_departure: '2026-03-17T07:00:00', scheduled_arrival: '2026-03-17T12:00:00',
      actual_departure: '2026-03-17T07:05:00', actual_arrival: null,
      vehicle: {
        vehicle_id: 9, vehicle_type: 'TRAIN', reg_number: 'JR-550', model_name: 'Shinkansen Bullet Train',
        carrier: { carrier_id: 7, name: 'Japan Railways', carrier_type: 'RAIL', country_code: 'JP' }
      },
      route: {
        route_id: 10, route_type: 'RAIL', distance_km: 800,
        origin_node: { node_id: 15, name: 'Tokyo Central Station', country: 'Japan', node_type: 'STATION' },
        destination_node: { node_id: 10, name: 'Hyderabad Station', country: 'India', node_type: 'STATION' }
      }
    }
  ],

  vehicles: [
    { vehicle_id: 1, vehicle_type: 'AIRCRAFT', reg_number: 'VT-AIA', model_name: 'Boeing 787',
      carrier: { name: 'Air India', carrier_type: 'AIR', country_code: 'IN' } },
    { vehicle_id: 2, vehicle_type: 'TRAIN', reg_number: 'IR-2201', model_name: 'Shatabdi Express',
      carrier: { name: 'Indian Railways', carrier_type: 'RAIL', country_code: 'IN' } },
    { vehicle_id: 3, vehicle_type: 'SHIP', reg_number: 'MSK-8891', model_name: 'Maersk Container Vessel',
      carrier: { name: 'Maersk Line', carrier_type: 'SEA', country_code: 'DK' } },
    { vehicle_id: 4, vehicle_type: 'AIRCRAFT', reg_number: 'A6-EM1', model_name: 'Airbus A380',
      carrier: { name: 'Emirates', carrier_type: 'AIR', country_code: 'AE' } },
    { vehicle_id: 5, vehicle_type: 'AIRCRAFT', reg_number: 'A6-EM2', model_name: 'Boeing 777',
      carrier: { name: 'Emirates', carrier_type: 'AIR', country_code: 'AE' } },
    { vehicle_id: 6, vehicle_type: 'TRAIN', reg_number: 'UP-7711', model_name: 'Union Pacific Express',
      carrier: { name: 'Union Pacific Rail', carrier_type: 'RAIL', country_code: 'US' } },
    { vehicle_id: 7, vehicle_type: 'AIRCRAFT', reg_number: 'LH-900', model_name: 'Airbus A320',
      carrier: { name: 'Lufthansa', carrier_type: 'AIR', country_code: 'DE' } },
    { vehicle_id: 8, vehicle_type: 'AIRCRAFT', reg_number: 'LH-901', model_name: 'Airbus A350',
      carrier: { name: 'Lufthansa', carrier_type: 'AIR', country_code: 'DE' } },
    { vehicle_id: 9, vehicle_type: 'TRAIN', reg_number: 'JR-550', model_name: 'Shinkansen Bullet Train',
      carrier: { name: 'Japan Railways', carrier_type: 'RAIL', country_code: 'JP' } },
    { vehicle_id: 10, vehicle_type: 'SHIP', reg_number: 'MSC-001', model_name: 'MSC Container Vessel',
      carrier: { name: 'MSC Shipping', carrier_type: 'SEA', country_code: 'CH' } }
  ],

  delays: [
    { delay_id: 1, trip_id: 1, delay_minutes: 10, delay_reason: 'WEATHER', event_time: '2026-03-10T08:05:00',
      node: { name: 'Chennai International Airport', country: 'India', node_type: 'AIRPORT' },
      trip: { trip_status: 'DELAYED' } },
    { delay_id: 2, trip_id: 1, delay_minutes: 20, delay_reason: 'TRAFFIC', event_time: '2026-03-10T10:50:00',
      node: { name: 'Delhi International Airport', country: 'India', node_type: 'AIRPORT' },
      trip: { trip_status: 'DELAYED' } },
    { delay_id: 3, trip_id: 3, delay_minutes: 30, delay_reason: 'MAINTENANCE', event_time: '2026-03-06T09:00:00',
      node: { name: 'Chennai Port', country: 'India', node_type: 'PORT' },
      trip: { trip_status: 'DELAYED' } },
    { delay_id: 4, trip_id: 5, delay_minutes: 15, delay_reason: 'WEATHER', event_time: '2026-03-12T11:10:00',
      node: { name: 'Dubai International Airport', country: 'UAE', node_type: 'AIRPORT' },
      trip: { trip_status: 'DELAYED' } },
    { delay_id: 5, trip_id: 7, delay_minutes: 40, delay_reason: 'TRAFFIC', event_time: '2026-03-09T09:30:00',
      node: { name: 'Chennai Port', country: 'India', node_type: 'PORT' },
      trip: { trip_status: 'DELAYED' } },
    { delay_id: 6, trip_id: 6, delay_minutes: 5, delay_reason: 'CONTROL', event_time: '2026-03-13T07:10:00',
      node: { name: 'Hyderabad Station', country: 'India', node_type: 'STATION' },
      trip: { trip_status: 'ON_TIME' } },
    { delay_id: 7, trip_id: 8, delay_minutes: 25, delay_reason: 'WEATHER', event_time: '2026-03-15T06:20:00',
      node: { name: 'Frankfurt Airport', country: 'Germany', node_type: 'AIRPORT' },
      trip: { trip_status: 'DELAYED' } },
    { delay_id: 8, trip_id: 11, delay_minutes: 45, delay_reason: 'TRAFFIC', event_time: '2026-03-14T10:00:00',
      node: { name: 'Hamburg Port', country: 'Germany', node_type: 'PORT' },
      trip: { trip_status: 'DELAYED' } },
    { delay_id: 9, trip_id: 9, delay_minutes: 5, delay_reason: 'CONTROL', event_time: '2026-03-16T09:05:00',
      node: { name: 'Tokyo Haneda Airport', country: 'Japan', node_type: 'AIRPORT' },
      trip: { trip_status: 'ON_TIME' } }
  ],

  congestion: [
    { congestion_id: 1, segment_id: 1, timestamp: '2026-03-11T08:00:00', congestion_level: 70, avg_speed: 45.50, vehicle_count: 120,
      segment: { segment_name: 'Chennai-Bangalore Highway', segment_type: 'ROAD', region: 'South India' } },
    { congestion_id: 2, segment_id: 1, timestamp: '2026-03-11T09:00:00', congestion_level: 85, avg_speed: 30.20, vehicle_count: 200,
      segment: { segment_name: 'Chennai-Bangalore Highway', segment_type: 'ROAD', region: 'South India' } },
    { congestion_id: 3, segment_id: 2, timestamp: '2026-03-07T12:00:00', congestion_level: 40, avg_speed: 25.00, vehicle_count: 50,
      segment: { segment_name: 'Indian Ocean Shipping Lane', segment_type: 'SEA_LANE', region: 'Indian Ocean' } },
    { congestion_id: 4, segment_id: 3, timestamp: '2026-03-13T09:00:00', congestion_level: 60, avg_speed: 50.50, vehicle_count: 110,
      segment: { segment_name: 'Bangalore-Hyderabad Highway', segment_type: 'ROAD', region: 'South India' } },
    { congestion_id: 5, segment_id: 3, timestamp: '2026-03-13T10:00:00', congestion_level: 75, avg_speed: 35.00, vehicle_count: 180,
      segment: { segment_name: 'Bangalore-Hyderabad Highway', segment_type: 'ROAD', region: 'South India' } },
    { congestion_id: 6, segment_id: 4, timestamp: '2026-03-10T14:00:00', congestion_level: 45, avg_speed: 28.50, vehicle_count: 60,
      segment: { segment_name: 'Arabian Sea Shipping Lane', segment_type: 'SEA_LANE', region: 'Arabian Sea' } },
    { congestion_id: 7, segment_id: 5, timestamp: '2026-03-15T09:00:00', congestion_level: 50, avg_speed: 60.50, vehicle_count: 100,
      segment: { segment_name: 'Frankfurt-Airport Highway', segment_type: 'ROAD', region: 'Germany' } },
    { congestion_id: 8, segment_id: 5, timestamp: '2026-03-15T10:00:00', congestion_level: 65, avg_speed: 45.20, vehicle_count: 150,
      segment: { segment_name: 'Frankfurt-Airport Highway', segment_type: 'ROAD', region: 'Germany' } },
    { congestion_id: 9, segment_id: 6, timestamp: '2026-03-18T14:00:00', congestion_level: 30, avg_speed: 22.50, vehicle_count: 70,
      segment: { segment_name: 'Pacific Shipping Lane', segment_type: 'SEA_LANE', region: 'Pacific Ocean' } }
  ],

  bottlenecks: [
    { report_id: 1, segment_id: 1, start_time: '2026-03-11T08:00:00', end_time: '2026-03-11T10:00:00', severity_score: 85.50,
      segment: { segment_name: 'Chennai-Bangalore Highway', segment_type: 'ROAD', region: 'South India' } },
    { report_id: 2, segment_id: 2, start_time: '2026-03-07T11:00:00', end_time: '2026-03-07T14:00:00', severity_score: 60.00,
      segment: { segment_name: 'Indian Ocean Shipping Lane', segment_type: 'SEA_LANE', region: 'Indian Ocean' } },
    { report_id: 3, segment_id: 3, start_time: '2026-03-13T08:30:00', end_time: '2026-03-13T11:30:00', severity_score: 72.30,
      segment: { segment_name: 'Bangalore-Hyderabad Highway', segment_type: 'ROAD', region: 'South India' } },
    { report_id: 4, segment_id: 4, start_time: '2026-03-10T13:00:00', end_time: '2026-03-10T16:00:00', severity_score: 55.00,
      segment: { segment_name: 'Arabian Sea Shipping Lane', segment_type: 'SEA_LANE', region: 'Arabian Sea' } },
    { report_id: 5, segment_id: 5, start_time: '2026-03-15T08:00:00', end_time: '2026-03-15T12:00:00', severity_score: 68.20,
      segment: { segment_name: 'Frankfurt-Airport Highway', segment_type: 'ROAD', region: 'Germany' } },
    { report_id: 6, segment_id: 6, start_time: '2026-03-18T13:00:00', end_time: '2026-03-18T18:00:00', severity_score: 52.40,
      segment: { segment_name: 'Pacific Shipping Lane', segment_type: 'SEA_LANE', region: 'Pacific Ocean' } }
  ],

  positions: [
    { pos_id: 1,  trip_id: 1,  timestamp: '2026-03-10T08:30:00', latitude: 13.5,  longitude: 80.5,   altitude: 30000, speed: 850 },
    { pos_id: 2,  trip_id: 1,  timestamp: '2026-03-10T09:30:00', latitude: 18.0,  longitude: 78.0,   altitude: 32000, speed: 870 },
    { pos_id: 3,  trip_id: 2,  timestamp: '2026-03-11T07:30:00', latitude: 13.0,  longitude: 79.5,   altitude: null,  speed: 90  },
    { pos_id: 4,  trip_id: 3,  timestamp: '2026-03-06T10:00:00', latitude: 10.0,  longitude: 85.0,   altitude: null,  speed: 40  },
    { pos_id: 5,  trip_id: 4,  timestamp: '2026-03-12T06:00:00', latitude: 20.0,  longitude: 70.0,   altitude: 31000, speed: 860 },
    { pos_id: 6,  trip_id: 4,  timestamp: '2026-03-12T07:30:00', latitude: 15.0,  longitude: 75.0,   altitude: 33000, speed: 880 },
    { pos_id: 7,  trip_id: 5,  timestamp: '2026-03-12T12:30:00', latitude: 16.0,  longitude: 78.0,   altitude: 30000, speed: 820 },
    { pos_id: 8,  trip_id: 6,  timestamp: '2026-03-13T08:30:00', latitude: 16.5,  longitude: 79.0,   altitude: null,  speed: 95  },
    { pos_id: 9,  trip_id: 7,  timestamp: '2026-03-09T10:00:00', latitude: 14.0,  longitude: 85.0,   altitude: null,  speed: 38  },
    { pos_id: 10, trip_id: 8,  timestamp: '2026-03-15T08:00:00', latitude: 45.0,  longitude: 20.0,   altitude: 32000, speed: 870 },
    { pos_id: 11, trip_id: 8,  timestamp: '2026-03-15T12:00:00', latitude: 50.0,  longitude: 40.0,   altitude: 33000, speed: 880 },
    { pos_id: 12, trip_id: 9,  timestamp: '2026-03-16T13:00:00', latitude: 48.0,  longitude: 35.0,   altitude: 30000, speed: 850 },
    { pos_id: 13, trip_id: 10, timestamp: '2026-03-17T09:00:00', latitude: 34.0,  longitude: 135.0,  altitude: null,  speed: 120 },
    { pos_id: 14, trip_id: 11, timestamp: '2026-03-14T11:00:00', latitude: 30.0,  longitude: 120.0,  altitude: null,  speed: 42  }
  ]
};

// ── Core fetch helper ────────────────────────────────────────────────────────
async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { data: await res.json(), source: 'api' };
}

// ── Public API ───────────────────────────────────────────────────────────────
async function fetchTrips()       { return apiFetch('/trips');      }
async function fetchVehicles()    { return apiFetch('/vehicles');   }
async function fetchDelays()      { return apiFetch('/delays');     }
async function fetchCongestion()  { return apiFetch('/congestion'); }
async function fetchBottlenecks() { return apiFetch('/bottlenecks');}
async function fetchPositions()   { return apiFetch('/positions');  }

// ── Transaction & User API ───────────────────────────────────────────────────
async function addUser(userData) {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return await res.json();
}

async function addTransaction(txnData) {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(txnData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return await res.json();
}
