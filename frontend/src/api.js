async function getJson(path, signal) {
  const res = await fetch(path, { signal });
  if (!res.ok) {
    throw new Error(`${path} isteği başarısız oldu (${res.status})`);
  }
  return res.json();
}

export async function fetchDemoData(signal) {
  const [health, summary] = await Promise.all([
    getJson('/api/health', signal),
    getJson('/api/demo/summary', signal),
  ]);
  return { health, summary };
}
