// js/render.js — All DOM update functions. No styling changes, only content.

// ── Utilities ────────────────────────────────────────────────────────────────

/** Returns a 3-letter node abbreviation derived from the node name. */
function nodeCode(name) {
  const MAP = {
    'Chennai International Airport': 'MAA', 'Delhi International Airport': 'DEL',
    'Dubai International Airport':   'DXB', 'Bangalore International Airport': 'BLR',
    'Frankfurt Airport':             'FRA', 'Tokyo Haneda Airport': 'HND',
    'Chennai Port':  'CHN', 'Singapore Port':  'SIN', 'Dubai Port': 'DXB',
    'Hamburg Port':  'HAM', 'Tokyo Port':       'TYO',
    'Chennai Central': 'MAS', 'Bangalore City Station': 'SBC',
    'Hyderabad Station': 'HYB', 'Tokyo Central Station': 'TYO'
  };
  if (MAP[name]) return MAP[name];
  const words = name.split(' ').filter(w => w.length > 2);
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase().substring(0, 3);
}

/** Short readable label for a node, without "International" / "Airport" etc. */
function nodeLabel(name) {
  return name
    .replace('International ', '')
    .replace(' Airport', ' Terminal')
    .replace(' Station', ' Station')
    .replace(' Port', ' Port');
}

/** Format a Date as "HH:MM" */
function fmtTime(d) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Format a Date as "DD MMM HH:MM" */
function fmtDateTime(str) {
  const d = new Date(str);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + fmtTime(d);
}

/** Calculate trip progress [0–100] pinned to 65% min for visual interest. */
function tripProgress(trip) {
  const dep  = new Date(trip.actual_departure || trip.scheduled_departure);
  const arr  = new Date(trip.scheduled_arrival);
  const span = arr - dep;
  if (span <= 0) return 65;
  // Use a simulated "now" at 65% through each trip so the bar is always interesting
  return Math.round(((span * 0.65) / span) * 100);
}

/** Countdown string from scheduled_arrival (shows time left). */
function timeRemaining(trip) {
  const arr = new Date(trip.scheduled_arrival);
  const dep = new Date(trip.actual_departure || trip.scheduled_departure);
  const span = arr - dep;
  const elapsed = span * 0.65; // matches tripProgress
  const left = span - elapsed;
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  return `${h}h ${String(m).padStart(2, '0')}m Remaining`;
}

/** Vehicle type → display label */
function vehicleTypeLabel(vtype) {
  return { AIRCRAFT: 'Aero-Stratosphere', SHIP: 'Oceanic Logistics', TRAIN: 'Rail Express' }[vtype] || vtype;
}

/** Vehicle type → energy label */
function energyLabel(vtype) {
  return { AIRCRAFT: 'JET PROPULSION', SHIP: 'MARINE DIESEL', TRAIN: 'ELECTRIC RAIL' }[vtype] || vtype;
}

/** Vehicle type → speed stat label */
function speedLabel(vtype, positions) {
  const pos = positions.find(p => true); // use first available
  if (!pos) return vtype === 'AIRCRAFT' ? 'MACH 0.85' : vtype === 'TRAIN' ? '300 KM/H' : '25 KNOTS';
  const spd = pos.speed;
  if (vtype === 'AIRCRAFT') return `${Math.round(spd)} KM/H`;
  if (vtype === 'SHIP')     return `${Math.round(spd)} KNOTS`;
  return `${Math.round(spd)} KM/H`;
}

/** Delay reason → { icon, colorClass, borderClass, severity, description } */
function delayMeta(reason, minutes, nodeName) {
  const nodeType = nodeName.includes('Airport') ? 'airspace' :
                   nodeName.includes('Port')    ? 'port sector' : 'rail corridor';
  const meta = {
    WEATHER:     { icon: 'cloud_queue',         border: 'border-[#ff716c]', text: 'text-[#ff716c]', bg: 'bg-[#ff716c]/10', severity: 'SEVERE',   desc: `Adverse meteorological conditions at ${nodeName}. All ${nodeType} assets on precautionary hold.` },
    TRAFFIC:     { icon: 'traffic',              border: 'border-[#8ff5ff]', text: 'text-[#8ff5ff]', bg: 'bg-[#8ff5ff]/5',  severity: 'HIGH',     desc: `Peak saturation detected in ${nodeName} ${nodeType}. Dynamic rerouting engaged.` },
    MAINTENANCE: { icon: 'build_circle',         border: 'border-[#ac89ff]', text: 'text-[#ac89ff]', bg: 'bg-[#ac89ff]/10', severity: 'ADVISORY', desc: `Scheduled maintenance window active at ${nodeName}. Processing capacity reduced by ~40%.` },
    CONTROL:     { icon: 'hub',                  border: 'border-[#6b9cff]', text: 'text-[#6b9cff]', bg: 'bg-[#6b9cff]/5',  severity: 'MINOR',    desc: `Temporary ATC/control hold issued for ${nodeName}. Minimal operational impact expected.` },
    UNKNOWN:     { icon: 'help_outline',         border: 'border-[#777575]', text: 'text-[#adaaaa]', bg: 'bg-white/5',       severity: 'UNKNOWN',  desc: `Unclassified event logged at ${nodeName}. Investigation in progress.` }
  };
  return meta[reason] || meta.UNKNOWN;
}

