const EMPTY_DOSSIER = {
  version: 1,
  activites: [],
  associes: [],
  dirigeants: [],
  beneficiairesEffectifs: [],
  options: {},
  statut: "brouillon",
  scoreCompletude: 0
};
const FORMES = {
  micro: {
    code: "micro",
    inseeCode: "1000",
    label: "Micro-entreprise",
    shortLabel: "Micro",
    isSociete: false,
    capital: { requis: false, montantMin: 0 },
    associes: { min: 1, max: 1 },
    dirigeants: { titres: ["Entrepreneur individuel"], min: 1, max: 1, obligatoireUnique: true },
    regimesFiscaux: { defaut: "micro_bic", options: ["micro_bic", "micro_bnc", "micro_ba"] },
    regimeSocialDirigeantDefaut: "tns",
    rbeObligatoire: false,
    statutsObligatoires: false,
    annonceLegaleObligatoire: false,
    depotCapitalObligatoire: false,
    formaliteINPI: "creation_micro_entrepreneur",
    responsabiliteAssocies: "limitee_apports",
    particularites: [
      "Plafonds CA 2026 : 188 700 € vente / 77 700 € service",
      "Franchise en base de TVA : 85 000 € (vente) / 37 500 € (service)",
      "Cotisations URSSAF proportionnelles au CA déclaré (12,3 % / 21,1 % / 21,2 %)",
      "Versement libératoire IR sous conditions de RFR",
      "Résidence principale insaisissable de droit (loi 14/02/2022)",
      "Comptabilité ultra-simplifiée : livre des recettes + registre des achats"
    ]
  }
};
const REGLEMENTEES = [
  // ARTISANAT (qualification professionnelle obligatoire — décret 98-246 et loi PACTE)
  {
    motsCles: ["coiffure", "coiffeur", "coiffeuse", "barbier"],
    type: "artisanat_qualification",
    piecesRequises: ["CAP/BP coiffure OU 3 ans expérience attestés", "Attestation qualification CMA"],
    autorite: "Chambre de Métiers et de l’Artisanat"
  },
  {
    motsCles: ["esthétique", "esthéticien", "esthéticienne", "soins du visage", "épilation"],
    type: "esthetique_qualification",
    piecesRequises: ["CAP esthétique-cosmétique-parfumerie OU 3 ans expérience"],
    autorite: "CMA"
  },
  {
    motsCles: ["boulangerie", "boulanger", "pâtisserie", "pâtissier", "boucher", "boucherie", "charcutier", "poissonnier", "fromager"],
    type: "artisanat_qualification",
    piecesRequises: ["CAP/BEP métier OU 3 ans expérience attestés"],
    autorite: "CMA"
  },
  {
    motsCles: ["plombier", "électricien", "chauffagiste", "maçon", "couvreur", "menuisier", "charpentier", "carreleur", "peintre en bâtiment", "plâtrier"],
    type: "batiment_qualification",
    piecesRequises: ["CAP/BEP du métier OU 3 ans expérience", "Attestation qualification CMA"],
    autorite: "CMA"
  },
  {
    motsCles: ["mécanicien automobile", "garage", "carrossier", "réparation automobile", "moto", "cycle"],
    type: "artisanat_qualification",
    piecesRequises: ["CAP/BEP mécanique OU 3 ans expérience", "Assurance RC garagiste"],
    autorite: "CMA"
  },
  {
    motsCles: ["taxi", "vtc", "voiture de tourisme avec chauffeur"],
    type: "transport_capacite",
    piecesRequises: ["Carte professionnelle VTC/taxi (préfecture)", "Permis B > 3 ans", "Casier judiciaire vierge B2", "Visite médicale apte"],
    autorite: "Préfecture"
  },
  {
    motsCles: ["transport de marchandises", "transporteur", "déménagement", "commissionnaire de transport"],
    type: "transport_capacite",
    piecesRequises: ["Attestation de capacité professionnelle transport", "Inscription registre transporteurs DREAL", "Capacité financière"],
    autorite: "DREAL"
  },
  // SANTÉ / RÉGLEMENTÉ
  {
    motsCles: ["médecin", "dentiste", "sage-femme", "infirmier", "infirmière", "kinésithérapeute", "orthophoniste", "pharmacien", "psychologue"],
    type: "sante",
    piecesRequises: ["Diplôme d’État", "Inscription Ordre professionnel (RPPS)", "Numéro ADELI le cas échéant"],
    autorite: "ARS + Ordre"
  },
  {
    motsCles: ["ostéopathe", "chiropracteur", "naturopathe", "sophrologue"],
    type: "sante",
    piecesRequises: ["Diplôme reconnu par le Ministère de la Santé", "Numéro ADELI (ostéo/chiro)"],
    autorite: "ARS"
  },
  // JURIDIQUE
  {
    motsCles: ["avocat", "notaire", "huissier", "commissaire de justice", "mandataire judiciaire"],
    type: "juridique",
    piecesRequises: ["CAPA/diplôme officiel", "Prestation de serment", "Inscription à l’Ordre ou Chambre"],
    autorite: "Ordre des avocats / CSN / CNCJ"
  },
  // COMPTABILITÉ / FINANCE
  {
    motsCles: ["expert-comptable", "expert comptable", "commissaire aux comptes"],
    type: "comptable_finance",
    piecesRequises: ["DEC", "Inscription Ordre des experts-comptables / CNCC"],
    autorite: "OEC / CNCC"
  },
  {
    motsCles: ["conseiller en investissement", "intermédiaire en assurance", "iobsp", "cif"],
    type: "comptable_finance",
    piecesRequises: ["Immatriculation ORIAS", "Justificatifs compétence professionnelle", "RC pro adaptée"],
    autorite: "ORIAS / ACPR"
  },
  // IMMOBILIER
  {
    motsCles: ["agent immobilier", "agence immobilière", "syndic", "gestion locative", "transactionnaire"],
    type: "immobilier_carte",
    piecesRequises: ["Carte professionnelle T/G/S (CCI)", "Garantie financière", "RC pro", "Aptitude professionnelle"],
    autorite: "CCI"
  },
  // SÉCURITÉ
  {
    motsCles: ["sécurité privée", "gardiennage", "agent de sécurité", "vidéosurveillance", "protection physique des personnes"],
    type: "securite_privee",
    piecesRequises: ["Autorisation CNAPS dirigeant", "Autorisation d’exercer CNAPS", "Carte professionnelle agents"],
    autorite: "CNAPS"
  },
  // RESTAURATION / DÉBIT
  {
    motsCles: ["débit de boissons", "bar", "pub", "restaurant licence iv", "restauration alcool", "discothèque"],
    type: "restauration_debit",
    piecesRequises: ["Permis d’exploitation (formation hygiène alcool 20h)", "Licence III/IV (mairie)", "Formation HACCP si restauration commerciale"],
    autorite: "Préfecture / mairie"
  },
  {
    motsCles: ["restaurant", "restauration", "food truck", "traiteur", "cantine"],
    type: "restauration_debit",
    piecesRequises: ["Formation HACCP (minimum 1 personne)", "Déclaration DDPP", "Numéro agrément sanitaire si prod. animale"],
    autorite: "DDPP"
  },
  // ENSEIGNEMENT
  {
    motsCles: ["école", "enseignement", "formation", "auto-école", "soutien scolaire"],
    type: "enseignement",
    piecesRequises: ["Déclaration préfecture (école)", "BEPECASER (auto-école)", "Déclaration NDA si formation continue"],
    autorite: "Rectorat / Préfecture"
  },
  // PETITE ENFANCE / SOCIAL
  {
    motsCles: ["crèche", "micro-crèche", "assistante maternelle", "garde enfants à domicile"],
    type: "social_petite_enfance",
    piecesRequises: ["Agrément PMI (Conseil départemental)", "Casier B2 vierge", "Formation petite enfance"],
    autorite: "PMI"
  }
];
const APE_INDEX = [
  // Services aux entreprises
  { ape: "70.22Z", libelle: "Conseil pour les affaires et autres conseils de gestion", categorie: "liberale_non_reglementee", motsClesMatch: ["conseil", "consulting", "consultant", "stratégie", "management"] },
  { ape: "62.01Z", libelle: "Programmation informatique", categorie: "liberale_non_reglementee", motsClesMatch: ["développeur", "développement", "dev web", "programmation", "logiciel", "saas"] },
  { ape: "62.02A", libelle: "Conseil en systèmes et logiciels informatiques", categorie: "liberale_non_reglementee", motsClesMatch: ["conseil informatique", "devops", "cloud", "architecte si"] },
  { ape: "63.12Z", libelle: "Portails internet", categorie: "commerciale", motsClesMatch: ["portail", "marketplace", "plateforme"] },
  { ape: "73.11Z", libelle: "Activités des agences de publicité", categorie: "commerciale", motsClesMatch: ["publicité", "agence pub", "marketing", "communication"] },
  { ape: "74.10Z", libelle: "Activités spécialisées de design", categorie: "liberale_non_reglementee", motsClesMatch: ["design", "graphisme", "ux", "ui"] },
  { ape: "74.20Z", libelle: "Activités photographiques", categorie: "liberale_non_reglementee", motsClesMatch: ["photographe", "photo"] },
  { ape: "74.30Z", libelle: "Traduction et interprétation", categorie: "liberale_non_reglementee", motsClesMatch: ["traduction", "traducteur", "interprète"] },
  // Commerce
  { ape: "47.91A", libelle: "Vente à distance sur catalogue général", categorie: "commerciale", motsClesMatch: ["e-commerce", "boutique en ligne", "vente en ligne"] },
  { ape: "47.19B", libelle: "Autres commerces de détail en magasin non spécialisé", categorie: "commerciale", motsClesMatch: ["boutique", "magasin", "commerce détail"] },
  { ape: "47.71Z", libelle: "Commerce de détail d’habillement", categorie: "commerciale", motsClesMatch: ["vêtements", "prêt-à-porter", "mode"] },
  { ape: "46.49Z", libelle: "Commerce de gros d’autres biens", categorie: "commerciale", motsClesMatch: ["grossiste", "gros"] },
  // Restauration
  { ape: "56.10A", libelle: "Restauration traditionnelle", categorie: "commerciale", motsClesMatch: ["restaurant", "bistrot", "brasserie"] },
  { ape: "56.10C", libelle: "Restauration de type rapide", categorie: "commerciale", motsClesMatch: ["fast food", "snack", "food truck"] },
  { ape: "56.21Z", libelle: "Services des traiteurs", categorie: "commerciale", motsClesMatch: ["traiteur", "événementiel"] },
  { ape: "56.30Z", libelle: "Débits de boissons", categorie: "commerciale", motsClesMatch: ["bar", "café", "pub"] },
  // Bâtiment / artisanat
  { ape: "43.22A", libelle: "Travaux d’installation d’eau et de gaz en tous locaux", categorie: "artisanale", motsClesMatch: ["plombier", "plomberie"] },
  { ape: "43.21A", libelle: "Travaux d’installation électrique dans tous locaux", categorie: "artisanale", motsClesMatch: ["électricien", "électricité"] },
  { ape: "43.34Z", libelle: "Travaux de peinture et vitrerie", categorie: "artisanale", motsClesMatch: ["peintre", "peinture"] },
  { ape: "41.20A", libelle: "Construction de maisons individuelles", categorie: "artisanale", motsClesMatch: ["constructeur", "maçonnerie", "maçon"] },
  { ape: "96.02A", libelle: "Coiffure", categorie: "artisanale", motsClesMatch: ["coiffeur", "coiffure", "barbier"] },
  { ape: "96.02B", libelle: "Soins de beauté", categorie: "artisanale", motsClesMatch: ["esthétique", "esthéticienne", "institut beauté"] },
  { ape: "10.71C", libelle: "Boulangerie-pâtisserie", categorie: "artisanale", motsClesMatch: ["boulanger", "boulangerie", "pâtissier"] },
  // Santé / libéral réglementé
  { ape: "86.21Z", libelle: "Activités des médecins généralistes", categorie: "liberale_reglementee", motsClesMatch: ["médecin généraliste"] },
  { ape: "86.22A", libelle: "Activités de radiodiagnostic et de radiothérapie", categorie: "liberale_reglementee", motsClesMatch: ["radiologue"] },
  { ape: "86.23Z", libelle: "Pratique dentaire", categorie: "liberale_reglementee", motsClesMatch: ["dentiste"] },
  { ape: "86.90A", libelle: "Ambulances", categorie: "liberale_reglementee", motsClesMatch: ["ambulance"] },
  { ape: "86.90D", libelle: "Activités des infirmiers et des sages-femmes", categorie: "liberale_reglementee", motsClesMatch: ["infirmier", "infirmière", "sage-femme"] },
  { ape: "86.90E", libelle: "Activités des professionnels de la rééducation", categorie: "liberale_reglementee", motsClesMatch: ["kinésithérapeute", "orthophoniste"] },
  // Juridique / comptable
  { ape: "69.10Z", libelle: "Activités juridiques", categorie: "liberale_reglementee", motsClesMatch: ["avocat", "notaire", "huissier"] },
  { ape: "69.20Z", libelle: "Activités comptables", categorie: "liberale_reglementee", motsClesMatch: ["expert-comptable", "comptable"] },
  // Immobilier
  { ape: "68.10Z", libelle: "Activités des marchands de biens immobiliers", categorie: "commerciale", motsClesMatch: ["marchand de biens"] },
  { ape: "68.20A", libelle: "Location de logements", categorie: "commerciale", motsClesMatch: ["location nue", "location appartement"] },
  { ape: "68.20B", libelle: "Location de terrains et d’autres biens immobiliers", categorie: "commerciale", motsClesMatch: ["location terrain"] },
  { ape: "68.31Z", libelle: "Agences immobilières", categorie: "commerciale", motsClesMatch: ["agent immobilier", "agence immobilière"] },
  // Transport
  { ape: "49.32Z", libelle: "Transports de voyageurs par taxis", categorie: "commerciale", motsClesMatch: ["taxi", "vtc"] },
  { ape: "49.41A", libelle: "Transports routiers de fret interurbains", categorie: "commerciale", motsClesMatch: ["transport marchandises", "fret"] },
  { ape: "53.20Z", libelle: "Autres activités de poste et de courrier", categorie: "commerciale", motsClesMatch: ["coursier", "livraison", "livreur"] },
  // Enseignement / sport / culture
  { ape: "85.59A", libelle: "Formation continue d’adultes", categorie: "liberale_non_reglementee", motsClesMatch: ["formation", "formateur"] },
  { ape: "85.32Z", libelle: "Enseignement secondaire technique ou professionnel", categorie: "liberale_reglementee", motsClesMatch: ["école technique"] },
  { ape: "85.51Z", libelle: "Enseignement de disciplines sportives", categorie: "commerciale", motsClesMatch: ["coach sportif", "coach", "fitness"] },
  { ape: "85.52Z", libelle: "Enseignement culturel", categorie: "liberale_non_reglementee", motsClesMatch: ["professeur musique", "cours danse"] },
  // Agricole
  { ape: "01.13Z", libelle: "Culture de légumes, melons, racines et tubercules", categorie: "agricole", motsClesMatch: ["maraîchage", "maraîcher"] },
  { ape: "01.25Z", libelle: "Culture d’autres fruits d’arbres et arbustes", categorie: "agricole", motsClesMatch: ["arboriculture"] },
  { ape: "01.45Z", libelle: "Élevage d’ovins et de caprins", categorie: "agricole", motsClesMatch: ["élevage", "éleveur"] },
  // Bien-être / fitness
  { ape: "93.13Z", libelle: "Activités des centres de culture physique", categorie: "commerciale", motsClesMatch: ["salle de sport", "gym", "fitness"] }
];
function searchActivites(query, limit = 6) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const scored = APE_INDEX.map((row) => {
    let score = 0;
    for (const kw of row.motsClesMatch) {
      const k = normalize(kw);
      if (q.includes(k)) score += k.length;
      else if (k.includes(q)) score += q.length;
    }
    if (normalize(row.libelle).includes(q)) score += 5;
    return { row, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.row);
}
function detectReglementation(description) {
  const desc = normalize(description);
  for (const r of REGLEMENTEES) {
    if (r.motsCles.some((mc) => desc.includes(normalize(mc)))) return r;
  }
  return null;
}
function normalize(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}
function base(c) {
  return { contexte: [], ...c };
}
function documentsRequis(d) {
  var _a, _b, _c, _d, _e;
  const docs = [];
  const rule = d.forme ? FORMES[d.forme] : null;
  if (!rule) return docs;
  docs.push(base({
    code: "mandat_swivo",
    titre: "Mandat de dépôt INPI (Swivo)",
    description: "Mandat signé électroniquement nous autorisant à déposer le dossier en votre nom auprès du Guichet unique INPI.",
    format: "pdf_signe",
    obligatoire: true,
    cible: "mandat",
    contexte: ["Obligatoire pour toute formalité de tiers déclarant", "Conforme art. R123-30 Ccom"]
  }));
  const dom = (_a = d.etablissementPrincipal) == null ? void 0 : _a.domiciliation;
  if (dom === "proprietaire") {
    docs.push(base({
      code: "siege_proprietaire",
      titre: "Justificatif de propriété du local du siège",
      description: "Acte de propriété OU dernière taxe foncière (-12 mois).",
      format: "pdf",
      obligatoire: true,
      cible: "siege"
    }));
  } else if (dom === "locataire_bail" || dom === "bail_commercial") {
    docs.push(base({
      code: "siege_bail",
      titre: "Bail commercial / professionnel / habitation autorisant l’activité",
      description: "Bail comportant explicitement l’autorisation d’exercer l’activité au siège.",
      format: "pdf",
      obligatoire: true,
      cible: "siege"
    }));
  } else if (dom === "societe_domiciliation") {
    docs.push(base({
      code: "siege_domiciliation",
      titre: "Contrat de domiciliation",
      description: "Contrat avec une société de domiciliation agréée préfecture (numéro à mentionner).",
      format: "pdf",
      obligatoire: true,
      cible: "siege",
      contexte: ["Société doit posséder agrément préfectoral en cours de validité"]
    }));
  } else if (dom === "chez_dirigeant") {
    docs.push(base({
      code: "siege_attestation_dirigeant",
      titre: "Attestation de domiciliation chez le dirigeant",
      description: "Lettre attestant la domiciliation au domicile personnel du représentant légal + justificatif de domicile -3 mois (facture EDF/GDF/internet/quittance).",
      format: "pdf",
      obligatoire: true,
      cible: "siege",
      contexte: ["Vérifier l’absence de clause d’interdiction du bail / règlement copro", "Durée limitée si interdiction (5 ans max art. L123-11-1 Ccom)"]
    }));
  } else if (dom === "sous_location") {
    docs.push(base({
      code: "siege_sous_location",
      titre: "Autorisation de sous-location + bail principal",
      description: "Bail principal + autorisation écrite du propriétaire + sous-bail signé.",
      format: "pdf",
      obligatoire: true,
      cible: "siege"
    }));
  } else if (dom === "pepiniere") {
    docs.push(base({
      code: "siege_pepiniere",
      titre: "Contrat de pépinière / coworking",
      description: "Convention d’hébergement signée par l’organisme.",
      format: "pdf",
      obligatoire: true,
      cible: "siege"
    }));
  }
  const persPhysIds = /* @__PURE__ */ new Set();
  (d.dirigeants ?? []).forEach((dr, i) => {
    var _a2, _b2, _c2, _d2;
    if (dr.type === "personne_physique") {
      persPhysIds.add(`dir_${i}`);
      docs.push(base({
        code: `id_dirigeant_${i}`,
        titre: `Pièce d’identité dirigeant — ${((_a2 = dr.personne) == null ? void 0 : _a2.prenom) ?? ""} ${((_b2 = dr.personne) == null ? void 0 : _b2.nom) ?? ""}`.trim(),
        description: "Recto/verso CNI en cours de validité OU passeport OU titre de séjour. Lisible, en couleur.",
        format: "image",
        obligatoire: true,
        cible: "dirigeant"
      }));
      docs.push(base({
        code: `nonconv_${i}`,
        titre: `Déclaration de non-condamnation et de filiation — ${((_c2 = dr.personne) == null ? void 0 : _c2.prenom) ?? ""} ${((_d2 = dr.personne) == null ? void 0 : _d2.nom) ?? ""}`.trim(),
        description: "Déclaration sur l’honneur (modèle Swivo), datée < 3 mois, mentionnant : non-condamnation, filiation (parents).",
        format: "pdf_signe",
        obligatoire: true,
        cible: "dirigeant",
        modele: "/modeles/non-condamnation.pdf"
      }));
    }
  });
  (d.associes ?? []).forEach((a, i) => {
    if (a.type === "personne_physique" && !persPhysIds.has(`dir_${i}`)) {
      docs.push(base({
        code: `id_associe_${i}`,
        titre: `Pièce d’identité associé #${i + 1}`,
        description: "Recto/verso CNI / passeport / titre de séjour.",
        format: "image",
        obligatoire: true,
        cible: "associe"
      }));
    }
    if (a.type === "personne_morale") {
      docs.push(base({
        code: `kbis_associe_pm_${i}`,
        titre: `Extrait Kbis associé personne morale #${i + 1}`,
        description: "Kbis < 3 mois de l’associé personne morale.",
        format: "pdf",
        obligatoire: true,
        cible: "associe"
      }));
      docs.push(base({
        code: `delib_associe_pm_${i}`,
        titre: `Délibération autorisant l’apport — associé #${i + 1}`,
        description: "PV d’assemblée autorisant la prise de participation (si statuts l’imposent).",
        format: "pdf",
        obligatoire: false,
        cible: "associe"
      }));
    }
  });
  if (rule.statutsObligatoires) {
    docs.push(base({
      code: "statuts",
      titre: "Statuts signés",
      description: `Statuts datés et signés par tous les associés (paraphes sur chaque page + signature finale précédée de "Lu et approuvé").`,
      format: "pdf_signe",
      obligatoire: true,
      cible: "societe",
      contexte: ["Mention obligatoire : forme, dénomination, siège, objet, durée, capital, apports, exercice social"]
    }));
  }
  if (rule.depotCapitalObligatoire) {
    docs.push(base({
      code: "attestation_depot_capital",
      titre: "Attestation de dépôt de capital",
      description: 'Délivrée par la banque (ou notaire / Caisse des dépôts) à réception des fonds. Mentionne montant, IBAN du compte "compte société en formation".',
      format: "pdf",
      obligatoire: true,
      cible: "societe",
      contexte: ["Compte bloqué jusqu’à immatriculation", "Min. 20% libéré (SARL/EURL) ou 50% (SAS/SASU) à la constitution"]
    }));
  }
  const apportsNature = (d.associes ?? []).flatMap((a) => a.apport.nature ?? []);
  if (apportsNature.length) {
    const maxApportNat = Math.max(...apportsNature.map((n) => n.valeur));
    const totalNat = apportsNature.reduce((s, n) => s + n.valeur, 0);
    const totalCap = ((_b = d.capital) == null ? void 0 : _b.montantTotal) ?? totalNat;
    const seuils = rule.capital.apportNatureCommissaire;
    const needCAC = !!seuils && (maxApportNat > seuils.seuilParApport || totalCap > 0 && totalNat / totalCap * 100 > seuils.totalGtCapitalPct);
    if (needCAC) {
      docs.push(base({
        code: "rapport_cac_apports",
        titre: "Rapport du commissaire aux apports",
        description: "Évaluation des apports en nature par un CAC inscrit (sauf renonciation unanime SAS/SASU sous seuils).",
        format: "pdf_signe",
        obligatoire: true,
        cible: "societe"
      }));
    }
  }
  if (rule.annonceLegaleObligatoire) {
    docs.push(base({
      code: "jal",
      titre: "Attestation de parution au Journal d’Annonces Légales",
      description: "Attestation délivrée par le JAL après publication (mentionnant forme, dénomination, siège, capital, objet, durée, dirigeants).",
      format: "pdf",
      obligatoire: true,
      cible: "societe"
    }));
  }
  if (rule.rbeObligatoire) {
    docs.push(base({
      code: "rbe",
      titre: "Déclaration des bénéficiaires effectifs",
      description: "Formulaire RBE (intégré INPI). Toute personne physique détenant > 25% capital/droits de vote OU exerçant un contrôle. À défaut : représentant légal.",
      format: "attestation_inpi",
      obligatoire: true,
      cible: "beneficiaire_effectif",
      contexte: ["Sanction défaut RBE : 6 mois prison + 7 500 € amende (L561-49 CMF)"]
    }));
  }
  (d.activites ?? []).forEach((act, i) => {
    var _a2, _b2, _c2;
    if (act.reglementee) {
      act.reglementee.piece || act.reglementee;
      docs.push(base({
        code: `reglementation_${i}`,
        titre: `Justificatif d’activité réglementée — ${act.reglementee.type}`,
        description: act.reglementee.piece || "Diplôme / autorisation / inscription à l’ordre, selon la profession.",
        format: "pdf",
        obligatoire: true,
        cible: "activite"
      }));
    }
    if (act.categorie === "artisanale") {
      if (((_a2 = act.artisanat) == null ? void 0 : _a2.stagePrealable) === "a_faire" || ((_b2 = act.artisanat) == null ? void 0 : _b2.stagePrealable) === void 0) {
        docs.push(base({
          code: `spi_${i}`,
          titre: "Stage de Préparation à l’Installation (SPI) — facultatif depuis Loi PACTE",
          description: "Recommandé mais non obligatoire depuis 22/05/2019.",
          format: "pdf",
          obligatoire: false,
          cible: "activite"
        }));
      }
      if ((_c2 = act.qualificationProfessionnelle) == null ? void 0 : _c2.diplome) {
        docs.push(base({
          code: `qualif_artisan_${i}`,
          titre: "Diplôme / CAP / BEP du métier (artisanat qualifié)",
          description: "Décret 98-246 : qualification professionnelle exigée pour certains métiers.",
          format: "pdf",
          obligatoire: true,
          cible: "activite"
        }));
      }
    }
  });
  if (((_c = d.conjoint) == null ? void 0 : _c.statut) === "collaborateur" && ((_d = d.conjoint) == null ? void 0 : _d.personne)) {
    docs.push(base({
      code: "conjoint_collab",
      titre: "Déclaration du conjoint collaborateur",
      description: "Mentions identité conjoint, choix du statut (collaborateur). Obligatoire pour TNS si conjoint participe régulièrement.",
      format: "attestation_inpi",
      obligatoire: true,
      cible: "conjoint"
    }));
    docs.push(base({
      code: "conjoint_id",
      titre: "Pièce d’identité du conjoint",
      description: "CNI / passeport en cours.",
      format: "image",
      obligatoire: true,
      cible: "conjoint"
    }));
  }
  if ((_e = d.ei) == null ? void 0 : _e.declarationInsaisissabiliteAutre) {
    docs.push(base({
      code: "insaisissabilite",
      titre: "Déclaration d’insaisissabilité notariée",
      description: "Acte notarié rendant insaisissables d’autres biens fonciers que la RP.",
      format: "pdf",
      obligatoire: false,
      cible: "societe"
    }));
  }
  (d.etablissementsSecondaires ?? []).forEach((_es, i) => {
    docs.push(base({
      code: `etab_sec_${i}`,
      titre: `Justificatif de jouissance — établissement secondaire #${i + 1}`,
      description: "Bail / contrat de domiciliation / titre de propriété du second établissement.",
      format: "pdf",
      obligatoire: true,
      cible: "siege"
    }));
  });
  return docs;
}
const MANDAT_VERSION = "2026-05-A";
const MANDAT_PRESTATAIRE = "Swivo SAS";
const MANDAT_SCOPE_DEFAUT = [
  "depot_dossier_inpi",
  "signature_formulaire_m0_p0",
  "declaration_beneficiaires_effectifs",
  "transmission_journal_annonces_legales",
  "reception_correspondance_inpi",
  "rectification_mineure_demande_inpi",
  "recuperation_kbis"
];
const MANDAT_TEXTE = `MANDAT DE DÉPÔT — FORMALITÉS GUICHET UNIQUE INPI
Version ${MANDAT_VERSION}

Entre :
- Le déclarant (futur dirigeant ou représentant légal de la société en formation), désigné ci-après "le Mandant",
- ${MANDAT_PRESTATAIRE}, immatriculée au RCS de Paris, désignée ci-après "le Mandataire".

Article 1 — Objet
Le Mandant donne mandat au Mandataire à l’effet de :
  1. Compléter et signer en son nom et pour son compte tout formulaire ou téléprocédure du Guichet unique de l’INPI (procedure-tiers-declarant.fr), notamment la formalité de création d’entreprise ;
  2. Déposer le dossier complet et toutes pièces justificatives ;
  3. Procéder à la déclaration des bénéficiaires effectifs (RBE) lorsqu’elle est requise (art. L561-46 CMF) ;
  4. Transmettre l’annonce légale au journal habilité du département du siège ;
  5. Recevoir la correspondance INPI (accusés, demandes complémentaires) et y répondre dans le périmètre du dossier ;
  6. Récupérer l’extrait Kbis / avis SIREN après immatriculation et le transmettre au Mandant.

Article 2 — Périmètre exclu
Le présent mandat ne comprend pas :
  - La signature des statuts sociaux (réservée aux associés) ;
  - La gestion fiscale et sociale post-immatriculation ;
  - Toute représentation juridique en cas de litige.

Article 3 — Données personnelles & RGPD
Le Mandataire collecte les données strictement nécessaires à la formalité (Règlement (UE) 2016/679). Données hébergées en France, durée de conservation : 10 ans (obligation comptable + preuve dépôt). Le Mandant dispose d’un droit d’accès, rectification, effacement, opposition (dpo@swivo.fr).

Article 4 — Durée
Le mandat prend effet à la signature électronique et expire à l’immatriculation effective au RNE ou en cas de rejet définitif du dossier par l’INPI.

Article 5 — Honoraires
Les honoraires de service sont ceux figurant sur la facture Swivo (29,90 € TTC à la création). Les frais légaux (INPI, greffe, JAL, dépôt capital) sont refacturés à l’euro près.

Article 6 — Responsabilité
Le Mandataire s’engage à une obligation de moyens renforcée. La responsabilité du Mandataire est limitée à la diligence des contrôles effectués sur les pièces transmises par le Mandant. Le Mandant garantit la véracité des informations fournies.

Article 7 — Révocation
Le mandat peut être révoqué à tout moment par lettre recommandée ou email à hello@swivo.fr avant transmission. Après transmission, la révocation n’est effective que dans la mesure où l’INPI accepte le retrait.

Article 8 — Loi applicable
Le présent mandat est régi par le droit français. Tribunaux de Paris compétents.

Signé électroniquement par le Mandant le [DATE_ACCEPTATION]
Adresse IP : [IP] — Empreinte : [EMPREINTE]`;
function buildMandat(opts) {
  return {
    accepte: false,
    versionTexte: MANDAT_VERSION,
    prestataire: MANDAT_PRESTATAIRE,
    scope: (opts == null ? void 0 : opts.scope) ?? MANDAT_SCOPE_DEFAUT,
    ip: opts == null ? void 0 : opts.ip
  };
}
function accepterMandat(d, opts) {
  var _a, _b;
  const mandat = {
    accepte: true,
    dateAcceptation: (/* @__PURE__ */ new Date()).toISOString(),
    versionTexte: MANDAT_VERSION,
    prestataire: MANDAT_PRESTATAIRE,
    scope: ((_a = d.mandat) == null ? void 0 : _a.scope) ?? MANDAT_SCOPE_DEFAUT,
    ip: (opts == null ? void 0 : opts.ip) ?? ((_b = d.mandat) == null ? void 0 : _b.ip)
  };
  return { ...d, mandat };
}
function mandatTexteRendu(d) {
  var _a, _b;
  const date = ((_a = d.mandat) == null ? void 0 : _a.dateAcceptation) ?? "[À SIGNER]";
  return MANDAT_TEXTE.replace("[DATE_ACCEPTATION]", date).replace("[IP]", ((_b = d.mandat) == null ? void 0 : _b.ip) ?? "—").replace("[EMPREINTE]", d.mandat ? hash(JSON.stringify(d.mandat)) : "—");
}
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}
const MICRO_RECO = {
  forme: "micro",
  score: 100,
  pour: [
    "Création gratuite et 100 % en ligne en 5 minutes",
    "Comptabilité ultra-simplifiée : livre des recettes",
    "Cotisations URSSAF proportionnelles au CA — zéro CA, zéro charge",
    "Franchise de TVA jusqu’à 85 000 € / 37 500 €"
  ],
  contre: [],
  eligible: true
};
function recommander(_profil) {
  return [MICRO_RECO];
}
function meilleureForme(_profil) {
  return "micro";
}
function profilDepuisDossier(d) {
  var _a, _b, _c, _d;
  return {
    associes: 1,
    activiteCategorie: ((_b = (_a = d.activites) == null ? void 0 : _a[0]) == null ? void 0 : _b.categorie) === "mixte" ? "commerciale" : (_d = (_c = d.activites) == null ? void 0 : _c[0]) == null ? void 0 : _d.categorie,
    capitalEnvisage: 0
  };
}
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const RE_TEL_FR = /^(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}$/;
const RE_CP = /^\d{5}$/;
const RE_SIREN = /^\d{9}$/;
const RE_SIRET = /^\d{14}$/;
const RE_IBAN_FR = /^FR\d{2}[A-Z0-9]{23}$/;
const RE_BIC = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const RE_NIR = /^[12]\s?\d{2}\s?\d{2}\s?(?:\d{2}|2[AB])\s?\d{3}\s?\d{3}\s?\d{2}$/;
const RE_APE = /^\d{2}\.\d{2}[A-Z]$/;
const Check = {
  email: (v) => !!v && RE_EMAIL.test(v.trim()),
  telephoneFR: (v) => !!v && RE_TEL_FR.test(v.replace(/\s/g, "")),
  codePostal: (v) => !!v && RE_CP.test(v),
  siren: (v) => !!v && RE_SIREN.test(v) && luhnSiren(v),
  siret: (v) => !!v && RE_SIRET.test(v) && luhnSiret(v),
  iban: (v) => !!v && RE_IBAN_FR.test(v.replace(/\s/g, "")) && ibanCheck(v.replace(/\s/g, "")),
  bic: (v) => !!v && RE_BIC.test(v),
  nir: (v) => !!v && RE_NIR.test(v.replace(/\s/g, "")),
  ape: (v) => !!v && RE_APE.test(v),
  dateISO: (v) => !!v && !Number.isNaN(Date.parse(v)),
  majeur: (dateNaissance) => {
    if (!dateNaissance) return false;
    const d = new Date(dateNaissance);
    const min = /* @__PURE__ */ new Date();
    min.setFullYear(min.getFullYear() - 18);
    return d <= min;
  }
};
function luhnSiren(s) {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = parseInt(s[i], 10);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}
function luhnSiret(s) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let n = parseInt(s[i], 10);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}
function ibanCheck(iban) {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.split("").map((c) => /[A-Z]/.test(c) ? (c.charCodeAt(0) - 55).toString() : c).join("");
  let rest = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    rest = parseInt(String(rest) + numeric.slice(i, i + 7), 10) % 97;
  }
  return rest === 1;
}
function pushIfMissing(issues, cond, issue) {
  if (!cond) issues.push({ level: "error", ...issue });
}
function validatePersonne(p, prefix, issues) {
  if (!p) {
    issues.push({ code: "missing_personne", level: "error", message: `${prefix} : informations manquantes`, field: prefix });
    return;
  }
  pushIfMissing(issues, !!p.civilite, { code: "missing_civilite", message: `${prefix} : civilité requise`, field: `${prefix}.civilite` });
  pushIfMissing(issues, !!p.prenom && p.prenom.length >= 2, { code: "missing_prenom", message: `${prefix} : prénom requis`, field: `${prefix}.prenom` });
  pushIfMissing(issues, !!p.nom && p.nom.length >= 2, { code: "missing_nom", message: `${prefix} : nom requis`, field: `${prefix}.nom` });
  pushIfMissing(issues, !!p.dateNaissance && Check.dateISO(p.dateNaissance), { code: "missing_date_nais", message: `${prefix} : date de naissance invalide`, field: `${prefix}.dateNaissance` });
  pushIfMissing(issues, Check.majeur(p.dateNaissance), { code: "mineur", message: `${prefix} : doit être majeur`, field: `${prefix}.dateNaissance` });
  pushIfMissing(issues, !!p.lieuNaissance, { code: "missing_lieu_nais", message: `${prefix} : lieu de naissance requis`, field: `${prefix}.lieuNaissance` });
  pushIfMissing(issues, !!p.nationalite && p.nationalite.length === 3, { code: "missing_nationalite", message: `${prefix} : nationalité (ISO-3) requise`, field: `${prefix}.nationalite` });
  validateAdresse(p.domicile, `${prefix}.domicile`, issues);
  if (p.email && !Check.email(p.email)) issues.push({ code: "bad_email", level: "error", message: `${prefix} : email invalide`, field: `${prefix}.email` });
  if (p.telephone && !Check.telephoneFR(p.telephone)) issues.push({ code: "bad_tel", level: "warn", message: `${prefix} : téléphone douteux`, field: `${prefix}.telephone` });
}
function validateAdresse(a, prefix, issues) {
  if (!a) {
    issues.push({ code: "missing_adresse", level: "error", message: `${prefix} : adresse requise`, field: prefix });
    return;
  }
  pushIfMissing(issues, !!a.voie && a.voie.length >= 4, { code: "missing_voie", message: `${prefix} : voie requise`, field: `${prefix}.voie` });
  pushIfMissing(issues, Check.codePostal(a.codePostal), { code: "bad_cp", message: `${prefix} : code postal invalide`, field: `${prefix}.codePostal` });
  pushIfMissing(issues, !!a.commune && a.commune.length >= 2, { code: "missing_commune", message: `${prefix} : commune requise`, field: `${prefix}.commune` });
}
function validate(d) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
  const issues = [];
  if (!d.forme) issues.push({ code: "missing_forme", level: "error", message: "Forme juridique non sélectionnée" });
  const rule = d.forme ? FORMES[d.forme] : null;
  if (rule == null ? void 0 : rule.isSociete) {
    pushIfMissing(issues, !!d.denomination && d.denomination.length >= 2, { code: "missing_denom", message: "Dénomination sociale requise (≥ 2 caractères)", field: "denomination" });
    pushIfMissing(issues, !!d.objetSocial && d.objetSocial.length >= 20, { code: "objet_court", message: "Objet social trop court (≥ 20 caractères, décrire activités présentes et futures)", field: "objetSocial" });
    pushIfMissing(issues, !!d.duree && d.duree > 0 && d.duree <= 99, { code: "duree", message: "Durée sociale entre 1 et 99 ans", field: "duree" });
    pushIfMissing(issues, !!d.dateClotureExercice, { code: "cloture", message: "Date de clôture du 1er exercice requise", field: "dateClotureExercice" });
  }
  if (!((_a = d.activites) == null ? void 0 : _a.length)) issues.push({ code: "no_activite", level: "error", message: "Au moins une activité requise", field: "activites" });
  for (let i = 0; i < (((_b = d.activites) == null ? void 0 : _b.length) ?? 0); i++) {
    const act = d.activites[i];
    if (!act.description || act.description.length < 10) issues.push({ code: "desc_act_courte", level: "error", message: `Activité #${i + 1} : description trop courte (≥ 10 caractères)`, field: `activites[${i}].description` });
    if (act.ape && !Check.ape(act.ape)) issues.push({ code: "ape_format", level: "warn", message: `Activité #${i + 1} : format APE attendu NN.NNL`, field: `activites[${i}].ape` });
    if (act.reglementee && !((_c = act.qualificationProfessionnelle) == null ? void 0 : _c.diplome) && !((_d = act.qualificationProfessionnelle) == null ? void 0 : _d.experienceAnnees)) {
      issues.push({ code: "reglementee_sans_qualif", level: "error", message: `Activité réglementée "${act.reglementee.type}" : qualification ou expérience requise`, field: `activites[${i}].qualification` });
    }
  }
  if (d.forme === "micro" && ((_e = d.activites) == null ? void 0 : _e.some((a) => a.categorie === "liberale_reglementee" && /avocat|notaire|huissier/i.test(a.description)))) {
    issues.push({ code: "micro_interdite", level: "error", message: "Activité interdite en micro-entreprise", field: "forme" });
  }
  validateAdresse((_f = d.etablissementPrincipal) == null ? void 0 : _f.adresse, "siege.adresse", issues);
  pushIfMissing(issues, !!((_g = d.etablissementPrincipal) == null ? void 0 : _g.domiciliation), { code: "mode_domiciliation", message: "Mode de domiciliation requis", field: "etablissementPrincipal.domiciliation" });
  if (((_h = d.etablissementPrincipal) == null ? void 0 : _h.domiciliation) === "societe_domiciliation") {
    pushIfMissing(issues, !!((_j = (_i = d.etablissementPrincipal) == null ? void 0 : _i.societeDomiciliation) == null ? void 0 : _j.siren) && Check.siren(d.etablissementPrincipal.societeDomiciliation.siren), { code: "dom_siren", message: "SIREN société de domiciliation invalide", field: "etablissementPrincipal.societeDomiciliation.siren" });
    pushIfMissing(issues, !!((_l = (_k = d.etablissementPrincipal) == null ? void 0 : _k.societeDomiciliation) == null ? void 0 : _l.agrementPrefecture), { code: "dom_agrement", message: "N° d’agrément préfectoral de la société de domiciliation requis", field: "etablissementPrincipal.societeDomiciliation.agrementPrefecture" });
  }
  pushIfMissing(issues, !!((_m = d.etablissementPrincipal) == null ? void 0 : _m.dateDebutActivite) && Check.dateISO(d.etablissementPrincipal.dateDebutActivite), { code: "date_debut", message: "Date de début d’activité requise", field: "etablissementPrincipal.dateDebutActivite" });
  if (rule == null ? void 0 : rule.isSociete) {
    const minAssocies = rule.associes.min;
    if (!((_n = d.associes) == null ? void 0 : _n.length) || d.associes.length < minAssocies) {
      issues.push({ code: "assoc_min", level: "error", message: `Au moins ${minAssocies} associé(s) requis pour ${rule.shortLabel}`, field: "associes" });
    }
    if (rule.associes.max && d.associes && d.associes.length > rule.associes.max) {
      issues.push({ code: "assoc_max", level: "error", message: `Max ${rule.associes.max} associés pour ${rule.shortLabel}`, field: "associes" });
    }
    (_o = d.associes) == null ? void 0 : _o.forEach((a, i) => validateAssocie(a, i, issues));
    if (rule.capital.requis) {
      const totalApports = (d.associes ?? []).reduce((s, a) => s + apportTotal(a), 0);
      pushIfMissing(issues, totalApports >= rule.capital.montantMin, { code: "capital_min", message: `Capital minimum ${rule.capital.montantMin} € pour ${rule.shortLabel}`, field: "capital.montantTotal" });
      if (rule.capital.libereMinPctApports) {
        const numTotal = (d.associes ?? []).reduce((s, a) => s + (a.apport.numeraire ?? 0), 0);
        const numLibere = (d.associes ?? []).reduce((s, a) => s + (a.apport.numeraireLibere ?? 0), 0);
        if (numTotal > 0) {
          const pct = numLibere / numTotal * 100;
          pushIfMissing(issues, pct >= rule.capital.libereMinPctApports, { code: "capital_libere", message: `Libération min ${rule.capital.libereMinPctApports}% du numéraire à la constitution`, field: "capital.montantLibere" });
        }
      }
      if (rule.capital.apportNatureCommissaire) {
        const nature = (d.associes ?? []).flatMap((a) => a.apport.nature ?? []);
        const maxApportNat = nature.reduce((m, n) => Math.max(m, n.valeur), 0);
        const totalNat = nature.reduce((s, n) => s + n.valeur, 0);
        const totalCap = (((_p = d.capital) == null ? void 0 : _p.montantTotal) ?? 0) || totalApports;
        const seuilApport = rule.capital.apportNatureCommissaire.seuilParApport;
        const seuilTotalPct = rule.capital.apportNatureCommissaire.totalGtCapitalPct;
        if (seuilApport > 0 && maxApportNat > seuilApport || totalCap > 0 && totalNat / totalCap * 100 > seuilTotalPct) {
          issues.push({ code: "cac_apports", level: "warn", message: "Commissaire aux apports requis (seuils Loi Sapin/PACTE dépassés)", field: "capital.apports" });
        }
      }
    }
    if (rule.depotCapitalObligatoire) {
      pushIfMissing(issues, !!((_q = d.depotCapital) == null ? void 0 : _q.attestationFournie), { code: "depot_attest", message: "Attestation de dépôt de capital manquante", field: "depotCapital.attestationFournie" });
      pushIfMissing(issues, Check.iban((_r = d.depotCapital) == null ? void 0 : _r.iban), { code: "depot_iban", message: "IBAN du compte de dépôt invalide", field: "depotCapital.iban" });
    }
    if (rule.annonceLegaleObligatoire) {
      pushIfMissing(issues, !!((_s = d.annonceLegale) == null ? void 0 : _s.refAttestation), { code: "jal_attest", message: "Attestation de parution journal d’annonces légales requise", field: "annonceLegale.refAttestation" });
    }
    if (rule.rbeObligatoire) {
      if (!((_t = d.beneficiairesEffectifs) == null ? void 0 : _t.length)) {
        issues.push({ code: "rbe_vide", level: "error", message: "Déclaration des bénéficiaires effectifs requise (R561-1 CMF)", field: "beneficiairesEffectifs" });
      } else {
        const sumCap = d.beneficiairesEffectifs.reduce((s, b) => s + (b.pctCapital ?? 0), 0);
        if (sumCap > 100.01) issues.push({ code: "rbe_sum", level: "error", message: "Somme des % capital RBE > 100", field: "beneficiairesEffectifs" });
      }
    }
  }
  if (rule == null ? void 0 : rule.isSociete) {
    if (!((_u = d.dirigeants) == null ? void 0 : _u.length) || d.dirigeants.length < rule.dirigeants.min) {
      issues.push({ code: "dir_min", level: "error", message: `Au moins ${rule.dirigeants.min} dirigeant(s) requis (${rule.dirigeants.titres.join("/")})`, field: "dirigeants" });
    }
    (_v = d.dirigeants) == null ? void 0 : _v.forEach((dr, i) => validateDirigeant(dr, i, issues));
  } else {
    if (!((_w = d.dirigeants) == null ? void 0 : _w.length)) issues.push({ code: "ei_dirigeant", level: "error", message: "Identité de l’entrepreneur individuel requise", field: "dirigeants" });
    (_x = d.dirigeants) == null ? void 0 : _x.forEach((dr, i) => validateDirigeant(dr, i, issues));
  }
  pushIfMissing(issues, !!((_y = d.mandat) == null ? void 0 : _y.accepte), { code: "mandat", message: "Le mandat de dépôt Swivo doit être accepté pour transmission INPI", field: "mandat.accepte" });
  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warn").length;
  const totalFields = countRequiredFields(d);
  const missing = errors;
  const scoreCompletude = Math.max(0, Math.min(100, Math.round((totalFields - missing) / Math.max(1, totalFields) * 100)));
  const scoreConformite = Math.max(0, 100 - errors * 8 - warnings * 2);
  const pretATransmettre = errors === 0 && !!((_z = d.mandat) == null ? void 0 : _z.accepte);
  return { ok: errors === 0, issues, scoreCompletude, scoreConformite, pretATransmettre };
}
function validateAssocie(a, i, issues) {
  var _a, _b, _c;
  if (a.type === "personne_physique") validatePersonne(a.personne, `associes[${i}].personne`, issues);
  else {
    pushIfMissing(issues, !!((_a = a.morale) == null ? void 0 : _a.denomination), { code: "pm_denom", message: `Associé #${i + 1} (PM) : dénomination requise`, field: `associes[${i}].morale.denomination` });
    pushIfMissing(issues, Check.siren((_b = a.morale) == null ? void 0 : _b.siren), { code: "pm_siren", message: `Associé #${i + 1} (PM) : SIREN invalide`, field: `associes[${i}].morale.siren` });
    validatePersonne((_c = a.morale) == null ? void 0 : _c.representant, `associes[${i}].morale.representant`, issues);
  }
  if (apportTotal(a) <= 0) issues.push({ code: "apport_vide", level: "error", message: `Associé #${i + 1} : apport requis (> 0 €)`, field: `associes[${i}].apport` });
}
function validateDirigeant(dr, i, issues) {
  var _a;
  if (!dr.fonction) issues.push({ code: "dir_fonction", level: "error", message: `Dirigeant #${i + 1} : fonction requise`, field: `dirigeants[${i}].fonction` });
  if (dr.type === "personne_physique") validatePersonne(dr.personne, `dirigeants[${i}].personne`, issues);
  else validatePersonne((_a = dr.morale) == null ? void 0 : _a.representant, `dirigeants[${i}].morale.representant`, issues);
}
function apportTotal(a) {
  const num = a.apport.numeraire ?? 0;
  const nat = (a.apport.nature ?? []).reduce((s, n) => s + n.valeur, 0);
  return num + nat;
}
function countRequiredFields(d) {
  const rule = d.forme ? FORMES[d.forme] : null;
  let n = 8;
  if (rule == null ? void 0 : rule.isSociete) n += 12;
  if (rule == null ? void 0 : rule.capital.requis) n += 4;
  if (rule == null ? void 0 : rule.depotCapitalObligatoire) n += 3;
  if (rule == null ? void 0 : rule.annonceLegaleObligatoire) n += 1;
  if (rule == null ? void 0 : rule.rbeObligatoire) n += 3;
  return n;
}
const RE = /^\s*([12378])\s?(\d{2})\s?(\d{2})\s?(\d{2}|2A|2B)\s?(\d{3})\s?(\d{3})\s?(\d{2})\s*$/i;
function parseNir(raw) {
  if (!raw) return { raw, valid: false, moisRaw: 0 };
  const cleaned = raw.replace(/\s/g, "").toUpperCase();
  const m = RE.exec(cleaned);
  if (!m) return { raw: cleaned, valid: false, moisRaw: 0 };
  const [, sexeS, yyS, mmS, deptS, comS, ordS, keyS] = m;
  const sexe = sexeS === "1" ? "M" : sexeS === "2" ? "Mme" : void 0;
  const yy = parseInt(yyS, 10);
  const currentYy = (/* @__PURE__ */ new Date()).getFullYear() % 100;
  const annee = yy > currentYy + 1 ? 1900 + yy : 2e3 + yy;
  let anneeNaissance = annee;
  const ageProbable = (/* @__PURE__ */ new Date()).getFullYear() - anneeNaissance;
  if (ageProbable > 110) anneeNaissance += 100;
  if (ageProbable < 14) anneeNaissance -= 100;
  const mmRaw = parseInt(mmS, 10);
  const moisNaissance = mmRaw >= 1 && mmRaw <= 12 ? mmRaw : void 0;
  let departementCode = deptS;
  if (deptS === "2A" || deptS === "2B") departementCode = deptS;
  else if (deptS === "97" || deptS === "98") {
    const fullDept = "97" + ((comS == null ? void 0 : comS.charAt(0)) ?? "");
    departementCode = fullDept;
  } else if (deptS === "99") {
    departementCode = "99";
  }
  const numericForKey = sexeS + yyS + mmS.replace("A", "0").replace("B", "0") + deptS.replace("A", "0").replace("B", "0") + comS + ordS;
  let cleOk = false;
  try {
    let n = BigInt(numericForKey);
    if (deptS === "2A") n = n - 1000000n;
    if (deptS === "2B") n = n - 2000000n;
    const expected = 97n - n % 97n;
    cleOk = expected === BigInt(keyS);
  } catch {
    cleOk = false;
  }
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
    cleControle: parseInt(keyS, 10),
    pays: departementCode === "99" ? "ETR" : "FRA"
  };
}
function nirToPersonne(nir) {
  const p = parseNir(nir);
  if (!p.valid) return null;
  const date = p.anneeNaissance && p.moisNaissance ? `${p.anneeNaissance}-${String(p.moisNaissance).padStart(2, "0")}-01` : p.anneeNaissance ? `${p.anneeNaissance}-01-01` : void 0;
  return {
    civilite: p.sexe,
    dateNaissance: date,
    paysNaissance: p.pays === "ETR" ? void 0 : "FRA",
    departementNaissance: p.departementCode
  };
}
const QUESTIONS = [
  /* ===== INTRO MICRO ===== */
  {
    id: "micro_intro",
    category: "profil",
    title: "Votre micro-entreprise — démarrage en 5 minutes",
    help: "Quelques questions ciblées, puis nous transmettons votre déclaration au Guichet unique INPI sous 24 h.",
    field: { kind: "recap" },
    applicable: () => true,
    apply: (_, d) => {
      var _a;
      return { ...d, forme: "micro", associes: ((_a = d.associes) == null ? void 0 : _a.length) ? d.associes : [emptyAssocie()] };
    }
  },
  {
    id: "id_scan",
    category: "identite",
    title: "Scannez votre pièce d'identité (recto + verso) pour pré-remplir",
    help: "Téléversez le recto ET le verso de votre CNI (ou la page principale du passeport). Nous lisons la MRZ (verso) + les libellés (recto) pour pré-remplir civilité, prénoms, nom, date et lieu de naissance, nationalité, et n° de pièce. Vos données restent sur votre appareil.",
    field: { kind: "id-scan" },
    applicable: (d) => {
      var _a, _b, _c, _d, _e, _f;
      return !((_c = (_b = (_a = d.dirigeants) == null ? void 0 : _a[0]) == null ? void 0 : _b.personne) == null ? void 0 : _c.prenom) || !((_f = (_e = (_d = d.dirigeants) == null ? void 0 : _d[0]) == null ? void 0 : _e.personne) == null ? void 0 : _f.dateNaissance);
    },
    apply: (v, d) => {
      var _a;
      if (!v) return d;
      const dir = ((_a = d.dirigeants) == null ? void 0 : _a[0]) ?? { type: "personne_physique", fonction: "gerant", personne: {} };
      const p = { ...dir.personne ?? {} };
      if (v.civilite && !p.civilite) p.civilite = v.civilite;
      if (v.prenom && !p.prenom) p.prenom = v.prenom;
      if (v.nom && !p.nom) p.nom = v.nom;
      if (v.nomUsage && !p.nomUsage) p.nomUsage = v.nomUsage;
      if (v.dateNaissance && !p.dateNaissance) p.dateNaissance = v.dateNaissance;
      if (v.lieuNaissance && !p.lieuNaissance) p.lieuNaissance = v.lieuNaissance;
      if (v.nationalite && !p.nationalite) p.nationalite = v.nationalite;
      if (v.nationalite === "FRA" && !p.paysNaissance) p.paysNaissance = "FRA";
      const options = { ...d.options ?? {} };
      if (v.numeroDocument && !options.numeroPieceIdentite) options.numeroPieceIdentite = v.numeroDocument;
      if (Array.isArray(v.prenomsTous) && v.prenomsTous.length > 1 && !options.prenomsTous) options.prenomsTous = v.prenomsTous;
      if (v.dateExpiration && !options.pieceIdentiteExpiration) options.pieceIdentiteExpiration = v.dateExpiration;
      return {
        ...d,
        options,
        dirigeants: [{ ...dir, personne: p }, ...(d.dirigeants ?? []).slice(1)]
      };
    }
  },
  {
    id: "nir_input",
    category: "identite",
    title: "Votre numéro de sécurité sociale (optionnel)",
    help: "Permet de pré-remplir civilité, date et département de naissance. Stocké chiffré côté serveur.",
    field: { kind: "nir" },
    applicable: (d) => {
      var _a, _b, _c, _d;
      return !((_a = d.options) == null ? void 0 : _a.nir) && !((_d = (_c = (_b = d.dirigeants) == null ? void 0 : _b[0]) == null ? void 0 : _c.personne) == null ? void 0 : _d.dateNaissance);
    },
    apply: (v, d) => {
      var _a;
      if (!v) return d;
      const parsed = nirToPersonne(v);
      if (!parsed) return d;
      const dir = ((_a = d.dirigeants) == null ? void 0 : _a[0]) ?? { type: "personne_physique", fonction: "gerant", personne: {} };
      const p = { ...dir.personne ?? {} };
      if (parsed.civilite && !p.civilite) p.civilite = parsed.civilite;
      if (parsed.dateNaissance && !p.dateNaissance) p.dateNaissance = parsed.dateNaissance;
      if (parsed.paysNaissance && !p.paysNaissance) p.paysNaissance = parsed.paysNaissance;
      return {
        ...d,
        options: { ...d.options ?? {}, nir: v },
        dirigeants: [{ ...dir, personne: p }, ...(d.dirigeants ?? []).slice(1)]
      };
    }
  },
  /* ===== DOMICILE PERSONNEL DU DIRIGEANT (obligatoire micro) =====
     Le Guichet unique exige l'adresse personnelle même si elle est identique
     au siège — c'est une donnée d'état civil distincte. */
  {
    id: "dirigeant_domicile",
    category: "identite",
    title: "Adresse de votre domicile personnel",
    help: "Obligatoire — adresse de résidence du déclarant. Distincte du siège, même si elles sont identiques.",
    field: { kind: "address" },
    applicable: () => true,
    validateStep: (v) => {
      const a = v ?? {};
      const errs = [];
      if (!a.voie || a.voie.trim().length < 4) errs.push("Voie requise (n° + rue).");
      if (!Check.codePostal(a.codePostal)) errs.push("Code postal invalide (5 chiffres).");
      if (!a.commune || a.commune.trim().length < 2) errs.push("Commune requise.");
      return errs;
    },
    apply: (v, d) => {
      var _a;
      const dir = ((_a = d.dirigeants) == null ? void 0 : _a[0]) ?? { type: "personne_physique", fonction: "gerant", personne: {} };
      const personne = { ...dir.personne ?? {}, domicile: v };
      const ep = d.etablissementPrincipal;
      const next = {
        ...d,
        dirigeants: [{ ...dir, personne }, ...(d.dirigeants ?? []).slice(1)]
      };
      if (!ep || ep.domiciliation === "chez_dirigeant") {
        next.etablissementPrincipal = {
          ...ep ?? { domiciliation: "chez_dirigeant" },
          adresse: { ...v }
        };
      }
      return next;
    }
  },
  /* Désactivé après pivot micro-only — toujours 1 entrepreneur. */
  {
    id: "p_associes",
    category: "profil",
    title: "Vous lancez-vous seul·e ou à plusieurs ?",
    field: { kind: "choice", columns: 3, visual: "tiles", options: [
      { value: "1", label: "Seul·e", icon: "🧑‍💼", iconOnly: true },
      { value: "2", label: "À deux", icon: "👥", iconOnly: true },
      { value: "3", label: "À 3 ou plus", icon: "👨‍👩‍👧", iconOnly: true }
    ] },
    applicable: () => false,
    apply: (v, d) => ({ ...d, associes: Array.from({ length: Math.max(1, parseInt(v, 10)) }, () => emptyAssocie()) })
  },
  {
    id: "p_activite_categorie",
    category: "profil",
    title: "Type d’activité principale ?",
    help: "Détermine la catégorie INPI (commerce, artisanat, libéral, agricole).",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "commerciale", label: "Commerciale", hint: "Achat-revente, e-commerce, restauration", icon: "🏪" },
      { value: "artisanale", label: "Artisanale", hint: "Métiers manuels < 10 salariés", icon: "🔨" },
      { value: "liberale_non_reglementee", label: "Libérale non réglementée", hint: "Consulting, dev, design…", icon: "💼" },
      { value: "liberale_reglementee", label: "Libérale réglementée", hint: "Avocat, médecin, expert-comptable…", icon: "⚖️" }
    ] },
    applicable: () => true,
    apply: (v, d) => upsertActivite(d, { categorie: v })
  },
  {
    id: "p_levee",
    category: "profil",
    title: "Envisagez-vous des investisseurs / une levée de fonds ?",
    field: { kind: "choice", columns: 3, visual: "tiles", options: [
      { value: "non", label: "Non, jamais", icon: "🚫" },
      { value: "peutetre", label: "Peut-être plus tard", icon: "🤔" },
      { value: "oui", label: "Oui, à court terme", icon: "🚀" }
    ] },
    applicable: () => false,
    apply: (v, d) => ({ ...d, options: { ...d.options, _levee: v } })
  },
  {
    id: "p_ca",
    category: "profil",
    title: "CA prévisionnel année 1 ?",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "15000", label: "< 30 000 €", icon: "🌱" },
      { value: "60000", label: "30 000 – 80 000 €", icon: "📈" },
      { value: "150000", label: "80 000 – 250 000 €", icon: "💰" },
      { value: "500000", label: "> 250 000 €", icon: "🏆" }
    ] },
    applicable: () => true,
    apply: (v, d) => ({ ...d, options: { ...d.options, _caEstime: parseInt(v, 10) } })
  },
  {
    id: "p_patrimoine",
    category: "profil",
    title: "Protection du patrimoine personnel ?",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "protege", label: "Important — protéger au max", icon: "🛡️" },
      { value: "indiff", label: "Pas critique", icon: "🤷" }
    ] },
    applicable: () => false,
    apply: (v, d) => ({ ...d, options: { ...d.options, _patrimoine: v } })
  },
  {
    id: "p_social",
    category: "profil",
    title: "Protection sociale souhaitée ?",
    field: { kind: "choice", columns: 3, visual: "tiles", options: [
      { value: "salarie_complete", label: "Régime général (assimilé salarié)", hint: "Couverture maladie complète, retraite cadre", icon: "🩺" },
      { value: "tns_economique", label: "Cotisations réduites (TNS)", hint: "URSSAF allégée, retraite à compléter", icon: "💸" },
      { value: "indiff", label: "Peu importe", icon: "🤷" }
    ] },
    applicable: () => false,
    apply: (v, d) => ({ ...d, options: { ...d.options, _social: v } })
  },
  {
    id: "p_fiscal",
    category: "profil",
    title: "Préférence fiscale ?",
    field: { kind: "choice", columns: 3, visual: "tiles", options: [
      { value: "ir_passthrough", label: "IR — transparence", hint: "Revenus = impôt perso", icon: "👤" },
      { value: "is_dividendes", label: "IS — dividendes", hint: "Société paie IS, dividendes", icon: "🏢" },
      { value: "indiff", label: "Conseillez-moi", icon: "💡" }
    ] },
    applicable: () => false,
    apply: (v, d) => ({ ...d, options: { ...d.options, _fiscal: v } })
  },
  /* ===== RECOMMANDATION FORME ===== */
  {
    id: "recommend",
    category: "profil",
    title: "Forme juridique recommandée",
    field: { kind: "recap" },
    applicable: () => false,
    apply: (value, d) => {
      if (typeof value === "string" && value in FORMES) {
        return { ...d, forme: value, options: { ...d.options, _formeChosen: true } };
      }
      computeProfil(d);
      const forme = meilleureForme();
      return { ...d, forme };
    }
  },
  {
    id: "forme_override",
    category: "profil",
    title: "Souhaitez-vous changer la forme proposée ?",
    field: { kind: "choice", columns: 3, visual: "tiles", options: [
      { value: "keep", label: "Garder la recommandation", icon: "✅" },
      { value: "micro", label: "Micro-entreprise", icon: "🌱" },
      { value: "ei", label: "EI", icon: "🧑" },
      { value: "eurl", label: "EURL", icon: "🧑‍💼" },
      { value: "sasu", label: "SASU", icon: "🚀" },
      { value: "sas", label: "SAS", icon: "🏢" },
      { value: "sarl", label: "SARL", icon: "🤝" },
      { value: "sa", label: "SA", icon: "🏛️" },
      { value: "sci", label: "SCI", icon: "🏠" }
    ] },
    // Désactivé après pivot micro-only.
    applicable: () => false,
    apply: (v, d) => v === "keep" ? d : { ...d, forme: v }
  },
  /* ===== ACTIVITÉS (description précise + APE) ===== */
  {
    id: "act_description",
    category: "activite",
    title: "Décrivez précisément votre activité principale",
    help: "L’INPI exige une description claire. Mentionnez les produits/services concrets (≥ 20 caractères).",
    field: { kind: "text", placeholder: "Conseil en transformation digitale pour PME du secteur retail", multiline: true },
    applicable: () => true,
    validateStep: (v) => {
      const s = String(v ?? "").trim();
      const errs = [];
      if (s.length < 20) errs.push("Description trop courte : minimum 20 caractères (l’INPI rejette les libellés vagues).");
      if (s.length > 500) errs.push("Description trop longue : maximum 500 caractères.");
      if (/^[A-ZÉÈ ]+$/.test(s)) errs.push("Évitez le texte tout en majuscules.");
      return errs;
    },
    apply: (v, d) => {
      var _a;
      const activite = d.activites[0] ?? {};
      const reglementee = detectReglementation(v);
      const suggestions = searchActivites(v);
      const ape = (_a = suggestions[0]) == null ? void 0 : _a.ape;
      return upsertActivite(d, { description: v, reglementee: reglementee ? { type: reglementee.type, piece: reglementee.piecesRequises.join(" · ") } : activite.reglementee, ape });
    }
  },
  {
    id: "act_reglementation",
    category: "activite",
    title: "Cette activité est réglementée — disposez-vous des qualifications ?",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "diplome", label: "Oui, diplôme requis", icon: "🎓" },
      { value: "experience", label: "Oui, 3+ ans d’expérience", icon: "🛠️" },
      { value: "inscription", label: "Inscrit à l’Ordre", icon: "📜" },
      { value: "non", label: "Non, pas encore", icon: "⚠️" }
    ] },
    applicable: (d) => {
      var _a, _b;
      return !!((_b = (_a = d.activites) == null ? void 0 : _a[0]) == null ? void 0 : _b.reglementee);
    },
    apply: (v, d) => {
      const a = d.activites[0];
      const q = v === "diplome" ? { diplome: "À préciser" } : v === "experience" ? { experienceAnnees: 3 } : v === "inscription" ? { diplome: "Inscription ordre" } : void 0;
      d.activites[0] = { ...a, qualificationProfessionnelle: q };
      return { ...d };
    }
  },
  {
    id: "act_ape_confirm",
    category: "activite",
    title: "Code APE/NAF proposé",
    help: "L’INSEE attribue le code définitif après immatriculation — celui-ci est indicatif.",
    field: { kind: "recap" },
    applicable: (d) => {
      var _a, _b;
      return !!((_b = (_a = d.activites) == null ? void 0 : _a[0]) == null ? void 0 : _b.ape);
    },
    apply: (_, d) => d
  },
  /* ===== SOCIÉTÉ — dénomination, objet ===== */
  {
    id: "soc_denomination",
    category: "societe",
    title: "Dénomination sociale",
    help: "Nom officiel de la société. Vérifiez la disponibilité (INPI marques + societe.com).",
    field: { kind: "text", placeholder: "Ex : Atelier Numérique du Nord" },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    validateStep: (v) => {
      const s = String(v ?? "").trim();
      const errs = [];
      if (s.length < 2) errs.push("Dénomination requise (≥ 2 caractères).");
      if (s.length > 120) errs.push("Dénomination trop longue (max 120 caractères).");
      if (/^(la |le |les |sas |sasu |sarl )/i.test(s)) errs.push('Évitez de commencer par "La/Le/SAS/SARL" — la forme sera ajoutée automatiquement.');
      return errs;
    },
    apply: (v, d) => ({ ...d, denomination: String(v).trim() })
  },
  {
    id: "soc_sigle",
    category: "societe",
    title: "Sigle (facultatif)",
    field: { kind: "text", placeholder: "Ex : ANN" },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    apply: (v, d) => ({ ...d, sigle: v || void 0 })
  },
  {
    id: "soc_objet",
    category: "societe",
    title: "Objet social complet",
    help: "Décrivez activités présentes ET futures envisageables, pour éviter une modification statutaire ultérieure.",
    field: { kind: "text", multiline: true, placeholder: "Le conseil en stratégie digitale, l’édition de logiciels, la formation professionnelle ; et plus généralement toutes opérations…" },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    validateStep: (v) => {
      const s = String(v ?? "").trim();
      const errs = [];
      if (s.length < 20) errs.push("Objet social trop court (≥ 20 caractères). Décrivez activités présentes et futures.");
      if (s.length > 1500) errs.push("Objet social trop long (max 1500 caractères).");
      return errs;
    },
    apply: (v, d) => ({ ...d, objetSocial: String(v).trim() })
  },
  {
    id: "soc_duree",
    category: "societe",
    title: "Durée de la société",
    field: { kind: "number", min: 1, max: 99, suffix: "années" },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    validateStep: (v) => {
      const n = parseInt(String(v), 10);
      if (Number.isNaN(n) || n < 1 || n > 99) return ["Durée entre 1 et 99 ans (par défaut : 99)."];
      return [];
    },
    apply: (v, d) => ({ ...d, duree: parseInt(String(v), 10) || 99 })
  },
  {
    id: "soc_cloture",
    category: "societe",
    title: "Date de clôture du 1er exercice",
    help: "Souvent le 31/12 (année civile) ou 31/03/30/06/30/09. Le 1er exercice peut durer jusqu’à 24 mois.",
    field: { kind: "date" },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    validateStep: (v) => {
      if (!v || !Check.dateISO(String(v))) return ["Date invalide."];
      const d = new Date(String(v));
      const now = /* @__PURE__ */ new Date();
      const max = /* @__PURE__ */ new Date();
      max.setMonth(max.getMonth() + 24);
      if (d <= now) return ["La clôture doit être future."];
      if (d > max) return ["Le 1er exercice ne peut excéder 24 mois."];
      return [];
    },
    apply: (v, d) => ({ ...d, dateClotureExercice: v })
  },
  /* ===== SIÈGE ===== */
  {
    id: "siege_mode",
    category: "siege",
    title: "Où sera domicilié le siège social ?",
    field: { kind: "choice", columns: 3, visual: "tiles", options: [
      { value: "chez_dirigeant", label: "Domicile dirigeant", hint: "Vérifier bail / copro", icon: "🏠" },
      { value: "locataire_bail", label: "Local en location", hint: "Bail commercial / pro", icon: "🏬" },
      { value: "proprietaire", label: "Local en propriété", hint: "Acte ou taxe foncière", icon: "🔑" },
      { value: "societe_domiciliation", label: "Société domiciliation", hint: "Agrément préfecture", icon: "📬" },
      { value: "pepiniere", label: "Pépinière / coworking", hint: "Convention hébergement", icon: "🌐" }
    ] },
    applicable: () => true,
    apply: (v, d) => ({ ...d, etablissementPrincipal: { ...d.etablissementPrincipal ?? { adresse: {}, domiciliation: "chez_dirigeant" }, domiciliation: v } })
  },
  {
    id: "siege_adresse",
    category: "siege",
    title: "Adresse complète du siège",
    field: { kind: "address" },
    applicable: () => true,
    validateStep: (v) => {
      const a = v ?? {};
      const errs = [];
      if (!a.voie || a.voie.trim().length < 4) errs.push("Voie requise (n° + rue).");
      if (!Check.codePostal(a.codePostal)) errs.push("Code postal invalide (5 chiffres).");
      if (!a.commune || a.commune.trim().length < 2) errs.push("Commune requise.");
      return errs;
    },
    apply: (v, d) => ({ ...d, etablissementPrincipal: { ...d.etablissementPrincipal ?? { domiciliation: "chez_dirigeant", adresse: {} }, adresse: v } })
  },
  {
    id: "siege_dom_societe",
    category: "siege",
    title: "Société de domiciliation",
    help: "Dénomination, SIREN, n° d’agrément préfectoral (obligatoire).",
    field: { kind: "text", placeholder: "Ex : Domiciliation Paris Opera — 480123456 — agrément 75-2021-0042" },
    applicable: (d) => {
      var _a;
      return ((_a = d.etablissementPrincipal) == null ? void 0 : _a.domiciliation) === "societe_domiciliation";
    },
    validateStep: (v) => {
      const parts = String(v ?? "").split("—").map((s) => s.trim());
      const errs = [];
      if (parts.length < 3) errs.push('Format attendu : "Dénomination — SIREN (9 chiffres) — agrément préfectoral".');
      if (parts[1] && !Check.siren(parts[1])) errs.push("SIREN invalide (9 chiffres + clé Luhn).");
      if (!parts[2]) errs.push("Numéro d’agrément préfectoral requis.");
      return errs;
    },
    apply: (v, d) => {
      const [denom, siren, agr] = v.split("—").map((s) => s.trim());
      return { ...d, etablissementPrincipal: { ...d.etablissementPrincipal, societeDomiciliation: { denomination: denom, siren, agrementPrefecture: agr } } };
    }
  },
  {
    id: "siege_date_debut",
    category: "siege",
    title: "Date prévue de début d’activité",
    field: { kind: "date" },
    applicable: () => true,
    validateStep: (v) => {
      if (!v || !Check.dateISO(String(v))) return ["Date invalide."];
      const d = new Date(String(v));
      const min = /* @__PURE__ */ new Date();
      min.setDate(min.getDate() - 30);
      const max = /* @__PURE__ */ new Date();
      max.setFullYear(max.getFullYear() + 1);
      if (d < min) return ["Date trop ancienne (max 30 jours dans le passé)."];
      if (d > max) return ["Date trop lointaine (max +12 mois)."];
      return [];
    },
    apply: (v, d) => ({ ...d, etablissementPrincipal: { ...d.etablissementPrincipal, dateDebutActivite: v } })
  },
  /* ===== CAPITAL ===== */
  {
    id: "cap_montant",
    category: "capital",
    title: "Capital social total (€)",
    help: "Min légal : 1 € (SARL/SAS/EURL/SASU), 37 000 € (SA).",
    field: { kind: "number", min: 1, suffix: "€" },
    applicable: (d) => !!d.forme && FORMES[d.forme].capital.requis,
    validateStep: (v, d) => {
      const n = Number(v);
      const rule = d.forme ? FORMES[d.forme] : null;
      const errs = [];
      if (!Number.isFinite(n) || n <= 0) errs.push("Montant invalide.");
      if (rule && n < rule.capital.montantMin) errs.push(`Capital minimum ${rule.capital.montantMin} € pour ${rule.shortLabel}.`);
      if (n > 1e9) errs.push("Montant déraisonnable.");
      return errs;
    },
    apply: (v, d) => ({ ...d, capital: { ...d.capital ?? {}, montantTotal: Number(v) } })
  },
  {
    id: "cap_type",
    category: "capital",
    title: "Type de capital",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "fixe", label: "Fixe", hint: "Modification = AGE", icon: "🔒" },
      { value: "variable", label: "Variable", hint: "Plancher / plafond statutaires", icon: "🔄" }
    ] },
    applicable: (d) => !!d.forme && !!FORMES[d.forme].capital.permetVariable,
    apply: (v, d) => ({ ...d, capital: { ...d.capital ?? {}, type: v } })
  },
  {
    id: "cap_apports",
    category: "capital",
    title: "Répartition des apports par associé",
    help: "Numéraire (versé) + nature (biens) + industrie (compétences, ne compte pas dans le capital).",
    field: { kind: "capital-table" },
    applicable: (d) => !!d.forme && FORMES[d.forme].capital.requis,
    validateStep: (v, d) => {
      var _a;
      const associes = v;
      const errs = [];
      if (!(associes == null ? void 0 : associes.length)) errs.push("Au moins un associé requis.");
      const total = associes.reduce((s, a) => s + (a.apport.numeraire ?? 0) + (a.apport.nature ?? []).reduce((x, n) => x + n.valeur, 0), 0);
      if (total <= 0) errs.push("Apport total doit être > 0.");
      const declared = (_a = d.capital) == null ? void 0 : _a.montantTotal;
      if (declared && Math.abs(total - declared) > 0.01) errs.push(`Somme des apports (${total} €) ≠ capital déclaré (${declared} €).`);
      const rule = d.forme ? FORMES[d.forme] : null;
      if (rule == null ? void 0 : rule.capital.libereMinPctApports) {
        const num = associes.reduce((s, a) => s + (a.apport.numeraire ?? 0), 0);
        const lib = associes.reduce((s, a) => s + (a.apport.numeraireLibere ?? 0), 0);
        if (num > 0 && lib / num * 100 < rule.capital.libereMinPctApports) {
          errs.push(`Libération min ${rule.capital.libereMinPctApports}% du numéraire requise à la constitution.`);
        }
      }
      return errs;
    },
    apply: (v, d) => ({ ...d, associes: v })
  },
  {
    id: "cap_depot",
    category: "capital",
    title: "Lieu de dépôt du capital",
    field: { kind: "choice", columns: 3, visual: "tiles", options: [
      { value: "banque", label: "Banque", hint: "Compte société en formation", icon: "🏦" },
      { value: "notaire", label: "Notaire", hint: "Compte séquestre", icon: "⚖️" },
      { value: "caisse_depots", label: "Caisse des dépôts", hint: "CDC", icon: "🏛️" }
    ] },
    applicable: (d) => !!d.forme && FORMES[d.forme].depotCapitalObligatoire,
    apply: (v, d) => ({ ...d, depotCapital: { ...d.depotCapital ?? {}, etablissement: v } })
  },
  {
    id: "cap_iban",
    category: "capital",
    title: "IBAN du compte de dépôt",
    field: { kind: "text", placeholder: "FR76 1234 5678 9012 3456 7890 123" },
    applicable: (d) => !!d.forme && FORMES[d.forme].depotCapitalObligatoire,
    validateStep: (v) => {
      const iban = String(v ?? "").replace(/\s/g, "").toUpperCase();
      if (!iban) return ["IBAN requis."];
      if (!Check.iban(iban)) return ["IBAN invalide (format FR + 25 caractères + clé mod 97)."];
      return [];
    },
    apply: (v, d) => ({ ...d, depotCapital: { ...d.depotCapital ?? {}, iban: v.replace(/\s/g, "").toUpperCase() } })
  },
  /* ===== GOUVERNANCE ===== */
  {
    id: "gov_dirigeants",
    category: "gouvernance",
    title: "Dirigeants — fonction et identité",
    field: { kind: "persons", subject: "dirigeants" },
    applicable: () => true,
    validateStep: (v, d) => {
      const arr = v;
      const errs = [];
      const rule = d.forme ? FORMES[d.forme] : null;
      if (!(arr == null ? void 0 : arr.length)) errs.push("Au moins un dirigeant requis.");
      if (rule && arr.length < rule.dirigeants.min) errs.push(`${rule.dirigeants.min} dirigeant(s) minimum pour ${rule.shortLabel}.`);
      arr == null ? void 0 : arr.forEach((dr, i) => validatePersonneErrors(dr.personne, `Dirigeant #${i + 1}`).forEach((e) => errs.push(e)));
      arr == null ? void 0 : arr.forEach((dr, i) => {
        if (!dr.fonction) errs.push(`Dirigeant #${i + 1} : fonction requise.`);
      });
      return errs;
    },
    apply: (v, d) => ({ ...d, dirigeants: v })
  },
  {
    id: "gov_associes_identite",
    category: "gouvernance",
    title: "Identité complète des associés",
    field: { kind: "persons", subject: "associes" },
    applicable: (d) => !!d.forme && FORMES[d.forme].isSociete,
    validateStep: (v, d) => {
      const arr = v;
      const errs = [];
      const rule = d.forme ? FORMES[d.forme] : null;
      if (rule && arr.length < rule.associes.min) errs.push(`${rule.associes.min} associé(s) minimum pour ${rule.shortLabel}.`);
      if ((rule == null ? void 0 : rule.associes.max) && arr.length > rule.associes.max) errs.push(`Max ${rule.associes.max} associés pour ${rule.shortLabel}.`);
      arr == null ? void 0 : arr.forEach((a, i) => {
        var _a;
        if (a.type === "personne_physique") validatePersonneErrors(a.personne, `Associé #${i + 1}`).forEach((e) => errs.push(e));
        else if (!((_a = a.morale) == null ? void 0 : _a.siren) || !Check.siren(a.morale.siren)) errs.push(`Associé PM #${i + 1} : SIREN invalide.`);
      });
      return errs;
    },
    apply: (v, d) => ({ ...d, associes: v })
  },
  /* ===== FISCAL / SOCIAL ===== */
  {
    id: "fiscal_regime",
    category: "fiscal",
    title: "Régime fiscal",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "is", label: "IS — Impôt sur les sociétés", icon: "🏢" },
      { value: "ir", label: "IR — Impôt sur le revenu", icon: "👤" }
    ] },
    applicable: () => false,
    apply: (v, d) => ({ ...d, regimeFiscal: v })
  },
  {
    id: "fiscal_tva",
    category: "fiscal",
    title: "Régime TVA",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "franchise", label: "Franchise en base", hint: "Sous seuils, pas de TVA", icon: "🆓" },
      { value: "reel_simplifie", label: "Réel simplifié", hint: "Déclaration annuelle", icon: "📋" },
      { value: "reel_normal", label: "Réel normal", hint: "Mensuelle", icon: "📑" },
      { value: "mini_reel", label: "Mini-réel", hint: "TVA mensuelle, IS simpl.", icon: "📊" }
    ] },
    applicable: () => true,
    apply: (v, d) => ({ ...d, regimeTva: v })
  },
  {
    id: "fiscal_acre",
    category: "fiscal",
    title: "Demande d’ACRE (exonération début d’activité) ?",
    help: "Exonération partielle de charges sociales la 1re année, sous conditions (chômeur indemnisé, < 26 ans, RSA…).",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "oui", label: "Oui — éligible", icon: "🎯" },
      { value: "non", label: "Non", icon: "➖" }
    ] },
    applicable: () => true,
    apply: (v, d) => ({ ...d, options: { ...d.options, acre: v === "oui" } })
  },
  {
    id: "fiscal_versement_liberatoire",
    category: "fiscal",
    title: "Versement libératoire de l’impôt sur le revenu ?",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "oui", label: "Oui", hint: "IR + URSSAF ensemble", icon: "💳" },
      { value: "non", label: "Non", hint: "Déclaration annuelle classique", icon: "➖" }
    ] },
    applicable: (d) => d.forme === "micro",
    apply: (v, d) => ({ ...d, options: { ...d.options, versementLiberatoireIR: v === "oui" } })
  },
  {
    id: "fiscal_conjoint",
    category: "fiscal",
    title: "Conjoint participant à l’activité ?",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "collaborateur", label: "Collaborateur", hint: "Statut TNS rattaché", icon: "🤝" },
      { value: "salarie", label: "Salarié", hint: "Contrat de travail", icon: "💼" },
      { value: "associe", label: "Associé", hint: "Parts au capital", icon: "📊" },
      { value: "aucun", label: "Aucun", icon: "➖" }
    ] },
    applicable: (d) => d.forme === "micro" || d.forme === "ei" || d.forme === "eurl" || d.forme === "sarl",
    apply: (v, d) => ({ ...d, conjoint: { ...d.conjoint ?? {}, statut: v } })
  },
  /* ===== EI / MICRO ===== */
  {
    id: "ei_insaisissabilite",
    category: "fiscal",
    title: "Insaisissabilité — biens fonciers",
    help: "Résidence principale insaisissable de droit (loi Macron). Vous pouvez étendre l'insaisissabilité à d'autres biens fonciers (déclaration notariée), OU renoncer à l'insaisissabilité automatique (déconseillé).",
    field: { kind: "choice", columns: 3, visual: "tiles", options: [
      { value: "auto", label: "RP automatique", hint: "Par défaut (recommandé)", icon: "🏡" },
      { value: "etendre", label: "Étendre", hint: "Déclaration notariée", icon: "🏘️" },
      { value: "renoncer", label: "Renoncer", hint: "Risque patrimonial", icon: "⚠️" }
    ] },
    applicable: (d) => d.forme === "micro" || d.forme === "ei",
    apply: (v, d) => ({
      ...d,
      options: {
        ...d.options ?? {},
        insaisissabiliteResidencePrincipale: v === "renoncer" ? "declaration_renoncee" : "auto"
      },
      ei: { ...d.ei ?? {}, insaisissabiliteResidencePrincipale: v !== "renoncer", declarationInsaisissabiliteAutre: v === "etendre" ? "À préciser" : void 0 }
    })
  },
  {
    id: "micro_nature_activite",
    category: "activite",
    title: "Nature juridique de l'activité",
    help: "Détermine la caisse sociale et le régime BIC/BNC. Une activité commerciale + une activité artisanale = activité mixte, déclarez l'activité principale.",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "commerciale", label: "Commerciale", hint: "Achat/revente, services aux entreprises (BIC)", icon: "🛍️" },
      { value: "artisanale", label: "Artisanale", hint: "Production / fabrication / coiffure / BTP (BIC)", icon: "🔨" },
      { value: "liberale", label: "Libérale", hint: "Prestations intellectuelles, conseil (BNC)", icon: "💼" },
      { value: "agricole", label: "Agricole", hint: "MSA — rare en micro", icon: "🌾" }
    ] },
    applicable: (d) => d.forme === "micro" || d.forme === "ei",
    apply: (v, d) => ({ ...d, natureActivite: v })
  },
  {
    id: "micro_artisan_qualification",
    category: "activite",
    title: "Qualification professionnelle (activité artisanale)",
    help: "Pour les artisans : diplôme, CAP/BEP, expérience ≥ 3 ans. Obligatoire pour BTP, coiffure, esthétique, mécanique, alimentaire.",
    field: { kind: "choice", columns: 3, visual: "tiles", options: [
      { value: "diplome", label: "Diplôme/CAP", icon: "🎓" },
      { value: "experience", label: "Expérience ≥ 3 ans", icon: "⏳" },
      { value: "non_requis", label: "Non requis", icon: "➖" }
    ] },
    applicable: (d) => (d.forme === "micro" || d.forme === "ei") && d.natureActivite === "artisanale",
    apply: (v, d) => ({ ...d, options: { ...d.options ?? {}, qualificationArtisan: v } })
  },
  {
    id: "micro_lieu_exercice",
    category: "siege",
    title: "Lieu principal d'exercice",
    help: "Où réalisez-vous l'activité ? Distinct du siège si vous travaillez chez vos clients.",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "siege", label: "Au siège", icon: "🏠" },
      { value: "chez_clients", label: "Chez les clients", icon: "🚗" },
      { value: "ambulant", label: "Ambulant / marchés", icon: "🚐" },
      { value: "mixte", label: "Mixte", icon: "🔀" }
    ] },
    applicable: (d) => d.forme === "micro" || d.forme === "ei",
    apply: (v, d) => ({ ...d, options: { ...d.options ?? {}, lieuExercice: v, ambulant: v === "ambulant" } })
  },
  {
    id: "micro_email",
    category: "identite",
    title: "Email pour les correspondances officielles",
    help: "INPI, URSSAF, Impôts — utilisé pour transmettre votre SIRET, attestations, échéances.",
    field: { kind: "email" },
    applicable: () => true,
    validateStep: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? "")) ? [] : ["Email valide requis."],
    apply: (v, d) => {
      var _a;
      const dir = ((_a = d.dirigeants) == null ? void 0 : _a[0]) ?? { type: "personne_physique", fonction: "gerant", personne: {} };
      const personne = { ...dir.personne ?? {}, email: v };
      return { ...d, dirigeants: [{ ...dir, personne }, ...(d.dirigeants ?? []).slice(1)] };
    }
  },
  {
    id: "micro_telephone",
    category: "identite",
    title: "Téléphone",
    help: "Joignable par l'INPI ou la SSI le cas échéant.",
    field: { kind: "tel" },
    applicable: () => true,
    validateStep: (v) => String(v ?? "").replace(/\D/g, "").length >= 9 ? [] : ["Téléphone à 10 chiffres requis."],
    apply: (v, d) => {
      var _a;
      const dir = ((_a = d.dirigeants) == null ? void 0 : _a[0]) ?? { type: "personne_physique", fonction: "gerant", personne: {} };
      const personne = { ...dir.personne ?? {}, telephone: v };
      return { ...d, dirigeants: [{ ...dir, personne }, ...(d.dirigeants ?? []).slice(1)] };
    }
  },
  {
    id: "micro_conjoint_identite",
    category: "gouvernance",
    title: "Identité du conjoint collaborateur",
    help: "Obligatoire si vous avez déclaré un conjoint collaborateur — sera affilié à la SSI/CIPAV.",
    field: { kind: "persons", subject: "dirigeants" },
    applicable: (d) => {
      var _a;
      return ((_a = d.conjoint) == null ? void 0 : _a.statut) === "collaborateur";
    },
    apply: (v, d) => {
      var _a;
      return { ...d, conjoint: { ...d.conjoint ?? {}, personne: (_a = v == null ? void 0 : v[0]) == null ? void 0 : _a.personne } };
    }
  },
  /* ===== BÉNÉFICIAIRES EFFECTIFS ===== */
  {
    id: "rbe_declaration",
    category: "rbe",
    title: "Déclaration des bénéficiaires effectifs",
    help: "Toute personne physique détenant > 25 % du capital ou droits de vote, OU exerçant un contrôle. À défaut, le représentant légal.",
    field: { kind: "persons", subject: "beneficiaires" },
    applicable: (d) => !!d.forme && FORMES[d.forme].rbeObligatoire,
    validateStep: (v) => {
      const arr = v;
      const errs = [];
      if (!(arr == null ? void 0 : arr.length)) errs.push("Au moins un bénéficiaire effectif requis (à défaut : représentant légal).");
      const totalPct = (arr == null ? void 0 : arr.reduce((s, b) => s + (Number(b.pctCapital) || 0), 0)) ?? 0;
      if (totalPct > 100.01) errs.push(`Somme % capital = ${totalPct}% (max 100%).`);
      arr == null ? void 0 : arr.forEach((b, i) => {
        if (!b.qualite) errs.push(`Bénéficiaire #${i + 1} : qualité de contrôle requise.`);
      });
      arr == null ? void 0 : arr.forEach((b, i) => validatePersonneErrors(b.personne, `Bénéficiaire #${i + 1}`).forEach((e) => errs.push(e)));
      return errs;
    },
    apply: (v, d) => ({ ...d, beneficiairesEffectifs: v })
  },
  /* ===== ANNONCE LÉGALE ===== */
  {
    id: "jal_choix",
    category: "societe",
    title: "Journal d’Annonces Légales",
    help: "Choix d’un journal habilité du département du siège. Nous nous chargeons de la publication.",
    field: { kind: "choice", columns: 2, visual: "tiles", options: [
      { value: "swivo_choisit", label: "Sélection auto", hint: "Le moins cher du département", icon: "🤖" },
      { value: "specifier", label: "Je précise", hint: "Journal de mon choix", icon: "📰" }
    ] },
    applicable: (d) => !!d.forme && FORMES[d.forme].annonceLegaleObligatoire,
    apply: (v, d) => ({ ...d, annonceLegale: { ...d.annonceLegale ?? {}, journal: v === "swivo_choisit" ? "auto" : "à préciser" } })
  },
  /* ===== PIÈCES JUSTIFICATIVES (upload réel) ===== */
  {
    id: "docs_upload",
    category: "mandat",
    title: "Téléversez vos pièces justificatives",
    help: "Vous pouvez aussi le faire plus tard depuis votre espace. Les obligatoires sont nécessaires pour la transmission INPI.",
    field: { kind: "documents-upload" },
    applicable: () => true,
    apply: (_, d) => d
  },
  /* ===== MANDAT ===== */
  {
    id: "mandat_accept",
    category: "mandat",
    title: "Mandat de dépôt INPI",
    help: "Indispensable : nous transmettons votre dossier en votre nom au Guichet unique.",
    field: { kind: "mandat-accept" },
    applicable: () => true,
    validateStep: (v) => v ? [] : ["Vous devez accepter le mandat pour la transmission au Guichet unique."],
    apply: (v, d) => v ? accepterMandat(d) : { ...d, mandat: buildMandat() }
  },
  /* ===== RÉCAP FINAL ===== */
  {
    id: "final_recap",
    category: "recap",
    title: "Récapitulatif & score de conformité",
    field: { kind: "recap" },
    applicable: () => true,
    apply: (_, d) => d
  }
];
function nextQuestion(d, currentId) {
  const p = computeProfil(d);
  const idx = currentId ? QUESTIONS.findIndex((q) => q.id === currentId) : -1;
  for (let i = idx + 1; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    if (q.applicable(d, p)) return q;
  }
  return null;
}
function previousQuestion(d, currentId) {
  const p = computeProfil(d);
  const idx = QUESTIONS.findIndex((q) => q.id === currentId);
  for (let i = idx - 1; i >= 0; i--) {
    const q = QUESTIONS[i];
    if (q.applicable(d, p)) return q;
  }
  return null;
}
function totalQuestions(d) {
  const p = computeProfil(d);
  return QUESTIONS.filter((q) => q.applicable(d, p)).length;
}
function questionIndex(d, currentId) {
  const p = computeProfil(d);
  const visibles = QUESTIONS.filter((q) => q.applicable(d, p));
  return visibles.findIndex((q) => q.id === currentId);
}
function currentValue(d, qid) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A;
  const o = d.options ?? {};
  switch (qid) {
    case "p_associes":
      return ((_a = d.associes) == null ? void 0 : _a.length) ? String(Math.min(3, d.associes.length)) : void 0;
    case "p_activite_categorie":
      return (_c = (_b = d.activites) == null ? void 0 : _b[0]) == null ? void 0 : _c.categorie;
    case "p_levee":
      return o._levee;
    case "p_ca":
      return o._caEstime != null ? String(o._caEstime) : void 0;
    case "p_patrimoine":
      return o._patrimoine;
    case "p_social":
      return o._social;
    case "p_fiscal":
      return o._fiscal;
    case "forme_override":
      return o._formeChosen ? "keep" : void 0;
    case "act_description":
      return (_e = (_d = d.activites) == null ? void 0 : _d[0]) == null ? void 0 : _e.description;
    case "act_reglementation":
      return ((_h = (_g = (_f = d.activites) == null ? void 0 : _f[0]) == null ? void 0 : _g.qualificationProfessionnelle) == null ? void 0 : _h.diplome) ? "diplome" : ((_k = (_j = (_i = d.activites) == null ? void 0 : _i[0]) == null ? void 0 : _j.qualificationProfessionnelle) == null ? void 0 : _k.experienceAnnees) ? "experience" : void 0;
    case "soc_denomination":
      return d.denomination;
    case "soc_sigle":
      return d.sigle;
    case "soc_objet":
      return d.objetSocial;
    case "soc_duree":
      return d.duree;
    case "soc_cloture":
      return d.dateClotureExercice;
    case "siege_mode":
      return (_l = d.etablissementPrincipal) == null ? void 0 : _l.domiciliation;
    case "siege_adresse":
      return (_m = d.etablissementPrincipal) == null ? void 0 : _m.adresse;
    case "siege_dom_societe": {
      const s = (_n = d.etablissementPrincipal) == null ? void 0 : _n.societeDomiciliation;
      return s ? `${s.denomination ?? ""} — ${s.siren ?? ""} — ${s.agrementPrefecture ?? ""}` : void 0;
    }
    case "siege_date_debut":
      return (_o = d.etablissementPrincipal) == null ? void 0 : _o.dateDebutActivite;
    case "cap_montant":
      return (_p = d.capital) == null ? void 0 : _p.montantTotal;
    case "cap_type":
      return (_q = d.capital) == null ? void 0 : _q.type;
    case "cap_apports":
      return d.associes;
    case "cap_depot":
      return (_r = d.depotCapital) == null ? void 0 : _r.etablissement;
    case "cap_iban":
      return (_s = d.depotCapital) == null ? void 0 : _s.iban;
    case "gov_dirigeants":
      return d.dirigeants;
    case "gov_associes_identite":
      return d.associes;
    case "fiscal_regime":
      return d.regimeFiscal;
    case "fiscal_tva":
      return d.regimeTva;
    case "fiscal_acre":
      return ((_t = d.options) == null ? void 0 : _t.acre) === void 0 ? void 0 : d.options.acre ? "oui" : "non";
    case "fiscal_versement_liberatoire":
      return ((_u = d.options) == null ? void 0 : _u.versementLiberatoireIR) === void 0 ? void 0 : d.options.versementLiberatoireIR ? "oui" : "non";
    case "fiscal_conjoint":
      return (_v = d.conjoint) == null ? void 0 : _v.statut;
    case "ei_insaisissabilite":
      return ((_w = d.ei) == null ? void 0 : _w.declarationInsaisissabiliteAutre) ? "etendre" : ((_x = d.ei) == null ? void 0 : _x.insaisissabiliteResidencePrincipale) ? "rp_seule" : void 0;
    case "rbe_declaration":
      return d.beneficiairesEffectifs;
    case "jal_choix":
      return ((_y = d.annonceLegale) == null ? void 0 : _y.journal) === "auto" ? "swivo_choisit" : ((_z = d.annonceLegale) == null ? void 0 : _z.journal) ? "specifier" : void 0;
    case "mandat_accept":
      return !!((_A = d.mandat) == null ? void 0 : _A.accepte);
    default:
      return void 0;
  }
}
function withLastStep(d, stepId) {
  return { ...d, options: { ...d.options ?? {}, _lastStepId: stepId } };
}
function lastStepId(d) {
  var _a;
  return (_a = d.options) == null ? void 0 : _a._lastStepId;
}
function newDossier() {
  return {
    ...EMPTY_DOSSIER,
    forme: "micro",
    activites: [],
    associes: [emptyAssocie()],
    dirigeants: [],
    beneficiairesEffectifs: [],
    options: {}
  };
}
function computeProfil(d) {
  var _a;
  const base2 = profilDepuisDossier(d);
  const o = d.options ?? {};
  return {
    ...base2,
    leveeFonds: o._levee,
    caPrevisionnel: o._caEstime,
    patrimoinePerso: o._patrimoine,
    protectionSociale: o._social,
    fiscalite: o._fiscal,
    conjointParticipe: ((_a = d.conjoint) == null ? void 0 : _a.statut) && d.conjoint.statut !== "aucun"
  };
}
function emptyAssocie() {
  return { type: "personne_physique", apport: { numeraire: 0 } };
}
function validatePersonneErrors(p, label) {
  const errs = [];
  if (!p) {
    errs.push(`${label} : informations manquantes.`);
    return errs;
  }
  if (!p.prenom || p.prenom.trim().length < 2) errs.push(`${label} : prénom requis.`);
  if (!p.nom || p.nom.trim().length < 2) errs.push(`${label} : nom requis.`);
  if (!p.dateNaissance) errs.push(`${label} : date de naissance requise.`);
  else if (!Check.majeur(p.dateNaissance)) errs.push(`${label} : doit être majeur.`);
  if (!p.lieuNaissance) errs.push(`${label} : lieu de naissance requis.`);
  if (!p.nationalite || p.nationalite.length !== 3) errs.push(`${label} : nationalité ISO-3 requise (ex : FRA).`);
  if (p.email && !Check.email(p.email)) errs.push(`${label} : email invalide.`);
  return errs;
}
function upsertActivite(d, patch) {
  const arr = [...d.activites ?? []];
  const cur = arr[0] ?? { categorie: "liberale_non_reglementee", description: "" };
  arr[0] = { ...cur, ...patch };
  return { ...d, activites: arr };
}
export {
  FORMES as F,
  MANDAT_TEXTE as M,
  QUESTIONS as Q,
  currentValue as a,
  buildMandat as b,
  computeProfil as c,
  documentsRequis as d,
  nextQuestion as e,
  previousQuestion as f,
  lastStepId as l,
  mandatTexteRendu as m,
  newDossier as n,
  parseNir as p,
  questionIndex as q,
  recommander as r,
  searchActivites as s,
  totalQuestions as t,
  validate as v,
  withLastStep as w
};
