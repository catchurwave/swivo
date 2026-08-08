/*
  Validations conformes aux contrôles INPI/Guichet unique.
  Sources : Contrat d'interface juin 2025 + dictionnaire INPI 2026-04-29.
  Tout valideur retourne { ok, message? } pour usage uniforme.
*/
import type { Dossier, Personne, Adresse, Associe, Dirigeant } from './types';
import { FORMES } from './formes';

export type Issue = { code: string; level: 'error' | 'warn' | 'info'; message: string; field?: string };
export type ValidationReport = {
  ok: boolean;
  issues: Issue[];
  scoreCompletude: number; // 0..100
  scoreConformite: number; // 0..100 — utilisé pour estimer taux d'acceptation INPI
  pretATransmettre: boolean;
};

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const RE_TEL_FR = /^(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}$/;
const RE_CP = /^\d{5}$/;
const RE_SIREN = /^\d{9}$/;
const RE_SIRET = /^\d{14}$/;
const RE_IBAN_FR = /^FR\d{2}[A-Z0-9]{23}$/;
const RE_BIC = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const RE_NIR = /^[12]\s?\d{2}\s?\d{2}\s?(?:\d{2}|2[AB])\s?\d{3}\s?\d{3}\s?\d{2}$/;
const RE_APE = /^\d{2}\.\d{2}[A-Z]$/;

export const Check = {
  email: (v?: string) => !!v && RE_EMAIL.test(v.trim()),
  telephoneFR: (v?: string) => !!v && RE_TEL_FR.test(v.replace(/\s/g, '')),
  codePostal: (v?: string) => !!v && RE_CP.test(v),
  siren: (v?: string) => !!v && RE_SIREN.test(v) && luhnSiren(v),
  siret: (v?: string) => !!v && RE_SIRET.test(v) && luhnSiret(v),
  iban: (v?: string) => !!v && RE_IBAN_FR.test(v.replace(/\s/g, '')) && ibanCheck(v.replace(/\s/g, '')),
  bic: (v?: string) => !!v && RE_BIC.test(v),
  nir: (v?: string) => !!v && RE_NIR.test(v.replace(/\s/g, '')),
  ape: (v?: string) => !!v && RE_APE.test(v),
  dateISO: (v?: string) => !!v && !Number.isNaN(Date.parse(v)),
  majeur: (dateNaissance?: string) => {
    if (!dateNaissance) return false;
    const d = new Date(dateNaissance);
    const min = new Date();
    min.setFullYear(min.getFullYear() - 18);
    return d <= min;
  },
};

