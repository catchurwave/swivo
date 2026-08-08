function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
async function searchAddress(query, opts) {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=${(opts == null ? void 0 : opts.limit) ?? 6}&autocomplete=1`;
  try {
    const res = await fetch(url, { signal: opts == null ? void 0 : opts.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const feats = (data == null ? void 0 : data.features) ?? [];
    return feats.map((f) => {
      const p = f.properties ?? {};
      const num = String(p.housenumber ?? "").trim();
      const rawStreet = String(p.street ?? p.name ?? "").trim();
      const street = num ? rawStreet.replace(new RegExp(`^${escapeRegExp(num)}(?:\\s*(?:bis|ter|quater))?\\s+`, "i"), "").trim() : rawStreet;
      const voie = [num, street].filter(Boolean).join(" ").trim() || String(p.label ?? "").trim();
      return {
        voie,
        codePostal: String(p.postcode ?? ""),
        commune: String(p.city ?? ""),
        label: String(p.label ?? ""),
        type: p.type ?? "street",
        context: String(p.context ?? "")
      };
    });
  } catch {
    return [];
  }
}
export {
  searchAddress
};
