/*
  Recherche d'entreprises française via l'API publique
  recherche-entreprises.api.gouv.fr (sans clé, gratuite, données SIRENE).
  Sources : INSEE SIRENE, RNE, RNA.
*/

export type EntrepriseResult = {
  siren: string;
  siret: string;
  denomination: string;
  nomComplet?: string;
  formeJuridique?: string;
  naf?: string;
  libelleNaf?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  trancheEffectif?: string;
  dateCreation?: string;
  estActive: boolean;
};

const BASE = 'https://recherche-entreprises.api.gouv.fr/search';

export async function searchEntreprise(query: string, opts?: { limit?: number; signal?: AbortSignal }): Promise<EntrepriseResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const limit = opts?.limit ?? 6;
  const url = `${BASE}?q=${encodeURIComponent(q)}&per_page=${limit}&page=1`;
  try {
    const res = await fetch(url, { signal: opts?.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const results: any[] = data?.results ?? [];
    return results.map(mapResult).filter(Boolean) as EntrepriseResult[];
  } catch { return []; }
}

/** Recherche directe par SIREN (9 chiffres) ou SIRET (14). */
export async function lookupSirenOrSiret(siren: string): Promise<EntrepriseResult | null> {
  const cleaned = siren.replace(/\s/g, '');
  if (cleaned.length !== 9 && cleaned.length !== 14) return null;
  const results = await searchEntreprise(cleaned, { limit: 1 });
  return results[0] ?? null;
}

function mapResult(r: any): EntrepriseResult | null {
  if (!r?.siren) return null;
  const siege = r.siege ?? {};
  return {
    siren: String(r.siren),
    siret: String(siege.siret ?? r.siren + '00000'),
    denomination: r.nom_raison_sociale || r.nom_complet || '—',
    nomComplet: r.nom_complet,
    formeJuridique: r.nature_juridique || undefined,
    naf: r.activite_principale || undefined,
    libelleNaf: r.libelle_activite_principale || undefined,
    adresse: [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean).join(' ') || siege.geo_adresse || undefined,
    codePostal: siege.code_postal || undefined,
    ville: siege.libelle_commune || undefined,
    trancheEffectif: siege.tranche_effectif_salarie || undefined,
    dateCreation: r.date_creation || undefined,
    estActive: r.etat_administratif === 'A',
  };
}