function luhnSiren(s: string): boolean {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = parseInt(s[i]!, 10);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

function luhnSiret(s: string): boolean {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let n = parseInt(s[i]!, 10);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

function ibanCheck(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split('')
    .map((c) => (/[A-Z]/.test(c) ? (c.charCodeAt(0) - 55).toString() : c))
    .join('');
  // mod 97 par tranches pour éviter dépassement
  let rest = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    rest = parseInt(String(rest) + numeric.slice(i, i + 7), 10) % 97;
  }
  return rest === 1;
}

function pushIfMissing(issues: Issue[], cond: boolean, issue: Omit<Issue, 'level'> & { level?: Issue['level'] }) {
  if (!cond) issues.push({ level: 'error', ...issue });
}

function validatePersonne(p: Personne | undefined, prefix: string, issues: Issue[]) {
  if (!p) {
    issues.push({ code: 'missing_personne', level: 'error', message: `${prefix} : informations manquantes`, field: prefix });
    return;
  }
  pushIfMissing(issues, !!p.civilite, { code: 'missing_civilite', message: `${prefix} : civilité requise`, field: `${prefix}.civilite` });
  pushIfMissing(issues, !!p.prenom && p.prenom.length >= 2, { code: 'missing_prenom', message: `${prefix} : prénom requis`, field: `${prefix}.prenom` });
  pushIfMissing(issues, !!p.nom && p.nom.length >= 2, { code: 'missing_nom', message: `${prefix} : nom requis`, field: `${prefix}.nom` });
  pushIfMissing(issues, !!p.dateNaissance && Check.dateISO(p.dateNaissance), { code: 'missing_date_nais', message: `${prefix} : date de naissance invalide`, field: `${prefix}.dateNaissance` });
  pushIfMissing(issues, Check.majeur(p.dateNaissance), { code: 'mineur', message: `${prefix} : doit être majeur`, field: `${prefix}.dateNaissance` });
  pushIfMissing(issues, !!p.lieuNaissance, { code: 'missing_lieu_nais', message: `${prefix} : lieu de naissance requis`, field: `${prefix}.lieuNaissance` });
  pushIfMissing(issues, !!p.nationalite && p.nationalite.length === 3, { code: 'missing_nationalite', message: `${prefix} : nationalité (ISO-3) requise`, field: `${prefix}.nationalite` });
  validateAdresse(p.domicile, `${prefix}.domicile`, issues);
  if (p.email && !Check.email(p.email)) issues.push({ code: 'bad_email', level: 'error', message: `${prefix} : email invalide`, field: `${prefix}.email` });
  if (p.telephone && !Check.telephoneFR(p.telephone)) issues.push({ code: 'bad_tel', level: 'warn', message: `${prefix} : téléphone douteux`, field: `${prefix}.telephone` });
}

function validateAdresse(a: Adresse | undefined, prefix: string, issues: Issue[]) {
  if (!a) {
    issues.push({ code: 'missing_adresse', level: 'error', message: `${prefix} : adresse requise`, field: prefix });
    return;
  }
  pushIfMissing(issues, !!a.voie && a.voie.length >= 4, { code: 'missing_voie', message: `${prefix} : voie requise`, field: `${prefix}.voie` });
  pushIfMissing(issues, Check.codePostal(a.codePostal), { code: 'bad_cp', message: `${prefix} : code postal invalide`, field: `${prefix}.codePostal` });
  pushIfMissing(issues, !!a.commune && a.commune.length >= 2, { code: 'missing_commune', message: `${prefix} : commune requise`, field: `${prefix}.commune` });
}

export function validate(d: Dossier): ValidationReport {
  const issues: Issue[] = [];

  if (!d.forme) issues.push({ code: 'missing_forme', level: 'error', message: 'Forme juridique non sélectionnée' });
  const rule = d.forme ? FORMES[d.forme] : null;

  // Dénomination / objet
  if (rule?.isSociete) {
    pushIfMissing(issues, !!d.denomination && d.denomination.length >= 2, { code: 'missing_denom', message: 'Dénomination sociale requise (≥ 2 caractères)', field: 'denomination' });
    pushIfMissing(issues, !!d.objetSocial && d.objetSocial.length >= 20, { code: 'objet_court', message: 'Objet social trop court (≥ 20 caractères, décrire activités présentes et futures)', field: 'objetSocial' });
    pushIfMissing(issues, !!d.duree && d.duree > 0 && d.duree <= 99, { code: 'duree', message: 'Durée sociale entre 1 et 99 ans', field: 'duree' });
    pushIfMissing(issues, !!d.dateClotureExercice, { code: 'cloture', message: 'Date de clôture du 1er exercice requise', field: 'dateClotureExercice' });
  }

  // Activités
  if (!d.activites?.length) issues.push({ code: 'no_activite', level: 'error', message: 'Au moins une activité requise', field: 'activites' });
  for (let i = 0; i < (d.activites?.length ?? 0); i++) {
    const act = d.activites[i]!;
    if (!act.description || act.description.length < 10) issues.push({ code: 'desc_act_courte', level: 'error', message: `Activité #${i + 1} : description trop courte (≥ 10 caractères)`, field: `activites[${i}].description` });
    if (act.ape && !Check.ape(act.ape)) issues.push({ code: 'ape_format', level: 'warn', message: `Activité #${i + 1} : format APE attendu NN.NNL`, field: `activites[${i}].ape` });
    if (act.reglementee && !act.qualificationProfessionnelle?.diplome && !act.qualificationProfessionnelle?.experienceAnnees) {
      issues.push({ code: 'reglementee_sans_qualif', level: 'error', message: `Activité réglementée "${act.reglementee.type}" : qualification ou expérience requise`, field: `activites[${i}].qualification` });
    }
  }

  // Forme-spécifique : interdictions
  if (d.forme === 'micro' && d.activites?.some((a) => a.categorie === 'liberale_reglementee' && /avocat|notaire|huissier/i.test(a.description))) {
    issues.push({ code: 'micro_interdite', level: 'error', message: 'Activité interdite en micro-entreprise', field: 'forme' });
  }

  // Siège
  validateAdresse(d.etablissementPrincipal?.adresse, 'siege.adresse', issues);
  pushIfMissing(issues, !!d.etablissementPrincipal?.domiciliation, { code: 'mode_domiciliation', message: 'Mode de domiciliation requis', field: 'etablissementPrincipal.domiciliation' });
  if (d.etablissementPrincipal?.domiciliation === 'societe_domiciliation') {
    pushIfMissing(issues, !!d.etablissementPrincipal?.societeDomiciliation?.siren && Check.siren(d.etablissementPrincipal.societeDomiciliation.siren), { code: 'dom_siren', message: 'SIREN société de domiciliation invalide', field: 'etablissementPrincipal.societeDomiciliation.siren' });
    pushIfMissing(issues, !!d.etablissementPrincipal?.societeDomiciliation?.agrementPrefecture, { code: 'dom_agrement', message: 'N° d’agrément préfectoral de la société de domiciliation requis', field: 'etablissementPrincipal.societeDomiciliation.agrementPrefecture' });
  }
  pushIfMissing(issues, !!d.etablissementPrincipal?.dateDebutActivite && Check.dateISO(d.etablissementPrincipal.dateDebutActivite), { code: 'date_debut', message: 'Date de début d’activité requise', field: 'etablissementPrincipal.dateDebutActivite' });

  // Associés / capital
  if (rule?.isSociete) {
    const minAssocies = rule.associes.min;
    if (!d.associes?.length || d.associes.length < minAssocies) {
      issues.push({ code: 'assoc_min', level: 'error', message: `Au moins ${minAssocies} associé(s) requis pour ${rule.shortLabel}`, field: 'associes' });
    }
    if (rule.associes.max && d.associes && d.associes.length > rule.associes.max) {
      issues.push({ code: 'assoc_max', level: 'error', message: `Max ${rule.associes.max} associés pour ${rule.shortLabel}`, field: 'associes' });
    }
    d.associes?.forEach((a, i) => validateAssocie(a, i, issues));

    if (rule.capital.requis) {
      const totalApports = (d.associes ?? []).reduce((s, a) => s + apportTotal(a), 0);
      pushIfMissing(issues, totalApports >= rule.capital.montantMin, { code: 'capital_min', message: `Capital minimum ${rule.capital.montantMin} € pour ${rule.shortLabel}`, field: 'capital.montantTotal' });
      if (rule.capital.libereMinPctApports) {
        const numTotal = (d.associes ?? []).reduce((s, a) => s + (a.apport.numeraire ?? 0), 0);
        const numLibere = (d.associes ?? []).reduce((s, a) => s + (a.apport.numeraireLibere ?? 0), 0);
        if (numTotal > 0) {
          const pct = (numLibere / numTotal) * 100;
          pushIfMissing(issues, pct >= rule.capital.libereMinPctApports, { code: 'capital_libere', message: `Libération min ${rule.capital.libereMinPctApports}% du numéraire à la constitution`, field: 'capital.montantLibere' });
        }
      }
      // Commissaire aux apports si seuils
      if (rule.capital.apportNatureCommissaire) {
        const nature = (d.associes ?? []).flatMap((a) => a.apport.nature ?? []);
        const maxApportNat = nature.reduce((m, n) => Math.max(m, n.valeur), 0);
        const totalNat = nature.reduce((s, n) => s + n.valeur, 0);
        const totalCap = (d.capital?.montantTotal ?? 0) || totalApports;
        const seuilApport = rule.capital.apportNatureCommissaire.seuilParApport;
        const seuilTotalPct = rule.capital.apportNatureCommissaire.totalGtCapitalPct;
        if ((seuilApport > 0 && maxApportNat > seuilApport) || (totalCap > 0 && (totalNat / totalCap) * 100 > seuilTotalPct)) {
          issues.push({ code: 'cac_apports', level: 'warn', message: 'Commissaire aux apports requis (seuils Loi Sapin/PACTE dépassés)', field: 'capital.apports' });
        }
      }
    }

    if (rule.depotCapitalObligatoire) {
      pushIfMissing(issues, !!d.depotCapital?.attestationFournie, { code: 'depot_attest', message: 'Attestation de dépôt de capital manquante', field: 'depotCapital.attestationFournie' });
      pushIfMissing(issues, Check.iban(d.depotCapital?.iban), { code: 'depot_iban', message: 'IBAN du compte de dépôt invalide', field: 'depotCapital.iban' });
    }

    if (rule.annonceLegaleObligatoire) {
      pushIfMissing(issues, !!d.annonceLegale?.refAttestation, { code: 'jal_attest', message: 'Attestation de parution journal d’annonces légales requise', field: 'annonceLegale.refAttestation' });
    }

    if (rule.rbeObligatoire) {
      if (!d.beneficiairesEffectifs?.length) {
        issues.push({ code: 'rbe_vide', level: 'error', message: 'Déclaration des bénéficiaires effectifs requise (R561-1 CMF)', field: 'beneficiairesEffectifs' });
      } else {
        const sumCap = d.beneficiairesEffectifs.reduce((s, b) => s + (b.pctCapital ?? 0), 0);
        if (sumCap > 100.01) issues.push({ code: 'rbe_sum', level: 'error', message: 'Somme des % capital RBE > 100', field: 'beneficiairesEffectifs' });
      }
    }
  }

  // Dirigeants
  if (rule?.isSociete) {
    if (!d.dirigeants?.length || d.dirigeants.length < rule.dirigeants.min) {
      issues.push({ code: 'dir_min', level: 'error', message: `Au moins ${rule.dirigeants.min} dirigeant(s) requis (${rule.dirigeants.titres.join('/')})`, field: 'dirigeants' });
    }
    d.dirigeants?.forEach((dr, i) => validateDirigeant(dr, i, issues));
  } else {
    // Micro / EI : dirigeant = entrepreneur lui-même
    if (!d.dirigeants?.length) issues.push({ code: 'ei_dirigeant', level: 'error', message: 'Identité de l’entrepreneur individuel requise', field: 'dirigeants' });
    d.dirigeants?.forEach((dr, i) => validateDirigeant(dr, i, issues));
  }

  // Mandat
  pushIfMissing(issues, !!d.mandat?.accepte, { code: 'mandat', message: 'Le mandat de dépôt Swivo doit être accepté pour transmission INPI', field: 'mandat.accepte' });

  // Score
  const errors = issues.filter((i) => i.level === 'error').length;
  const warnings = issues.filter((i) => i.level === 'warn').length;
  const totalFields = countRequiredFields(d);
  const missing = errors;
  const scoreCompletude = Math.max(0, Math.min(100, Math.round(((totalFields - missing) / Math.max(1, totalFields)) * 100)));
  const scoreConformite = Math.max(0, 100 - errors * 8 - warnings * 2);
  const pretATransmettre = errors === 0 && !!d.mandat?.accepte;

  return { ok: errors === 0, issues, scoreCompletude, scoreConformite, pretATransmettre };
}

function validateAssocie(a: Associe, i: number, issues: Issue[]) {
  if (a.type === 'personne_physique') validatePersonne(a.personne, `associes[${i}].personne`, issues);
  else {
    pushIfMissing(issues, !!a.morale?.denomination, { code: 'pm_denom', message: `Associé #${i + 1} (PM) : dénomination requise`, field: `associes[${i}].morale.denomination` });
    pushIfMissing(issues, Check.siren(a.morale?.siren), { code: 'pm_siren', message: `Associé #${i + 1} (PM) : SIREN invalide`, field: `associes[${i}].morale.siren` });
    validatePersonne(a.morale?.representant, `associes[${i}].morale.representant`, issues);
  }
  if (apportTotal(a) <= 0) issues.push({ code: 'apport_vide', level: 'error', message: `Associé #${i + 1} : apport requis (> 0 €)`, field: `associes[${i}].apport` });
}

function validateDirigeant(dr: Dirigeant, i: number, issues: Issue[]) {
  if (!dr.fonction) issues.push({ code: 'dir_fonction', level: 'error', message: `Dirigeant #${i + 1} : fonction requise`, field: `dirigeants[${i}].fonction` });
  if (dr.type === 'personne_physique') validatePersonne(dr.personne, `dirigeants[${i}].personne`, issues);
  else validatePersonne(dr.morale?.representant, `dirigeants[${i}].morale.representant`, issues);
}

function apportTotal(a: Associe): number {
  const num = a.apport.numeraire ?? 0;
  const nat = (a.apport.nature ?? []).reduce((s, n) => s + n.valeur, 0);
  return num + nat;
}

function countRequiredFields(d: Dossier): number {
  // Heuristique : nb champs requis selon forme
  const rule = d.forme ? FORMES[d.forme] : null;
  let n = 8; // socle commun (activité, adresse, identité dirigeant principal…)
  if (rule?.isSociete) n += 12;
  if (rule?.capital.requis) n += 4;
  if (rule?.depotCapitalObligatoire) n += 3;
  if (rule?.annonceLegaleObligatoire) n += 1;
  if (rule?.rbeObligatoire) n += 3;
  return n;
}
