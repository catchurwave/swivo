/*
  OCR carte d'identité française (recto + verso MRZ) + passeport.
  Backend : Tesseract.js (WASM, ~5 MB lazy-load).

  Stratégie :
    - VERSO CNI / page passeport : MRZ ICAO 9303 (TD1 ou TD3). Pré-processing
      image (recadrage bande basse, contraste, binarisation) puis OCR avec
      whitelist alphanum + chevrons. Fallback fuzzy si MRZ partiel.
    - RECTO CNI : OCR plein texte (whitelist élargie, lang `fra`). Extraction
      par regex des libellés ("Nom :", "Prénom(s) :", "Né(e) le", "à",
      "Nationalité"). Pré-remplit lieu de naissance que la MRZ ne contient pas.
    - Fusion recto + verso via mergeIdScans() : verso prioritaire pour les
      champs MRZ (haute confiance), recto pour lieu de naissance + ré-écriture
      des prénoms multiples.
*/

export type IdScanResult = {
  raw: string;
  type: 'cni' | 'passport' | 'cni_recto' | 'unknown';
  civilite?: 'M' | 'Mme';
  prenom?: string;
  prenomsTous?: string[];          // tous les prénoms d'état civil
  nom?: string;
  nomUsage?: string;               // recto CNI : nom marital
  dateNaissance?: string;          // ISO YYYY-MM-DD
  lieuNaissance?: string;          // recto CNI
  nationalite?: string;            // ISO-3
  numeroDocument?: string;
  sexe?: 'M' | 'F';
  pays?: string;
  dateExpiration?: string;
  taille?: string;                 // passeport recto, parfois CNI
  adresse?: string;                // ancien CNI parfois
  confiance: number;               // 0..1
};

export type IdScanSide = 'recto' | 'verso' | 'auto';

/**
 * OCR une image de pièce d'identité. `side` aide à choisir le pré-processing.
 *  - `verso` (CNI) ou `auto` pour passeport : focus MRZ
 *  - `recto` CNI : OCR plein texte
 */
