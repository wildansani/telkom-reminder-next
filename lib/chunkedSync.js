export async function uploadItemsInChunks({
  userId,
  items,
  upsert = true,
  chunkSize = 200,
  onProgress,
  onError,
}) {
  if (!Array.isArray(items) || items.length === 0) return 0;

  let totalSynced = 0;
  const total = items.length;

  for (let i = 0; i < total; i += chunkSize) {
    const batch = items.slice(i, i + chunkSize);

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
      if (onError) onError({ batchIndex: i, batchSize: batch.length, error: errMsg });
      throw new Error(`Gagal pada baris ${i + 1}-${i + batch.length}: ${errMsg}`);
    }

    totalSynced += batch.length;
    if (onProgress) onProgress(totalSynced, total);
  }

  return totalSynced;
}
