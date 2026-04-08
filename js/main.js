import {
  fetchTrips, fetchVehicles, fetchCongestion,
  fetchDelays, fetchBottleneck, fetchPositionCount, fetchStats
} from './api.js';

import {
  updateConnectionBadge,
  renderTrajectory, renderFleet, renderCongestion,
  renderDelays, renderBottleneck, renderStats, renderLiveTracking
} from './render.js';

async function loadAll() {
  updateConnectionBadge('connecting');
  try {
    const [trips, vehicles, congestion, delays, bottleneck, position, stats] =
      await Promise.all([
        fetchTrips(),
        fetchVehicles(),
        fetchCongestion(),
        fetchDelays(),
        fetchBottleneck(),
        fetchPositionCount(),
        fetchStats(),
      ]);

    renderTrajectory(trips);
    renderFleet(vehicles);
    renderCongestion(congestion);
    renderDelays(delays);
    renderBottleneck(bottleneck, stats);
    renderStats(stats);
    renderLiveTracking(position);
    updateConnectionBadge('live');
  } catch (err) {
    console.error('Dashboard load failed:', err);
    updateConnectionBadge('error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  setInterval(loadAll, 30000);
});
