/*
  URSSAF micro-entrepreneur — taux, plafonds et calculs 2026.
  Sources : URSSAF.fr, BOSS, Code de la Sécurité sociale (L613-7), Loi de finances 2026.
*/

export type CategorieMicro =
  | 'vente_bic'          // achat-revente, restauration sur place
  | 'service_bic'        // prestations services commerciales
  | 'service_bnc'        // libéral non réglementé (consulting, dev, design…)
  | 'liberal_cipav';     // libéral réglementé affilié CIPAV

export type RegimeDeclaration = 'mensuel' | 'trimestriel';

/* ============================================================ */
/* TAUX 2026                                                     */
/* ============================================================ */

/** Cotisations URSSAF (Sécurité sociale + retraite + CSG/CRDS). */
export const COTISATION_RATE: Record<CategorieMicro, number> = {
  vente_bic:     0.123,  // 12,3 %
  service_bic:   0.212,  // 21,2 %
  service_bnc:   0.211,  // 21,1 %
  liberal_cipav: 0.232,  // 23,2 %
};

/** Contribution à la formation professionnelle (CFP). */
export const CFP_RATE: Record<CategorieMicro, number> = {
  vente_bic:     0.001,  // commerçants : 0,1 %
  service_bic:   0.003,  // artisans : 0,3 %
  service_bnc:   0.002,  // libéraux : 0,2 %
  liberal_cipav: 0.002,
};

/** Versement libératoire IR (optionnel, sous conditions RFR). */
export const VERSEMENT_LIBERATOIRE_RATE: Record<CategorieMicro, number> = {
  vente_bic:     0.01,   // 1 %
  service_bic:   0.017,  // 1,7 %
  service_bnc:   0.022,  // 2,2 %
  liberal_cipav: 0.022,  // 2,2 %
};

/** Taxe pour frais de chambre (CCI / CMA), à part de la CFP. */
export const TAXE_CHAMBRE_RATE: Record<CategorieMicro, number> = {
  vente_bic:     0.0015, // 0,15 % CCI
  service_bic:   0.0044, // 0,44 % CMA artisans prestations
  service_bnc:   0,
  liberal_cipav: 0,
};

/** Plafonds annuels de CA pour bénéficier du régime micro. */
export const PLAFOND_CA: Record<CategorieMicro, number> = {
  vente_bic:     188_700,
  service_bic:   77_700,
  service_bnc:   77_700,
  liberal_cipav: 77_700,
};

/** Seuils de franchise TVA (basique). Au-delà : passage au réel. */
export const SEUIL_TVA_BASIQUE: Record<CategorieMicro, number> = {
  vente_bic:     85_000,
  service_bic:   37_500,
  service_bnc:   37_500,
  liberal_cipav: 37_500,
};

/** Seuils de franchise TVA majorée (tolérance). */
export const SEUIL_TVA_MAJOREE: Record<CategorieMicro, number> = {
  vente_bic:     93_500,
  service_bic:   41_250,
  service_bnc:   41_250,
  liberal_cipav: 41_250,
};

/** Abattement forfaitaire pour calcul du revenu net imposable. */
export const ABATTEMENT_IR: Record<CategorieMicro, number> = {
  vente_bic:     0.71,   // 71 %
  service_bic:   0.50,   // 50 %
  service_bnc:   0.34,   // 34 %
  liberal_cipav: 0.34,
};

export const ACRE_REDUCTION = 0.5; // 50 % d'exonération URSSAF la 1ère année

/* ============================================================ */
/* CALCULS                                                       */
/* ============================================================ */

export type CotisationBreakdown = {
  urssaf: number;           // cotisations sociales hors CFP/taxe chambre
  cfp: number;
  taxeChambre: number;
  versementLiberatoire: number;
  totalCharges: number;     // somme à payer URSSAF
  netRestant: number;       // CA - totalCharges
  taux: {
    urssaf: number;
    cfp: number;
    taxeChambre: number;
    versementLiberatoire: number;
    effectif: number;       // totalCharges / CA
  };
};

export type CalculOpts = {
  acreActive?: boolean;
  versementLiberatoire?: boolean;
};

export function calculerCotisations(
  ca: number,
  categorie: CategorieMicro,
  opts: CalculOpts = {},
): CotisationBreakdown {
  if (ca <= 0) return zero();

  const tauxUrssafBase = COTISATION_RATE[categorie];
  const tauxUrssaf = opts.acreActive ? tauxUrssafBase * (1 - ACRE_REDUCTION) : tauxUrssafBase;
  const tauxCfp = CFP_RATE[categorie];
  const tauxTaxe = TAXE_CHAMBRE_RATE[categorie];
  const tauxVL = opts.versementLiberatoire ? VERSEMENT_LIBERATOIRE_RATE[categorie] : 0;

  const urssaf = round2(ca * tauxUrssaf);
  const cfp = round2(ca * tauxCfp);
  const taxeChambre = round2(ca * tauxTaxe);
  const versementLiberatoire = round2(ca * tauxVL);
  const totalCharges = round2(urssaf + cfp + taxeChambre + versementLiberatoire);
  const netRestant = round2(ca - totalCharges);

  return {
    urssaf, cfp, taxeChambre, versementLiberatoire,
    totalCharges, netRestant,
    taux: {
      urssaf: tauxUrssaf,
      cfp: tauxCfp,
      taxeChambre: tauxTaxe,
      versementLiberatoire: tauxVL,
      effectif: ca > 0 ? totalCharges / ca : 0,
    },
  };
}

export function revenuNetImposable(ca: number, categorie: CategorieMicro): number {
  const abat = ABATTEMENT_IR[categorie];
  return round2(ca * (1 - abat));
}

