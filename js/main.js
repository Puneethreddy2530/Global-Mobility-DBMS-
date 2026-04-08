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
document.addEventListener('DOMContentLoaded', () => { 
  init().catch(console.error); 

  // User Form Listener
  document.getElementById('addUserForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
          const btn = e.target.querySelector('button');
          btn.innerHTML = "Processing...";
          btn.disabled = true;

          const data = {
              username: document.getElementById('username').value,
              email: document.getElementById('email').value
          };
          
          await addUser(data);
          alert(`Success! User [${data.username}] provisioned to the Orbital Network constraints.`);
          e.target.reset();
      } catch (err) {
          alert(err.message);
      } finally {
          const btn = e.target.querySelector('button');
          btn.innerHTML = "Provision User";
          btn.disabled = false;
      }
  });

  // Transaction Form Listener
  document.getElementById('addTransactionForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
          const btn = e.target.querySelector('button');
          btn.innerHTML = "Processing...";
          btn.disabled = true;

          const data = {
              user_id: parseInt(document.getElementById('txn_user_id').value, 10),
              amount: parseFloat(document.getElementById('txn_amount').value),
              transaction_type: document.getElementById('txn_type').value
          };
          
          await addTransaction(data);
          alert(`Success! Transaction [${data.transaction_type}] approved across nodes.`);
          e.target.reset();
      } catch (err) {
          alert('Error: Likely invalid User ID or network failure. ' + err.message);
      } finally {
          const btn = e.target.querySelector('button');
          btn.innerHTML = "Process Transaction";
          btn.disabled = false;
      }
  });
});