export async function scanIdCard(
  file: File,
  opts?: { side?: IdScanSide; onProgress?: (p: number) => void }
): Promise<IdScanResult> {
  const side = opts?.side ?? 'auto';
  const { createWorker } = await import('tesseract.js');

  const sourceUrl = URL.createObjectURL(file);
  try {
    // RECTO : OCR plein texte avec langue française.
    if (side === 'recto') {
      const worker = await createWorker('fra', 1, {
        logger: (m: any) => { if (m.status === 'recognizing text' && opts?.onProgress) opts.onProgress(m.progress); },
      });
      const preprocessed = await preprocessImage(file, { mode: 'recto' });
      const { data } = await worker.recognize(preprocessed ?? sourceUrl);
      await worker.terminate();
      const raw = (data?.text ?? '').toString();
      const parsed = parseCniRecto(raw);
      return { raw, type: parsed.type ?? 'cni_recto', ...parsed, confiance: (data?.confidence ?? 0) / 100 } as IdScanResult;
    }

    // VERSO / AUTO : MRZ. Whitelist alphanum + chevrons.
    const worker = await createWorker('eng', 1, {
      logger: (m: any) => { if (m.status === 'recognizing text' && opts?.onProgress) opts.onProgress(m.progress); },
    });
    try {
      await worker.setParameters({ tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<' });
    } catch {}

    // Tentative 1 : image recadrée bande MRZ + binarisée.
    const cropped = await preprocessImage(file, { mode: 'mrz' });
    let raw = '';
    let confidence = 0;
    if (cropped) {
      const { data } = await worker.recognize(cropped);
      raw = (data?.text ?? '').toString();
      confidence = (data?.confidence ?? 0) / 100;
    }
    let parsed = parseMrz(raw);

    // Tentative 2 : image originale si MRZ non détectée.
    if (parsed.type === 'unknown') {
      const { data } = await worker.recognize(sourceUrl);
      raw = (data?.text ?? '').toString();
      confidence = (data?.confidence ?? 0) / 100;
      parsed = parseMrz(raw);
    }
    await worker.terminate();
    return { raw, type: 'unknown', ...parsed, confiance: confidence } as IdScanResult;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

/**
 * Fusionne plusieurs scans (recto + verso) en un seul résultat. La MRZ est
 * faisant autorité pour identité ; le recto ajoute lieu de naissance et
 * complète si MRZ illisible.
 */
export function mergeIdScans(scans: Array<IdScanResult | null | undefined>): IdScanResult {
  const valid = scans.filter(Boolean) as IdScanResult[];
  const mrz = valid.find((s) => s.type === 'cni' || s.type === 'passport');
  const recto = valid.find((s) => s.type === 'cni_recto');
  const out: IdScanResult = { raw: valid.map((s) => s.raw).join('\n---\n'), type: mrz?.type ?? recto?.type ?? 'unknown', confiance: Math.max(...valid.map((s) => s.confiance || 0), 0) };
  const sources: IdScanResult[] = [mrz, recto].filter(Boolean) as IdScanResult[];
  for (const src of sources) {
    for (const k of Object.keys(src) as Array<keyof IdScanResult>) {
      if (k === 'raw' || k === 'type' || k === 'confiance') continue;
      const v = src[k];
      if (v != null && v !== '' && (out as any)[k] == null) (out as any)[k] = v;
    }
  }
  // Lieu de naissance vient du recto uniquement.
  if (recto?.lieuNaissance && !out.lieuNaissance) out.lieuNaissance = recto.lieuNaissance;
  return out;
}

/**
 * Parse MRZ (Machine Readable Zone) selon ICAO 9303.
 * - CNI FR (TD1) : 2 lignes de 36 caractères (anciennes) ou 3 lignes (nouveau format)
 *   L1 : "IDFRA<<DOC_NUM<<<NOM<<<<<<<<<<<<<<<<<<"
 *   L2 : "DATE_NAIS_SEXE_DATE_EXP_PAYS_PRENOM<<<"
 * - Passeport (TD3) : 2 lignes de 44 caractères
 */
export function parseMrz(text: string): Partial<IdScanResult> {
  // Normalisation : remplace I→1, O→0, S→5 etc. dans zones strictement numériques après détection.
  const cleaned = text.toUpperCase().replace(/[«»]/g, '<').replace(/[ \t]+/g, '');
  const lines = cleaned.split(/\r?\n/).map((l) => l.replace(/[^A-Z0-9<]/g, '')).filter((l) => l.length >= 28);
  if (!lines.length) return { type: 'unknown' };

  // Passeport TD3 : ligne commence par P<
  const passLine1 = lines.find((l) => /^P[<K]/.test(l));
  if (passLine1 && lines.length >= 2) {
    const pays = passLine1.substring(2, 5);
    const nomPrenom = passLine1.substring(5).split('<<');
    const nom = (nomPrenom[0] ?? '').replace(/</g, ' ').trim();
    const prenomsRaw = (nomPrenom[1] ?? '').replace(/</g, ' ').replace(/\s+/g, ' ').trim();
    const prenomsTous = prenomsRaw.split(' ').filter(Boolean);
    const l2 = lines[lines.indexOf(passLine1) + 1] ?? '';
    const yymmdd = digitsOnly(l2.substring(13, 19));
    const sexe = l2.substring(20, 21);
    const expYymmdd = digitsOnly(l2.substring(21, 27));
    return {
      type: 'passport',
      pays,
      nationalite: pays,
      nom: titleCase(nom),
      prenom: titleCase(prenomsTous[0] ?? ''),
      prenomsTous: prenomsTous.map(titleCase),
      dateNaissance: yymmddToIso(yymmdd),
      dateExpiration: yymmddToIso(expYymmdd, true),
      sexe: sexe === 'M' ? 'M' : sexe === 'F' ? 'F' : undefined,
      civilite: sexe === 'M' ? 'M' : sexe === 'F' ? 'Mme' : undefined,
    };
  }

  // CNI TD1 : ligne commence par ID (puis pays 3 lettres). Tolère IO, 1D, 1O suite à OCR.
  const cniLine1 = lines.find((l) => /^[I1][D0][A-Z]{3}/.test(l));
  if (cniLine1 && lines.length >= 2) {
    const pays = cniLine1.substring(2, 5).replace(/0/g, 'O').replace(/1/g, 'I');
    const numDoc = cniLine1.substring(5, 17).replace(/</g, '');
    // L2 contient date naissance + sexe + expiration + nationalité + prénoms.
    const l2 = lines[lines.indexOf(cniLine1) + 1] ?? '';
    const yymmdd = digitsOnly(l2.substring(0, 6));
    const sexe = l2.substring(7, 8);
    const expYymmdd = digitsOnly(l2.substring(8, 14));
    // L3 : nom<<prénoms<<<<
    const l3 = lines[lines.indexOf(cniLine1) + 2] ?? lines[lines.indexOf(cniLine1) + 1] ?? '';
    const nameSource = l3.includes('<<') ? l3 : (cniLine1.substring(17).split('<<').slice(1).join('<<') || l3);
    const parts = nameSource.split('<<');
    const nom = (parts[0] ?? '').replace(/</g, ' ').trim();
    const prenomsRaw = (parts[1] ?? '').replace(/</g, ' ').replace(/\s+/g, ' ').trim();
    const prenomsTous = prenomsRaw.split(' ').filter(Boolean);
    return {
      type: 'cni',
      pays,
      nationalite: pays,
      numeroDocument: numDoc || undefined,
      nom: titleCase(nom),
      prenom: titleCase(prenomsTous[0] ?? ''),
      prenomsTous: prenomsTous.map(titleCase),
      dateNaissance: yymmddToIso(yymmdd),
      dateExpiration: yymmddToIso(expYymmdd, true),
      sexe: sexe === 'M' ? 'M' : sexe === 'F' ? 'F' : undefined,
      civilite: sexe === 'M' ? 'M' : sexe === 'F' ? 'Mme' : undefined,
    };
  }

  return { type: 'unknown' };
}

/**
 * Parse libre du recto CNI à partir d'un OCR plein texte français.
 * Cherche les libellés usuels — robuste aux variations de mise en page.
 */
export function parseCniRecto(text: string): Partial<IdScanResult> {
  const out: Partial<IdScanResult> = { type: 'cni_recto' };
  const t = text.replace(/ /g, ' ');

  // Civilité / sexe parfois rendu "SEXE : M" ou "M" isolé.
  const sexeMatch = t.match(/\bSEXE\s*[:\-]?\s*([MF])\b/i) || t.match(/\b([MF])\s*\n/);
  if (sexeMatch) {
    const s = sexeMatch[1].toUpperCase();
    out.sexe = s === 'M' ? 'M' : 'F';
    out.civilite = s === 'M' ? 'M' : 'Mme';
  }

  // Nom : précédé de "NOM" ou "Nom :"
  const nomMatch = t.match(/\bNOM\s*(?:DE\s*FAMILLE|D[E']?USAGE)?\s*[:\-]?\s*([A-ZÀ-ÖØ-Þ' \-]{2,})/i);
  if (nomMatch) out.nom = titleCase(nomMatch[1].trim());

  // Nom d'usage / d'épouse
  const usageMatch = t.match(/\bNOM\s*D[E']?USAGE\s*[:\-]?\s*([A-ZÀ-ÖØ-Þ' \-]{2,})/i);
  if (usageMatch) out.nomUsage = titleCase(usageMatch[1].trim());

  // Prénoms : "PRÉNOM(S) :" ou "PRENOM(S) :"
  const prenomMatch = t.match(/\bPR[ÉE]NOM\(?S?\)?\s*[:\-]?\s*([A-Za-zÀ-ÖØ-öø-ÿ' \-,]{2,})/);
  if (prenomMatch) {
    const tous = prenomMatch[1].split(/[,\s]+/).filter(Boolean).map(titleCase);
    if (tous.length) {
      out.prenom = tous[0];
      out.prenomsTous = tous;
    }
  }

  // Date naissance : "Né(e) le 12/03/1985" / "12.03.1985" / "12 03 1985"
  const dateMatch = t.match(/\bN[ÉE]\(?E\)?\s*LE\s*(\d{1,2})[\/\.\s\-](\d{1,2})[\/\.\s\-](\d{2,4})/i)
    || t.match(/\b(\d{2})[\/\.\s\-](\d{2})[\/\.\s\-](\d{4})\b/);
  if (dateMatch) {
    const dd = dateMatch[1].padStart(2, '0');
    const mm = dateMatch[2].padStart(2, '0');
    let yyyy = dateMatch[3];
    if (yyyy.length === 2) {
      const n = parseInt(yyyy, 10);
      yyyy = (n > (new Date().getFullYear() % 100) ? '19' : '20') + dateMatch[3];
    }
    if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31) out.dateNaissance = `${yyyy}-${mm}-${dd}`;
  }

  // Lieu naissance : " à PARIS" / "À : PARIS"
  const lieuMatch = t.match(/\b[ÀA]\s*[:\-]?\s*([A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þa-zà-öø-ÿ' \-]{2,40}?)(?=\s*(?:\d|\n|TAILLE|NATIONALIT|NUMERO|N°|VALID))/);
  if (lieuMatch) out.lieuNaissance = titleCase(lieuMatch[1].trim());

  // Nationalité : "Nationalité française" / "FRA"
  if (/\bFRAN[ÇC]AIS/i.test(t) || /\bFRA\b/.test(t)) out.nationalite = 'FRA';

  // Numéro document : "N° xxxxxx" parfois sur recto
  const numMatch = t.match(/\b(?:N[°ºo]|NUM[ÉE]RO)\s*[:\-]?\s*([A-Z0-9]{6,12})/i);
  if (numMatch) out.numeroDocument = numMatch[1];

  // Taille (passeport recto)
  const tailleMatch = t.match(/\bTAILLE\s*[:\-]?\s*(\d[,\.]\d{2}\s*M?|1[,\.]\d{2}|2[,\.]\d{2})/i);
  if (tailleMatch) out.taille = tailleMatch[1].replace(',', '.');

  return out;
}

/**
 * Pré-processing image avant OCR :
 *  - mode `mrz` : recadre 35 % bas, gris, contraste, binarisation Otsu approx.
 *  - mode `recto` : redimensionne max 2000 px, gris doux, contraste léger.
 * Retourne data URL ou null si impossible.
 */
async function preprocessImage(file: File, opts: { mode: 'mrz' | 'recto' }): Promise<string | null> {
  try {
    if (typeof document === 'undefined') return null;
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const maxDim = 2000;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    if (opts.mode === 'mrz') {
      // Bande MRZ : 35 % bas de l'image.
      const bandH = Math.round(h * 0.35);
      canvas.width = w;
      canvas.height = bandH;
      ctx.drawImage(img, 0, h - bandH, w, bandH, 0, 0, w, bandH);
    } else {
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
    }

    // Niveaux de gris + contraste + (binarisation pour MRZ).
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = imgData.data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) {
      const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      px[i] = px[i + 1] = px[i + 2] = g;
      sum += g;
    }
    const mean = sum / (px.length / 4);
    const threshold = mean * (opts.mode === 'mrz' ? 0.85 : 1);
    if (opts.mode === 'mrz') {
      for (let i = 0; i < px.length; i += 4) {
        const v = px[i] < threshold ? 0 : 255;
        px[i] = px[i + 1] = px[i + 2] = v;
      }
    } else {
      // Contraste léger pour recto.
      const contrast = 1.25;
      const intercept = 128 * (1 - contrast);
      for (let i = 0; i < px.length; i += 4) {
        const v = Math.max(0, Math.min(255, px[i] * contrast + intercept));
        px[i] = px[i + 1] = px[i + 2] = v;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function digitsOnly(s: string): string {
  return s.replace(/O/g, '0').replace(/I/g, '1').replace(/S/g, '5').replace(/B/g, '8').replace(/Z/g, '2').replace(/[^\d]/g, '');
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s|-)([a-zà-ÿ])/g, (_, p1, c) => p1 + c.toUpperCase());
}

function yymmddToIso(yymmdd: string, future = false): string | undefined {
  if (!/^\d{6}$/.test(yymmdd)) return undefined;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);
  const currentYy = new Date().getFullYear() % 100;
  let year: number;
  if (future) {
    year = 2000 + yy;
  } else {
    year = yy > currentYy ? 1900 + yy : 2000 + yy;
  }
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return undefined;
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}