/* ============================================================ */
/* PLAFONDS / SEUILS — ALERTES                                   */
/* ============================================================ */

export type AlertePlafond = {
  niveau: 'info' | 'warning' | 'critical';
  code: 'tva_basique' | 'tva_majoree' | 'plafond_micro';
  message: string;
  pct: number;            // % du seuil consommé
  restant: number;
};

export function alertesPlafonds(caAnnuel: number, categorie: CategorieMicro): AlertePlafond[] {
  const out: AlertePlafond[] = [];

  const tvaBase = SEUIL_TVA_BASIQUE[categorie];
  const tvaMaj = SEUIL_TVA_MAJOREE[categorie];
  const plafond = PLAFOND_CA[categorie];

  const pctTvaBase = caAnnuel / tvaBase;
  const pctTvaMaj = caAnnuel / tvaMaj;
  const pctPlafond = caAnnuel / plafond;

  if (pctTvaBase >= 1) {
    out.push({
      niveau: pctTvaMaj >= 1 ? 'critical' : 'warning',
      code: 'tva_basique',
      message: `Seuil de franchise TVA dépassé (${formatEUR(tvaBase)}). Vous devez facturer la TVA dès le 1er jour du mois suivant.`,
      pct: pctTvaBase,
      restant: 0,
    });
  } else if (pctTvaBase >= 0.85) {
    out.push({
      niveau: 'warning',
      code: 'tva_basique',
      message: `Seuil TVA proche (${Math.round(pctTvaBase * 100)} % de ${formatEUR(tvaBase)}).`,
      pct: pctTvaBase,
      restant: round2(tvaBase - caAnnuel),
    });
  }

  if (pctTvaMaj >= 1) {
    out.push({
      niveau: 'critical',
      code: 'tva_majoree',
      message: `Seuil de tolérance TVA dépassé (${formatEUR(tvaMaj)}). Assujettissement immédiat.`,
      pct: pctTvaMaj,
      restant: 0,
    });
  }

  if (pctPlafond >= 1) {
    out.push({
      niveau: 'critical',
      code: 'plafond_micro',
      message: `Plafond de chiffre d'affaires micro dépassé (${formatEUR(plafond)}). Sortie du régime micro l'année suivante.`,
      pct: pctPlafond,
      restant: 0,
    });
  } else if (pctPlafond >= 0.8) {
    out.push({
      niveau: 'warning',
      code: 'plafond_micro',
      message: `Plafond micro proche (${Math.round(pctPlafond * 100)} %).`,
      pct: pctPlafond,
      restant: round2(plafond - caAnnuel),
    });
  }

  return out;
}

/* ============================================================ */
/* ÉCHÉANCES                                                     */
/* ============================================================ */

export type Echeance = {
  date: string;            // ISO YYYY-MM-DD
  label: string;
  type: 'urssaf' | 'tva' | 'cfe' | 'declaration_revenus';
  periode?: string;
};

/**
 * Génère les échéances URSSAF micro pour les `monthsAhead` prochains mois,
 * selon le régime (mensuel : le dernier jour du mois suivant la période ;
 * trimestriel : 30 avril / 31 juillet / 31 octobre / 31 janvier).
 */
export function prochainesEcheancesURSSAF(regime: RegimeDeclaration, monthsAhead = 6, ref: Date = new Date()): Echeance[] {
  const out: Echeance[] = [];
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  if (regime === 'mensuel') {
    for (let i = 1; i <= monthsAhead; i++) {
      // Déclaration du mois M payée le dernier jour du mois M+1.
      const periodDate = new Date(start.getFullYear(), start.getMonth() + (i - 1), 1);
      const dueDate = new Date(start.getFullYear(), start.getMonth() + i + 1, 0); // dernier jour M+1
      out.push({
        date: dueDate.toISOString().slice(0, 10),
        label: `Déclaration URSSAF — ${monthLabel(periodDate)}`,
        type: 'urssaf',
        periode: `${periodDate.getFullYear()}-${pad(periodDate.getMonth() + 1)}`,
      });
    }
  } else {
    const quarters = [
      { month: 0, day: 31, label: 'T4 N-1' },
      { month: 3, day: 30, label: 'T1' },
      { month: 6, day: 31, label: 'T2' },
      { month: 9, day: 31, label: 'T3' },
    ];
    const today = ref;
    for (let y = today.getFullYear(); y <= today.getFullYear() + 1; y++) {
      for (const q of quarters) {
        const dueDate = new Date(y, q.month, q.day);
        if (dueDate >= today && out.length < monthsAhead) {
          out.push({
            date: dueDate.toISOString().slice(0, 10),
            label: `Déclaration URSSAF — ${q.label} ${y}`,
            type: 'urssaf',
            periode: `${y}-${q.label}`,
          });
        }
      }
    }
  }
  return out.slice(0, monthsAhead);
}

/* ============================================================ */
/* HELPERS                                                       */
/* ============================================================ */

export const CATEGORIE_LABEL: Record<CategorieMicro, string> = {
  vente_bic:     'Vente de marchandises (BIC)',
  service_bic:   'Prestation de services BIC',
  service_bnc:   'Libéral non réglementé (BNC)',
  liberal_cipav: 'Libéral réglementé CIPAV',
};

export function formatEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export function formatPct(n: number, digits = 1): string {
  return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: digits }).format(n);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function zero(): CotisationBreakdown {
  return {
    urssaf: 0, cfp: 0, taxeChambre: 0, versementLiberatoire: 0,
    totalCharges: 0, netRestant: 0,
    taux: { urssaf: 0, cfp: 0, taxeChambre: 0, versementLiberatoire: 0, effectif: 0 },
  };
}