/** Animate a number from 0 to target in ~800ms. Preserves decimals automatically. */
function animateNumber(el, target, suffix = '') {
  const start    = performance.now();
  const duration = 800;
  const decimals = (String(target).split('.')[1] || '').length;
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    const value    = target * ease;
    el.textContent = value.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/** Fade an element in */
function fadeIn(el, delay = 0) {
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.5s ease';
  setTimeout(() => { el.style.opacity = '1'; }, delay);
}

/** Set text of element by ID (noop if not found) */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/** Set innerHTML of element by ID */
function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ── Section 2: Active Trajectory ─────────────────────────────────────────────
function renderTrajectory(trips) {
  // Pick first non-cancelled trip, prefer ones without actual_arrival (still active)
  const active = trips.find(t => t.trip_status !== 'CANCELLED' && !t.actual_arrival)
               || trips.find(t => t.trip_status !== 'CANCELLED')
               || trips[0];
  if (!active) return;

  const { route, vehicle, trip_status } = active;
  const origin = route.origin_node;
  const dest   = route.destination_node;
  const pct    = tripProgress(active);

  // Mission label
  setText('mission-label',
    `Mission ID: OC-${String(active.trip_id).padStart(4, '0')} | ${origin.country} → ${dest.country} | ${route.route_type} · ${route.distance_km.toLocaleString()} KM`
  );

  // Time remaining
  setText('time-remaining', timeRemaining(active));

  // Origin / destination
  setText('origin-code', nodeCode(origin.name));
  setText('origin-name', nodeLabel(origin.name));
  setText('dest-code', nodeCode(dest.name));
  setText('dest-name', nodeLabel(dest.name));

  // Progress bar + plane icon
  const bar  = document.getElementById('trip-progress');
  const plane = document.getElementById('plane-icon');
  if (bar) {
    bar.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
    bar.style.width = pct + '%';
  }
  if (plane) {
    plane.style.transition = 'left 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
    plane.style.left = pct + '%';
  }

  // Status badge
  const badge = document.getElementById('trip-status-badge');
  if (badge) {
    badge.textContent = trip_status === 'ON_TIME' ? 'On-Time' : trip_status;
    badge.className = badge.className.replace(/bg-\S+\/\d+\s*text-\S+/g, '');
    if (trip_status === 'ON_TIME') {
      badge.style.cssText = 'background:rgba(34,197,94,0.2);color:#4ade80';
    } else if (trip_status === 'DELAYED') {
      badge.style.cssText = 'background:rgba(255,113,108,0.2);color:#ff716c';
    } else {
      badge.style.cssText = 'background:rgba(119,117,117,0.2);color:#adaaaa';
    }
  }

  // Speed badge
  const dep = new Date(active.actual_departure || active.scheduled_departure);
  const arr = new Date(active.scheduled_arrival);
  const durationHrs = (arr - dep) / 3_600_000;
  const speedKmh = Math.round(route.distance_km / durationHrs);
  const speedLabel = vehicle.vehicle_type === 'AIRCRAFT'
    ? `MACH ${(speedKmh / 1235).toFixed(2)}`
    : vehicle.vehicle_type === 'SHIP' ? `${Math.round(speedKmh * 0.54)} KN`
    : `${speedKmh} KM/H`;
  setText('trip-speed', speedLabel);

  // Stat boxes
  const depDate = new Date(active.actual_departure || active.scheduled_departure);
  const arrDate = new Date(active.scheduled_arrival);
  setHTML('stat-departure', `${fmtTime(depDate)} <span style="font-size:0.75rem;color:#6b7280">${depDate.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>`);
  setHTML('stat-arrival',   `${fmtTime(arrDate)} <span style="font-size:0.75rem;color:#6b7280">${arrDate.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>`);
  setText('stat-carrier',   vehicle.carrier.name.toUpperCase());
  setText('stat-vehicle',   `${vehicle.model_name} · ${vehicle.reg_number}`);

  // Fade in the whole section panel
  const panel = document.getElementById('trajectory-panel');
  if (panel) fadeIn(panel, 100);
}

// ── Section 3: Elite Fleet ────────────────────────────────────────────────────
function renderFleet(vehicles) {
  const aircraft = vehicles.filter(v => v.vehicle_type === 'AIRCRAFT');
  const ships    = vehicles.filter(v => v.vehicle_type === 'SHIP');

  if (aircraft.length) {
    const a = aircraft[0];
    setText('fleet-air-label', vehicleTypeLabel(a.vehicle_type) + ' · ' + a.carrier.country_code);
    setText('fleet-air-name',  a.model_name.toUpperCase());
    setText('fleet-air-s1',    a.carrier.name.toUpperCase());
    setText('fleet-air-s2',    a.reg_number);
  }

  if (ships.length) {
    const s = ships[0];
    setText('fleet-sea-label', vehicleTypeLabel(s.vehicle_type) + ' · ' + s.carrier.country_code);
    setText('fleet-sea-name',  s.model_name.toUpperCase());
    setText('fleet-sea-s1',    s.carrier.name.toUpperCase());
    setText('fleet-sea-s2',    s.reg_number);
  }
}

// ── Section 4: Global Neural Grid stats ───────────────────────────────────────
function renderNetworkStats(congestion, trips) {
  if (!congestion.length) return;
  const avgCongestion = congestion.reduce((s, c) => s + c.congestion_level, 0) / congestion.length;
  const efficiency = (100 - avgCongestion).toFixed(1);
  const onTime = trips.filter(t => t.trip_status === 'ON_TIME').length;
  const totalTrips = trips.length;
  const trustScore = ((onTime / totalTrips) * 100).toFixed(1);

  const effEl = document.getElementById('route-efficiency');
  if (effEl) animateNumber(effEl, parseFloat(efficiency), '%');

  // Network latency derived from avg vehicle count as a pseudo-metric
  const avgVehicles = Math.round(congestion.reduce((s, c) => s + c.vehicle_count, 0) / congestion.length);
  const latency = Math.max(12, Math.round(avgVehicles / 4));
  const latEl = document.getElementById('network-latency');
  if (latEl) animateNumber(latEl, latency, 'ms');
}

// ── Section 6: Node Intelligence — Velocity Bars ──────────────────────────────
function renderCongestion(congestion) {
  const container = document.getElementById('velocity-bars');
  if (!container) return;

  // Use the most recent 6 records
  const recent = congestion.slice(-6);
  container.innerHTML = recent.map(c => {
    const h = c.congestion_level;
    // Color by level
    let color = '#8ff5ff';       // primary — low
    if (h > 65) color = '#ff716c'; // error  — high
    else if (h > 45) color = '#f59e0b'; // amber — medium
    const opacity = 0.4 + (h / 100) * 0.6;
    return `
      <div class="flex-1 flex flex-col items-center gap-1 group/bar cursor-pointer relative">
        <div class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity
                    bg-surface-container-high border border-white/10 rounded px-2 py-1 text-[9px] text-nowrap z-10"
             style="white-space:nowrap">
          <span style="color:${color}">${h}%</span> · ${c.avg_speed} km/h · ${c.vehicle_count} vehicles
        </div>
        <div class="w-full rounded-t-sm transition-all duration-700"
             style="height:${h}%;background:${color};opacity:${opacity};min-height:4px"></div>
        <span class="text-[8px] text-slate-600 uppercase tracking-widest mt-1">${(c.segment?.region || 'N/A').substring(0, 5)}</span>
      </div>`;
  }).join('');
}

// ── Section 8: Critical Alerts ────────────────────────────────────────────────
function renderAlerts(delays) {
  const container = document.getElementById('alerts-container');
  if (!container || !delays.length) return;

  container.innerHTML = delays.map((d, i) => {
    const meta = delayMeta(d.delay_reason, d.delay_minutes, d.node?.name || 'Unknown Node');
    const nodeName = d.node?.name || 'Unknown Node';
    const code = nodeCode(nodeName);
    const ts = fmtDateTime(d.event_time);
    const btnLabel = d.delay_reason === 'WEATHER'  ? 'View Mitigation Plan'
                   : d.delay_reason === 'TRAFFIC'  ? 'Optimize Stream'
                   : d.delay_reason === 'MAINTENANCE' ? 'Schedule Window'
                   : 'Full Status';

    return `
      <div class="p-6 bg-surface-container-high border-l-4 ${meta.border} rounded-r-lg shadow-xl shadow-black relative overflow-hidden group"
           style="opacity:0;transform:translateY(12px);transition:opacity 0.4s ease ${i * 80}ms,transform 0.4s ease ${i * 80}ms"
           data-delay-id="${d.delay_id}">
        <div class="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-2xl"
             style="background:${meta.border.replace('border-[','').replace(']','')};opacity:0.05"></div>
        <div class="flex justify-between items-start mb-4">
          <span class="material-symbols-outlined ${meta.text} text-3xl">${meta.icon}</span>
          <div class="text-right">
            <span class="text-[10px] text-slate-500 font-bold uppercase">${meta.severity}</span>
            <div class="text-[9px] text-slate-600 mt-1">Trip #${d.trip_id} · ${ts}</div>
          </div>
        </div>
        <h3 class="font-headline font-bold text-xl mb-2">${d.delay_reason}: ${code}</h3>
        <p class="text-sm text-slate-400 mb-4">${meta.desc}</p>
        <div class="flex items-center justify-between">
          <div class="flex gap-3 text-[10px] text-slate-500 font-mono">
            <span class="${meta.text} font-bold">${d.delay_minutes} MIN</span>
            <span>·</span>
            <span>${d.node?.country || ''}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  // Trigger animation after paint
  requestAnimationFrame(() => {
    container.querySelectorAll('[data-delay-id]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  });
}

// ── Section 9: Live Tracking — Asset Count ────────────────────────────────────
function renderPositions(positions) {
  const uniqueTrips = new Set(positions.map(p => p.trip_id)).size;
  const countEl = document.getElementById('live-asset-count');
  if (countEl) {
    const base = uniqueTrips * 1000 + Math.floor(Math.random() * 500 + 200);
    animateNumber(countEl, base, ' Assets');
    countEl.dataset.liveBase = base;
  }
  // Pulse the live indicator dot
  const dot = document.getElementById('live-dot');
  if (dot) dot.style.animationDuration = '1s';
}

/** Call periodically to simulate ticker movement in the live count */
function tickPositions() {
  const countEl = document.getElementById('live-asset-count');
  if (!countEl || !countEl.dataset.liveBase) return;
  const base = parseInt(countEl.dataset.liveBase, 10);
  const delta = Math.floor(Math.random() * 20) - 8; // ±8
  const next = base + delta;
  countEl.dataset.liveBase = next;
  countEl.textContent = `${next.toLocaleString()} Assets`;
}

// ── Section 10: Bottleneck Analytics ─────────────────────────────────────────
function renderBottlenecks(bottlenecks, trips, congestion) {
  if (!bottlenecks.length) return;

  // Port saturation = max severity_score across bottleneck reports
  const portSat = Math.round(Math.max(...bottlenecks.map(b => b.severity_score)));

  // Transit throughput = inverse of avg congestion level
  const avgCong = congestion.length
    ? Math.round(congestion.reduce((s, c) => s + c.congestion_level, 0) / congestion.length)
    : 45;
  const transitPct = 100 - avgCong;

  // Asset utilization = ON_TIME / total trips
  const onTime = trips.filter(t => t.trip_status === 'ON_TIME').length;
  const assetUtil = trips.length ? Math.round((onTime / trips.length) * 100) : 50;

  // Impact rating
  const impactRating = portSat > 80 ? 'HIGH' : portSat > 60 ? 'MEDIUM' : 'LOW';
  const systemTrust = ((onTime / Math.max(trips.length, 1)) * 100).toFixed(1);

  // Animate bars
  function setBar(pctId, barId, value) {
    const pctEl = document.getElementById(pctId);
    const barEl = document.getElementById(barId);
    if (pctEl) {
      pctEl.textContent = '0%';
      animateNumber(pctEl, value, '%');
    }
    if (barEl) {
      barEl.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
      barEl.style.width = value + '%';
    }
  }

  setBar('port-sat-pct',    'port-sat-bar',    portSat);
  setBar('transit-pct',     'transit-bar',     transitPct);
  setBar('asset-util-pct',  'asset-util-bar',  assetUtil);

  setText('impact-rating', impactRating);

  const trustEl = document.getElementById('system-trust');
  if (trustEl) {
    trustEl.textContent = '0%';
    setTimeout(() => { trustEl.textContent = systemTrust + '%'; }, 900);
  }
}

// ── Data-source badge ─────────────────────────────────────────────────────────
function renderSourceBadge(source) {
  const badge = document.getElementById('data-source-badge');
  if (!badge) return;
  if (source === 'api') {
    badge.textContent  = 'LIVE · API';
    badge.style.color  = '#4ade80';
    badge.style.borderColor = 'rgba(74,222,128,0.3)';
  } else {
    badge.textContent  = 'OFFLINE · MOCK DATA';
    badge.style.color  = '#f59e0b';
    badge.style.borderColor = 'rgba(245,158,11,0.3)';
  }
}

// ── Loading skeleton helpers ──────────────────────────────────────────────────
function showSkeleton(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.dataset.realContent = el.innerHTML;
  el.classList.add('animate-pulse');
  el.style.opacity = '0.4';
}

function hideSkeleton(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('animate-pulse');
  el.style.opacity = '1';
}
