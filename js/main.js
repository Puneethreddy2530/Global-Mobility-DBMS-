// js/main.js — Bootstrap, orchestration, and polling.
// Imports api.js + render.js (loaded via <script> tags before this file).

const POLL_INTERVAL_MS = 30_000; // refresh positions every 30 s

let _cachedTrips       = [];
let _cachedCongestion  = [];
let _cachedBottlenecks = [];

async function init() {
  console.log('[OC] Orbital Command initializing…');

  // ── Parallel load all endpoints ─────────────────────────────────────────
  const [
    { data: trips,       source: tripsSource },
    { data: vehicles                         },
    { data: delays                           },
    { data: congestion                       },
    { data: bottlenecks                      },
    { data: positions                        }
  ] = await Promise.all([
    fetchTrips(),
    fetchVehicles(),
    fetchDelays(),
    fetchCongestion(),
    fetchBottlenecks(),
    fetchPositions()
  ]);

  _cachedTrips       = trips;
  _cachedCongestion  = congestion;
  _cachedBottlenecks = bottlenecks;

  // ── Render every section ────────────────────────────────────────────────
  renderTrajectory(trips);
  renderFleet(vehicles);
  renderNetworkStats(congestion, trips);
  renderCongestion(congestion);
  renderAlerts(delays);
  renderPositions(positions);
  renderBottlenecks(bottlenecks, trips, congestion);
  renderSourceBadge(tripsSource);

  console.log('[OC] All sections rendered.', {
    trips: trips.length, vehicles: vehicles.length, delays: delays.length,
    congestion: congestion.length, bottlenecks: bottlenecks.length, positions: positions.length
  });
}

// ── Positions ticker — simulates live movement ───────────────────────────────
async function pollPositions() {
  const { data: positions } = await fetchPositions();
  renderPositions(positions);
  tickPositions();
}

// Live counter tick every 4 s (lightweight, no API call)
setInterval(tickPositions, 4_000);

// Full position refresh every 30 s
setInterval(pollPositions, POLL_INTERVAL_MS);

// ── Start ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => { init().catch(console.error); });
