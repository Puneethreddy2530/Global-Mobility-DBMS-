// js/render.js — DOM update logic according to Global Mobility specs

function fmtDateTime(d) {
    return d.toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function timeRemaining(trip) {
    if (trip.actual_arrival) return "Arrived";
    const left = new Date(trip.scheduled_arrival) - Date.now();
    if (left <= 0) return "Arrived / Overdue";
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    return `${h}h ${m}m remaining`;
}

function renderTrajectory(trips) {
    // Pick the most recently departed trip (actual_departure not null)
    let active = null;
    let latestTime = null;
    for (let t of trips) {
        if (t.actual_departure) {
            let dt = new Date(t.actual_departure).getTime();
            if (!latestTime || dt > latestTime) {
                latestTime = dt;
                active = t;
            }
        }
    }
    if (!active && trips.length > 0) active = trips[0];
    if (!active) return;

    const oName = active.route.origin_node.name;
    const dName = active.route.destination_node.name;
    document.getElementById('origin-code').textContent = oName.substring(0, 3).toUpperCase();
    document.getElementById('origin-name').textContent = oName + ', ' + active.route.origin_node.country;
    document.getElementById('dest-code').textContent = dName.substring(0, 3).toUpperCase();
    document.getElementById('dest-name').textContent = dName + ', ' + active.route.destination_node.country;

    const badge = document.getElementById('trip-status-badge');
    badge.textContent = active.trip_status;
    badge.className = ""; // clear
    if (active.trip_status === 'ON_TIME') {
        badge.className = "bg-green-500 text-white px-2 py-1 rounded text-xs font-bold";
    } else if (active.trip_status === 'DELAYED') {
        badge.className = "bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold";
    } else if (active.trip_status === 'CANCELLED') {
        badge.className = "bg-red-500 text-white px-2 py-1 rounded text-xs font-bold";
    } else {
        badge.className = "bg-gray-500 text-white px-2 py-1 rounded text-xs font-bold";
    }

    let progress = 0;
    if (active.actual_arrival) {
        progress = 100;
    } else if (active.actual_departure && active.scheduled_arrival) {
        const depTime = new Date(active.actual_departure).getTime();
        const arrTime = new Date(active.scheduled_arrival).getTime();
        progress = Math.min(100, Math.max(0, (Date.now() - depTime) / (arrTime - depTime) * 100));
    }
    
    document.getElementById('trip-progress').style.width = progress + '%';
    document.getElementById('plane-icon').style.left = progress + '%';

    document.getElementById('stat-departure').textContent = fmtDateTime(new Date(active.actual_departure || active.scheduled_departure));
    document.getElementById('stat-arrival').textContent = fmtDateTime(new Date(active.scheduled_arrival));
    
    document.getElementById('stat-carrier').textContent = active.vehicle.carrier.name;
    document.getElementById('stat-vehicle').textContent = active.vehicle.model_name + ' (' + active.vehicle.reg_number + ')';

    const dep = new Date(active.actual_departure || active.scheduled_departure);
    const arr = new Date(active.scheduled_arrival);
    const durationHours = (arr - dep) / 3600000;
    const speed = durationHours > 0 ? (active.route.distance_km / durationHours).toFixed(0) : 0;
    document.getElementById('trip-speed').textContent = speed + ' km/h';

    document.getElementById('time-remaining').textContent = timeRemaining(active);
    document.getElementById('mission-label').textContent = `Trip #${active.trip_id} · ${oName} → ${dName}`;
}

function renderFleet(vehicles) {
    const aircraft = vehicles.find(v => v.vehicle_type === 'AIRCRAFT');
    const ship = vehicles.find(v => v.vehicle_type === 'SHIP');
    const train = vehicles.find(v => v.vehicle_type === 'TRAIN');

    if (aircraft) {
        const e1 = document.getElementById('fleet-air-name'); if(e1) e1.textContent = aircraft.model_name;
        const e2 = document.getElementById('fleet-air-s1'); if(e2) e2.textContent = aircraft.carrier.name;
        const e3 = document.getElementById('fleet-air-s2'); if(e3) e3.textContent = aircraft.reg_number;
        const e4 = document.getElementById('fleet-air-label'); if(e4) e4.textContent = 'AIRCRAFT · ' + aircraft.carrier.country_code;
    }
    if (ship) {
        const e1 = document.getElementById('fleet-sea-name'); if(e1) e1.textContent = ship.model_name;
        const e2 = document.getElementById('fleet-sea-s1'); if(e2) e2.textContent = ship.carrier.name;
        const e3 = document.getElementById('fleet-sea-s2'); if(e3) e3.textContent = ship.reg_number;
        const e4 = document.getElementById('fleet-sea-label'); if(e4) e4.textContent = 'SHIP · ' + ship.carrier.country_code;
    }
    if (train) {
        console.log("TRAIN fleet recorded: ", train);
    }
}

function renderCongestion(records) {
    const container = document.getElementById('velocity-bars');
    if (!container) return;
    container.innerHTML = '';
    
    // Sort and take latest if needed, API returns ordered
    const recent = records.slice(0, 6);
    for (let c of recent) {
        let h = c.congestion_level;
        let color = '#4ade80'; // default green < 40
        if (h > 70) color = '#ef4444'; // red
        else if (h >= 40) color = '#f59e0b'; // amber

        const div = document.createElement('div');
        div.className = "flex-1 transition-all duration-700 cursor-pointer";
        div.style.height = h + '%';
        div.style.backgroundColor = color;
        div.style.minHeight = '4px';
        div.title = `${c.segment ? c.segment.segment_name : 'Unknown Segment'}: ${h}%`;
        container.appendChild(div);
    }
}

function renderDelays(delays) {
    const container = document.getElementById('alerts-container');
    if (!container) return;
    container.innerHTML = '';

    if (delays.length === 0) {
        container.innerHTML = `<div class="p-4 text-slate-400">No active alerts. Operational status optimal.</div>`;
        return;
    }

    delays.forEach(d => {
        let borderClass = 'border-red-500'; // UNKNOWN default
        let icon = 'warning';
        if (d.delay_reason === 'WEATHER') { borderClass = 'border-blue-500'; icon = 'cloud'; }
        else if (d.delay_reason === 'TRAFFIC') { borderClass = 'border-amber-500'; icon = 'traffic'; }
        else if (d.delay_reason === 'MAINTENANCE') { borderClass = 'border-gray-500'; icon = 'build'; }
        else if (d.delay_reason === 'CONTROL') { borderClass = 'border-purple-500'; icon = 'hub'; }

        const card = document.createElement('div');
        card.className = `p-4 mb-4 bg-gray-800 border-l-4 ${borderClass} rounded shadow relative`;
        card.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined">${icon}</span>
                <span class="font-bold uppercase">${d.delay_reason}</span>
            </div>
            <div class="text-sm font-bold">${d.delay_minutes} MIN DELAY</div>
            <div class="text-xs text-gray-400">Node: ${d.node ? d.node.name : 'Unknown'} | Trip #${d.trip_id}</div>
            <div class="text-xs text-gray-500 mt-2">${fmtDateTime(new Date(d.event_time))}</div>
        `;
        container.appendChild(card);
    });
}

function renderBottleneck(reports, stats) {
    if (!reports || reports.length === 0 || !stats) return;

    const maxSev = stats.max_severity || 0;
    const e1 = document.getElementById('port-sat-pct'); if(e1) e1.textContent = maxSev.toFixed(1) + '%';
    const e2 = document.getElementById('port-sat-bar'); if(e2) e2.style.width = maxSev + '%';

    const transitPct = 100 - (stats.avg_congestion || 0);
    const e3 = document.getElementById('transit-pct'); if(e3) e3.textContent = transitPct.toFixed(1) + '%';
    const e4 = document.getElementById('transit-bar'); if(e4) e4.style.width = transitPct + '%';

    const onTimePct = stats.on_time_pct || 0;
    const e5 = document.getElementById('asset-util-pct'); if(e5) e5.textContent = onTimePct.toFixed(1) + '%';
    const e6 = document.getElementById('asset-util-bar'); if(e6) e6.style.width = onTimePct + '%';

    let impact = 'LOW';
    if (maxSev > 80) impact = 'HIGH';
    else if (maxSev > 50) impact = 'MEDIUM';
    
    const impEl = document.getElementById('impact-rating'); if(impEl) impEl.textContent = impact;
    const trustEl = document.getElementById('system-trust'); if(trustEl) trustEl.textContent = onTimePct.toFixed(0) + '%';
}

function renderStats(stats) {
    if (!stats) return;
    const eff = 100 - stats.avg_congestion;
    const lat = stats.avg_vehicle_count;
    const e1 = document.getElementById('route-efficiency'); if(e1) e1.textContent = eff.toFixed(1) + '%';
    const e2 = document.getElementById('network-latency'); if(e2) e2.textContent = lat.toFixed(0) + ' avg vehicles';
}

function renderLiveTracking(count) {
    const el = document.getElementById('live-asset-count');
    if (el) el.textContent = count === 0 ? '0 assets' : count + ' assets';
}

function updateConnectionBadge(status) {
    const badge = document.getElementById('data-source-badge');
    if (!badge) return;
    if (status === 'live') {
        badge.textContent = "LIVE DATA";
        badge.className = "text-[9px] font-bold uppercase tracking-widest border rounded-full px-3 py-1 font-mono text-green-400 border-green-400/30";
        badge.style = "";
    } else if (status === 'error') {
        badge.textContent = "OFFLINE";
        badge.className = "text-[9px] font-bold uppercase tracking-widest border rounded-full px-3 py-1 font-mono text-red-500 border-red-500/30";
        badge.style = "";
    } else if (status === 'connecting') {
        badge.textContent = "CONNECTING...";
        badge.className = "text-[9px] font-bold uppercase tracking-widest border rounded-full px-3 py-1 font-mono text-amber-500 border-amber-500/30";
        badge.style = "";
    }
}
