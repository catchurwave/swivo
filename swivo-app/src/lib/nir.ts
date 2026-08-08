/*
  NIR (Numéro Inscription au Répertoire) — alias numéro de sécu.
  Format : S YY MM DD CC NNN KK
    S    sexe (1 homme, 2 femme, 7/8 personne en cours d'identification)
    YY   année de naissance (2 chiffres)
    MM   mois de naissance (01-12 ; 20-42 pour 2A/2B Corse historique ; 50-99 spéciaux)
    DD   département (2 chiffres ; 97/98 DOM-TOM ; 99 étranger)
    CC   commune INSEE
    NNN  ordre dans la commune
    KK   clé de contrôle (mod 97 sur 13 chiffres)

  Source : code de la Sécurité sociale + INSEE.
*/

export type NirParsed = {
  raw: string;
  valid: boolean;
  sexe?: 'M' | 'Mme';
  anneeNaissance?: number;     // 4 chiffres reconstitués (1900/2000 selon plage)
  moisNaissance?: number;       // 1-12 si standard, undefined si valeur spéciale
  moisRaw: number;
  departementCode?: string;     // "75" / "971" / "2A" / "99"
  communeCode?: string;
  numeroOrdre?: string;
  cleControle?: number;
  pays?: 'FRA' | 'ETR';        // 99 = né à l'étranger
};

const RE = /^\s*([12378])\s?(\d{2})\s?(\d{2})\s?(\d{2}|2A|2B)\s?(\d{3})\s?(\d{3})\s?(\d{2})\s*$/i;

export function parseNir(raw: string): NirParsed {
  if (!raw) return { raw, valid: false, moisRaw: 0 };
  const cleaned = raw.replace(/\s/g, '').toUpperCase();
  const m = RE.exec(cleaned);
  if (!m) return { raw: cleaned, valid: false, moisRaw: 0 };

  const [, sexeS, yyS, mmS, deptS, comS, ordS, keyS] = m;
  const sexe = sexeS === '1' ? 'M' : sexeS === '2' ? 'Mme' : undefined;

  // Année : pas d'année référence dans NIR → tranche d'âge plausible.
  // Convention : >= 25 → 19XX, < 25 → 20XX (cohérent pour adultes en activité 2026).
  const yy = parseInt(yyS!, 10);
  const currentYy = new Date().getFullYear() % 100;
  const annee = yy > currentYy + 1 ? 1900 + yy : 2000 + yy;
  // Affinement : si annee donne > 110 ans, c'est 20XX, si < 14 ans, c'est 19XX
  let anneeNaissance = annee;
  const ageProbable = new Date().getFullYear() - anneeNaissance;
  if (ageProbable > 110) anneeNaissance += 100;
  if (ageProbable < 14)  anneeNaissance -= 100;

  const mmRaw = parseInt(mmS!, 10);
  const moisNaissance = mmRaw >= 1 && mmRaw <= 12 ? mmRaw : undefined;

  // Département : Corse spécial
  let departementCode: string | undefined = deptS;
  if (deptS === '2A' || deptS === '2B') departementCode = deptS;
  else if (deptS === '97' || deptS === '98') {
    // DOM-TOM : commune commence par chiffre département (971-976)
    const fullDept = '97' + (comS?.charAt(0) ?? '');
    departementCode = fullDept;
  } else if (deptS === '99') {
    departementCode = '99';
  }

  // Clé de contrôle
  const numericForKey = (sexeS! + yyS! + mmS!.replace('A', '0').replace('B', '0') + deptS!.replace('A', '0').replace('B', '0') + comS! + ordS!);
  let cleOk = false;
  try {
    let n = BigInt(numericForKey);
    // Bug spécial Corse : pour 2A on retire 1 000 000, pour 2B on retire 2 000 000.
    if (deptS === '2A') n = n - 1_000_000n;
    if (deptS === '2B') n = n - 2_000_000n;
    const expected = 97n - (n % 97n);
    cleOk = expected === BigInt(keyS!);
  } catch { cleOk = false; }

  return {
    raw: cleaned,
    valid: cleOk,
    sexe,
    anneeNaissance,
    moisNaissance,
    moisRaw: mmRaw,
    departementCode,
    communeCode: comS,
    numeroOrdre: ordS,
    cleControle: parseInt(keyS!, 10),
    pays: departementCode === '99' ? 'ETR' : 'FRA',
  };
}

/** Helper pour pré-remplir un Personne depuis un NIR validé. */
export function nirToPersonne(nir: string): {
  civilite?: 'M' | 'Mme';
  dateNaissance?: string;     // YYYY-MM-01 si jour inconnu
  paysNaissance?: string;
  departementNaissance?: string;
} | null {
  const p = parseNir(nir);
  if (!p.valid) return null;
  const date = p.anneeNaissance && p.moisNaissance
    ? `${p.anneeNaissance}-${String(p.moisNaissance).padStart(2, '0')}-01`
    : p.anneeNaissance
    ? `${p.anneeNaissance}-01-01`
    : undefined;
  return {
    civilite: p.sexe,
    dateNaissance: date,
    paysNaissance: p.pays === 'ETR' ? undefined : 'FRA',
    departementNaissance: p.departementCode,
  };
}
