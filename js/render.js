export function updateConnectionBadge(status) {
  const badge = document.getElementById('data-source-badge');
  if (!badge) return;
  if (status === 'live') {
    badge.textContent = 'LIVE DATA';
    badge.style.color = '#22c55e';
    badge.style.borderColor = 'rgba(34,197,94,0.4)';
  } else if (status === 'error') {
    badge.textContent = 'OFFLINE';
    badge.style.color = '#ef4444';
    badge.style.borderColor = 'rgba(239,68,68,0.4)';
  } else {
    badge.textContent = 'CONNECTING…';
    badge.style.color = '#f59e0b';
    badge.style.borderColor = 'rgba(245,158,11,0.3)';
  }
}

export function renderTrajectory(trips) {
  if (!trips || trips.length === 0) return;

  // Pick the most recently departed trip that is not cancelled
  const active = trips
    .filter(t => t.actual_departure && t.trip_status !== 'CANCELLED')
    .sort((a, b) => new Date(b.actual_departure) - new Date(a.actual_departure))[0];

  if (!active) return;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  // Origin / Destination codes (3-char IATA style)
  setEl('origin-code', active.origin_name.slice(0, 3).toUpperCase());
  setEl('origin-name', `${active.origin_name} · ${active.origin_country}`);
  setEl('dest-code', active.dest_name.slice(0, 3).toUpperCase());
  setEl('dest-name', `${active.dest_name} · ${active.dest_country}`);

  // Mission label
  setEl('mission-label', `Trip #${active.trip_id} · ${active.origin_name} → ${active.dest_name}`);

  // Status badge
  const badge = document.getElementById('trip-status-badge');
  if (badge) {
    badge.textContent = active.trip_status.replace('_', ' ');
    badge.className = 'px-2 py-0.5 text-[10px] font-bold rounded uppercase ';
    if (active.trip_status === 'ON_TIME')   badge.className += 'bg-green-500/20 text-green-400';
    else if (active.trip_status === 'DELAYED') badge.className += 'bg-amber-500/20 text-amber-400';
    else                                     badge.className += 'bg-red-500/20 text-red-400';
  }

  // Progress
  const dep  = new Date(active.actual_departure);
  const arr  = new Date(active.scheduled_arrival);
  const now  = active.actual_arrival ? new Date(active.actual_arrival) : new Date();
  const totalMs = arr - dep;
  const pct = totalMs > 0 ? Math.min(100, Math.max(0, ((now - dep) / totalMs) * 100)) : 0;

  const bar  = document.getElementById('trip-progress');
  const icon = document.getElementById('plane-icon');
  if (bar)  bar.style.width  = pct + '%';
  if (icon) icon.style.left  = pct + '%';

  // Time remaining
  const msLeft = arr - new Date();
  let timeStr;
  if (active.actual_arrival) {
    timeStr = 'Arrived';
  } else if (msLeft <= 0) {
    timeStr = 'Overdue';
  } else {
    const h = Math.floor(msLeft / 3600000);
    const m = Math.floor((msLeft % 3600000) / 60000);
    timeStr = h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
  }
  setEl('time-remaining', timeStr);

  // Stats panel
  setEl('stat-departure', formatDate(active.actual_departure));
  setEl('stat-arrival',   formatDate(active.scheduled_arrival));
  setEl('stat-carrier',   active.carrier_name);
  setEl('stat-vehicle',   `${active.model_name} (${active.reg_number})`);

  // Speed (distance / duration)
  const durationHrs = (arr - dep) / 3600000;
  const speed = durationHrs > 0 ? Math.round(active.distance_km / durationHrs) : 0;
  setEl('trip-speed', speed > 0 ? `${speed} km/h` : '—');
}

export function renderFleet(vehicles) {
  if (!vehicles || vehicles.length === 0) return;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  const aircraft = vehicles.find(v => v.vehicle_type === 'AIRCRAFT');
  const ship     = vehicles.find(v => v.vehicle_type === 'SHIP');

  if (aircraft) {
    setEl('fleet-air-label', `AIRCRAFT · ${aircraft.country_code}`);
    setEl('fleet-air-name',  aircraft.model_name);
    setEl('fleet-air-s1',    aircraft.carrier_name);
    setEl('fleet-air-s2',    aircraft.reg_number);
  }
  if (ship) {
    setEl('fleet-sea-label', `SHIP · ${ship.country_code}`);
    setEl('fleet-sea-name',  ship.model_name);
    setEl('fleet-sea-s1',    ship.carrier_name);
    setEl('fleet-sea-s2',    ship.reg_number);
  }
}

