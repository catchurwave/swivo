/*
  Base Adresse Nationale (data.gouv.fr) — autocomplete adresses françaises.
  Pas de clé API, gratuit, limite raisonnable. Réponse GeoJSON.
*/

export type BanFeature = {
  voie: string;
  codePostal: string;
  commune: string;
  label: string;          // texte complet
  type: 'housenumber' | 'street' | 'locality' | 'municipality';
  context: string;        // "75, Paris, Île-de-France"
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function searchAddress(query: string, opts?: { limit?: number; signal?: AbortSignal }): Promise<BanFeature[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=${opts?.limit ?? 6}&autocomplete=1`;
  try {
    const res = await fetch(url, { signal: opts?.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const feats: any[] = data?.features ?? [];
    return feats.map((f) => {
      const p = f.properties ?? {};
      const num = String(p.housenumber ?? '').trim();
      const rawStreet = String(p.street ?? p.name ?? '').trim();
      // Strip any leading "<num> " or "<num>bis|ter " prefix from the street to
      // avoid duplicating the housenumber when BAN returns it inside `name`.
      const street = num
        ? rawStreet.replace(new RegExp(`^${escapeRegExp(num)}(?:\\s*(?:bis|ter|quater))?\\s+`, 'i'), '').trim()
        : rawStreet;
      const voie = [num, street].filter(Boolean).join(' ').trim() || String(p.label ?? '').trim();
      return {
        voie,
        codePostal: String(p.postcode ?? ''),
        commune: String(p.city ?? ''),
        label: String(p.label ?? ''),
        type: (p.type ?? 'street') as BanFeature['type'],
        context: String(p.context ?? ''),
      };
    });
  } catch {
    return [];
  }
}
