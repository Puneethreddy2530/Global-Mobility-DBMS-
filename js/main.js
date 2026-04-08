// js/main.js — Bootstrap, orchestration, and polling.

const POLL_INTERVAL_MS = 30000;

async function loadData() {
    try {
        const [
            tripsRes, vehiclesRes, congestionRes, 
            delaysRes, bottleneckRes, positionRes, statsRes
        ] = await Promise.all([
            fetchTrips(),
            fetchVehicles(),
            fetchCongestion(),
            fetchDelays(),
            fetchBottleneck(),
            fetchPositionCount(),
            fetchStats()
        ]);

        const trips = tripsRes.data;
        const vehicles = vehiclesRes.data;
        const congestion = congestionRes.data;
        const delays = delaysRes.data;
        const bottleneck = bottleneckRes.data;
        const positionCount = positionRes.data.live_asset_count;
        const stats = statsRes.data;

        renderTrajectory(trips);
        renderFleet(vehicles);
        renderCongestion(congestion);
        renderDelays(delays);
        renderBottleneck(bottleneck, stats);
        renderStats(stats);
        renderLiveTracking(positionCount);
        
        // Populate total spans for the fake marketing copy
        const tRoutes = document.getElementById('total-routes');
        if (tRoutes) tRoutes.textContent = trips.length;
        const tVehicles = document.getElementById('total-vehicles');
        if (tVehicles) tVehicles.textContent = vehicles.length;
        
        // Calculate nodes from trips
        const nodes = new Set();
        trips.forEach(t => { 
            nodes.add(t.route.origin_node.node_id); 
            nodes.add(t.route.destination_node.node_id); 
        });
        const tNodes = document.getElementById('total-nodes');
        if (tNodes) tNodes.textContent = nodes.size;

        updateConnectionBadge('live');
    } catch (err) {
        console.error("Fetch Data Error:", err);
        updateConnectionBadge('error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateConnectionBadge('connecting');
    loadData();
    setInterval(loadData, POLL_INTERVAL_MS);
});
