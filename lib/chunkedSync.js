export async function uploadItemsInChunks({ userId, items, upsert = true, chunkSize = 200, onProgress }) {
  let totalSynced = 0;

  for (let i = 0; i < items.length; i += chunkSize) {
    const batch = items.slice(i, i + chunkSize);
    if (onProgress) {
      onProgress(Math.min(i + batch.length, items.length), items.length);
    }

    const res = await fetch('/api/indibiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items: batch, upsert }),
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status} (${res.statusText})`;
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errJson.message || errMsg;
      } catch (_) {}
      throw new Error(`Gagal pada baris ${i + 1}-${i + batch.length}: ${errMsg}`);
    }

    totalSynced += batch.length;
  }

  return totalSynced;
}
