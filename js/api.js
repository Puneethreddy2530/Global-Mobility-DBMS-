const BASE = 'http://localhost:8000/api';

async function apiFetch(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export async function fetchTrips()         { return apiFetch('/trips'); }
export async function fetchVehicles()      { return apiFetch('/vehicles'); }
export async function fetchCongestion()    { return apiFetch('/congestion'); }
export async function fetchDelays()        { return apiFetch('/delays'); }
export async function fetchBottleneck()    { return apiFetch('/bottleneck'); }
export async function fetchPositionCount() { return apiFetch('/position'); }
export async function fetchStats()         { return apiFetch('/stats'); }
