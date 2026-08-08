const COTISATION_RATE = {
  vente_bic: 0.123,
  // 12,3 %
  service_bic: 0.212,
  // 21,2 %
  service_bnc: 0.211,
  // 21,1 %
  liberal_cipav: 0.232
  // 23,2 %
};
const CFP_RATE = {
  vente_bic: 1e-3,
  // commerçants : 0,1 %
  service_bic: 3e-3,
  // artisans : 0,3 %
  service_bnc: 2e-3,
  // libéraux : 0,2 %
  liberal_cipav: 2e-3
};
const VERSEMENT_LIBERATOIRE_RATE = {
  vente_bic: 0.01,
  // 1 %
  service_bic: 0.017,
  // 1,7 %
  service_bnc: 0.022,
  // 2,2 %
  liberal_cipav: 0.022
  // 2,2 %
};
const TAXE_CHAMBRE_RATE = {
  vente_bic: 15e-4,
  // 0,15 % CCI
  service_bic: 44e-4,
  // 0,44 % CMA artisans prestations
  service_bnc: 0,
  liberal_cipav: 0
};
const PLAFOND_CA = {
  vente_bic: 188700,
  service_bic: 77700,
  service_bnc: 77700,
  liberal_cipav: 77700
};
const SEUIL_TVA_BASIQUE = {
  vente_bic: 85e3,
  service_bic: 37500,
  service_bnc: 37500,
  liberal_cipav: 37500
};
const SEUIL_TVA_MAJOREE = {
  vente_bic: 93500,
  service_bic: 41250,
  service_bnc: 41250,
  liberal_cipav: 41250
};
const ABATTEMENT_IR = {
  vente_bic: 0.71,
  // 71 %
  service_bic: 0.5,
  // 50 %
  service_bnc: 0.34,
  // 34 %
  liberal_cipav: 0.34
};
const ACRE_REDUCTION = 0.5;
function calculerCotisations(ca, categorie, opts = {}) {
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
    urssaf,
    cfp,
    taxeChambre,
    versementLiberatoire,
    totalCharges,
    netRestant,
    taux: {
      urssaf: tauxUrssaf,
      cfp: tauxCfp,
      taxeChambre: tauxTaxe,
      versementLiberatoire: tauxVL,
      effectif: ca > 0 ? totalCharges / ca : 0
    }
  };
}
function revenuNetImposable(ca, categorie) {
  const abat = ABATTEMENT_IR[categorie];
  return round2(ca * (1 - abat));
}
function alertesPlafonds(caAnnuel, categorie) {
  const out = [];
  const tvaBase = SEUIL_TVA_BASIQUE[categorie];
  const tvaMaj = SEUIL_TVA_MAJOREE[categorie];
  const plafond = PLAFOND_CA[categorie];
  const pctTvaBase = caAnnuel / tvaBase;
  const pctTvaMaj = caAnnuel / tvaMaj;
  const pctPlafond = caAnnuel / plafond;
  if (pctTvaBase >= 1) {
    out.push({
      niveau: pctTvaMaj >= 1 ? "critical" : "warning",
      code: "tva_basique",
      message: `Seuil de franchise TVA dépassé (${formatEUR(tvaBase)}). Vous devez facturer la TVA dès le 1er jour du mois suivant.`,
      pct: pctTvaBase,
      restant: 0
    });
  } else if (pctTvaBase >= 0.85) {
    out.push({
      niveau: "warning",
      code: "tva_basique",
      message: `Seuil TVA proche (${Math.round(pctTvaBase * 100)} % de ${formatEUR(tvaBase)}).`,
      pct: pctTvaBase,
      restant: round2(tvaBase - caAnnuel)
    });
  }
  if (pctTvaMaj >= 1) {
    out.push({
      niveau: "critical",
      code: "tva_majoree",
      message: `Seuil de tolérance TVA dépassé (${formatEUR(tvaMaj)}). Assujettissement immédiat.`,
      pct: pctTvaMaj,
      restant: 0
    });
  }
  if (pctPlafond >= 1) {
    out.push({
      niveau: "critical",
      code: "plafond_micro",
      message: `Plafond de chiffre d'affaires micro dépassé (${formatEUR(plafond)}). Sortie du régime micro l'année suivante.`,
      pct: pctPlafond,
      restant: 0
    });
  } else if (pctPlafond >= 0.8) {
    out.push({
      niveau: "warning",
      code: "plafond_micro",
      message: `Plafond micro proche (${Math.round(pctPlafond * 100)} %).`,
      pct: pctPlafond,
      restant: round2(plafond - caAnnuel)
    });
  }
  return out;
}
function prochainesEcheancesURSSAF(regime, monthsAhead = 6, ref = /* @__PURE__ */ new Date()) {
  const out = [];
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  if (regime === "mensuel") {
    for (let i = 1; i <= monthsAhead; i++) {
      const periodDate = new Date(start.getFullYear(), start.getMonth() + (i - 1), 1);
      const dueDate = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
      out.push({
        date: dueDate.toISOString().slice(0, 10),
        label: `Déclaration URSSAF — ${monthLabel(periodDate)}`,
        type: "urssaf",
        periode: `${periodDate.getFullYear()}-${pad(periodDate.getMonth() + 1)}`
      });
    }
  } else {
    const quarters = [
      { month: 0, day: 31, label: "T4 N-1" },
      { month: 3, day: 30, label: "T1" },
      { month: 6, day: 31, label: "T2" },
      { month: 9, day: 31, label: "T3" }
    ];
    const today = ref;
    for (let y = today.getFullYear(); y <= today.getFullYear() + 1; y++) {
      for (const q of quarters) {
        const dueDate = new Date(y, q.month, q.day);
        if (dueDate >= today && out.length < monthsAhead) {
          out.push({
            date: dueDate.toISOString().slice(0, 10),
            label: `Déclaration URSSAF — ${q.label} ${y}`,
            type: "urssaf",
            periode: `${y}-${q.label}`
          });
        }
      }
    }
  }
  return out.slice(0, monthsAhead);
}
const CATEGORIE_LABEL = {
  vente_bic: "Vente de marchandises (BIC)",
  service_bic: "Prestation de services BIC",
  service_bnc: "Libéral non réglementé (BNC)",
  liberal_cipav: "Libéral réglementé CIPAV"
};
function formatEUR(n) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function formatPct(n, digits = 1) {
  return new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: digits }).format(n);
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
function pad(n) {
  return n.toString().padStart(2, "0");
}
function monthLabel(d) {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
function zero() {
  return {
    urssaf: 0,
    cfp: 0,
    taxeChambre: 0,
    versementLiberatoire: 0,
    totalCharges: 0,
    netRestant: 0,
    taux: { urssaf: 0, cfp: 0, taxeChambre: 0, versementLiberatoire: 0, effectif: 0 }
  };
}
export {
  ABATTEMENT_IR as A,
  CATEGORIE_LABEL as C,
  PLAFOND_CA as P,
  SEUIL_TVA_BASIQUE as S,
  ACRE_REDUCTION as a,
  SEUIL_TVA_MAJOREE as b,
  alertesPlafonds as c,
  calculerCotisations as d,
  formatPct as e,
  formatEUR as f,
  prochainesEcheancesURSSAF as p,
  revenuNetImposable as r
};