export function renderCongestion(records) {
  const container = document.getElementById('velocity-bars');
  if (!container || !records) return;
  container.innerHTML = '';
  records.forEach(r => {
    const lvl = r.congestion_level;
    let color = 'bg-green-500';
    if (lvl > 70) color = 'bg-red-500';
    else if (lvl > 40) color = 'bg-amber-500';
    const bar = document.createElement('div');
    bar.className = `w-full ${color} rounded-t-sm transition-all duration-700`;
    bar.style.height = Math.max(4, lvl) + '%';
    bar.title = `${r.segment_name}: ${lvl}%`;
    container.appendChild(bar);
  });
}

export function renderDelays(delays) {
  const container = document.getElementById('alerts-container');
  if (!container) return;
  container.innerHTML = '';

  if (!delays || delays.length === 0) {
    container.innerHTML = '<div class="col-span-3 text-center text-slate-500 py-12 font-label uppercase tracking-widest text-sm">No active delay alerts</div>';
    return;
  }

  const reasonConfig = {
    WEATHER:     { color: 'border-blue-500',   icon: 'thunderstorm',    text: 'text-blue-400' },
    TRAFFIC:     { color: 'border-amber-500',   icon: 'traffic',         text: 'text-amber-400' },
    MAINTENANCE: { color: 'border-slate-400',   icon: 'build',           text: 'text-slate-400' },
    CONTROL:     { color: 'border-purple-500',  icon: 'manage_accounts', text: 'text-purple-400' },
    UNKNOWN:     { color: 'border-red-500',     icon: 'help',            text: 'text-red-400' },
  };

  delays.forEach(d => {
    const cfg = reasonConfig[d.delay_reason] || reasonConfig.UNKNOWN;
    const card = document.createElement('div');
    card.className = `p-6 bg-surface-container-high border-l-4 ${cfg.color} rounded-r-lg`;
    card.innerHTML = `
      <span class="material-symbols-outlined ${cfg.text} text-3xl mb-4 block">${cfg.icon}</span>
      <h4 class="font-headline font-bold text-white text-lg mb-1">${d.delay_reason.replace('_', ' ')}</h4>
      <p class="text-slate-400 text-sm mb-3">${d.node_name} · ${d.node_country}</p>
      <div class="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
        <span class="text-red-400">+${d.delay_minutes} min</span>
        <span class="text-slate-500">Trip #${d.trip_id}</span>
        <span class="text-slate-600">${formatDate(d.event_time)}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

export function renderBottleneck(reports, stats) {
  const setEl  = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setBar = (id, pct) => { const el = document.getElementById(id); if (el) el.style.width = Math.min(100, pct) + '%'; };

  const maxSev = stats.max_severity || 0;
  const transitPct = Math.max(0, 100 - stats.avg_congestion);
  const utilPct = stats.on_time_pct;

  setEl('port-sat-pct',   maxSev.toFixed(1) + '%');
  setBar('port-sat-bar',   maxSev);
  setEl('transit-pct',    transitPct.toFixed(1) + '%');
  setBar('transit-bar',    transitPct);
  setEl('asset-util-pct', utilPct.toFixed(1) + '%');
  setBar('asset-util-bar', utilPct);

  setEl('impact-rating', maxSev > 80 ? 'HIGH' : maxSev > 50 ? 'MEDIUM' : 'LOW');
  setEl('system-trust',  utilPct.toFixed(0) + '%');
}

export function renderStats(stats) {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('route-efficiency', (100 - stats.avg_congestion).toFixed(1) + '%');
  setEl('network-latency',  stats.avg_vehicle_count.toFixed(0) + ' avg vehicles/segment');
  setEl('total-routes',   stats.total_routes);
  setEl('total-vehicles', stats.total_vehicles);
  setEl('total-nodes',    stats.total_nodes);
}

export function renderLiveTracking(data) {
  const el = document.getElementById('live-asset-count');
  if (el) el.textContent = (data.active_assets || 0) + ' assets';
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}
