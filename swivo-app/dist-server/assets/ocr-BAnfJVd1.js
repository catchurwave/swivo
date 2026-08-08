async function scanIdCard(file, opts) {
  const side = (opts == null ? void 0 : opts.side) ?? "auto";
  const { createWorker } = await import("tesseract.js");
  const sourceUrl = URL.createObjectURL(file);
  try {
    if (side === "recto") {
      const worker2 = await createWorker("fra", 1, {
        logger: (m) => {
          if (m.status === "recognizing text" && (opts == null ? void 0 : opts.onProgress)) opts.onProgress(m.progress);
        }
      });
      const preprocessed = await preprocessImage(file, { mode: "recto" });
      const { data } = await worker2.recognize(preprocessed ?? sourceUrl);
      await worker2.terminate();
      const raw2 = ((data == null ? void 0 : data.text) ?? "").toString();
      const parsed2 = parseCniRecto(raw2);
      return { raw: raw2, type: parsed2.type ?? "cni_recto", ...parsed2, confiance: ((data == null ? void 0 : data.confidence) ?? 0) / 100 };
    }
    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && (opts == null ? void 0 : opts.onProgress)) opts.onProgress(m.progress);
      }
    });
    try {
      await worker.setParameters({ tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<" });
    } catch {
    }
    const cropped = await preprocessImage(file, { mode: "mrz" });
    let raw = "";
    let confidence = 0;
    if (cropped) {
      const { data } = await worker.recognize(cropped);
      raw = ((data == null ? void 0 : data.text) ?? "").toString();
      confidence = ((data == null ? void 0 : data.confidence) ?? 0) / 100;
    }
    let parsed = parseMrz(raw);
    if (parsed.type === "unknown") {
      const { data } = await worker.recognize(sourceUrl);
      raw = ((data == null ? void 0 : data.text) ?? "").toString();
      confidence = ((data == null ? void 0 : data.confidence) ?? 0) / 100;
      parsed = parseMrz(raw);
    }
    await worker.terminate();
    return { raw, type: "unknown", ...parsed, confiance: confidence };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
function mergeIdScans(scans) {
  const valid = scans.filter(Boolean);
  const mrz = valid.find((s) => s.type === "cni" || s.type === "passport");
  const recto = valid.find((s) => s.type === "cni_recto");
  const out = { raw: valid.map((s) => s.raw).join("\n---\n"), type: (mrz == null ? void 0 : mrz.type) ?? (recto == null ? void 0 : recto.type) ?? "unknown", confiance: Math.max(...valid.map((s) => s.confiance || 0), 0) };
  const sources = [mrz, recto].filter(Boolean);
  for (const src of sources) {
    for (const k of Object.keys(src)) {
      if (k === "raw" || k === "type" || k === "confiance") continue;
      const v = src[k];
      if (v != null && v !== "" && out[k] == null) out[k] = v;
    }
  }
  if ((recto == null ? void 0 : recto.lieuNaissance) && !out.lieuNaissance) out.lieuNaissance = recto.lieuNaissance;
  return out;
}
function parseMrz(text) {
  const cleaned = text.toUpperCase().replace(/[«»]/g, "<").replace(/[ \t]+/g, "");
  const lines = cleaned.split(/\r?\n/).map((l) => l.replace(/[^A-Z0-9<]/g, "")).filter((l) => l.length >= 28);
  if (!lines.length) return { type: "unknown" };
  const passLine1 = lines.find((l) => /^P[<K]/.test(l));
  if (passLine1 && lines.length >= 2) {
    const pays = passLine1.substring(2, 5);
    const nomPrenom = passLine1.substring(5).split("<<");
    const nom = (nomPrenom[0] ?? "").replace(/</g, " ").trim();
    const prenomsRaw = (nomPrenom[1] ?? "").replace(/</g, " ").replace(/\s+/g, " ").trim();
    const prenomsTous = prenomsRaw.split(" ").filter(Boolean);
    const l2 = lines[lines.indexOf(passLine1) + 1] ?? "";
    const yymmdd = digitsOnly(l2.substring(13, 19));
    const sexe = l2.substring(20, 21);
    const expYymmdd = digitsOnly(l2.substring(21, 27));
    return {
      type: "passport",
      pays,
      nationalite: pays,
      nom: titleCase(nom),
      prenom: titleCase(prenomsTous[0] ?? ""),
      prenomsTous: prenomsTous.map(titleCase),
      dateNaissance: yymmddToIso(yymmdd),
      dateExpiration: yymmddToIso(expYymmdd, true),
      sexe: sexe === "M" ? "M" : sexe === "F" ? "F" : void 0,
      civilite: sexe === "M" ? "M" : sexe === "F" ? "Mme" : void 0
    };
  }
  const cniLine1 = lines.find((l) => /^[I1][D0][A-Z]{3}/.test(l));
  if (cniLine1 && lines.length >= 2) {
    const pays = cniLine1.substring(2, 5).replace(/0/g, "O").replace(/1/g, "I");
    const numDoc = cniLine1.substring(5, 17).replace(/</g, "");
    const l2 = lines[lines.indexOf(cniLine1) + 1] ?? "";
    const yymmdd = digitsOnly(l2.substring(0, 6));
    const sexe = l2.substring(7, 8);
    const expYymmdd = digitsOnly(l2.substring(8, 14));
    const l3 = lines[lines.indexOf(cniLine1) + 2] ?? lines[lines.indexOf(cniLine1) + 1] ?? "";
    const nameSource = l3.includes("<<") ? l3 : cniLine1.substring(17).split("<<").slice(1).join("<<") || l3;
    const parts = nameSource.split("<<");
    const nom = (parts[0] ?? "").replace(/</g, " ").trim();
    const prenomsRaw = (parts[1] ?? "").replace(/</g, " ").replace(/\s+/g, " ").trim();
    const prenomsTous = prenomsRaw.split(" ").filter(Boolean);
    return {
      type: "cni",
      pays,
      nationalite: pays,
      numeroDocument: numDoc || void 0,
      nom: titleCase(nom),
      prenom: titleCase(prenomsTous[0] ?? ""),
      prenomsTous: prenomsTous.map(titleCase),
      dateNaissance: yymmddToIso(yymmdd),
      dateExpiration: yymmddToIso(expYymmdd, true),
      sexe: sexe === "M" ? "M" : sexe === "F" ? "F" : void 0,
      civilite: sexe === "M" ? "M" : sexe === "F" ? "Mme" : void 0
    };
  }
  return { type: "unknown" };
}
function parseCniRecto(text) {
  const out = { type: "cni_recto" };
  const t = text.replace(/ /g, " ");
  const sexeMatch = t.match(/\bSEXE\s*[:\-]?\s*([MF])\b/i) || t.match(/\b([MF])\s*\n/);
  if (sexeMatch) {
    const s = sexeMatch[1].toUpperCase();
    out.sexe = s === "M" ? "M" : "F";
    out.civilite = s === "M" ? "M" : "Mme";
  }
  const nomMatch = t.match(/\bNOM\s*(?:DE\s*FAMILLE|D[E']?USAGE)?\s*[:\-]?\s*([A-ZÀ-ÖØ-Þ' \-]{2,})/i);
  if (nomMatch) out.nom = titleCase(nomMatch[1].trim());
  const usageMatch = t.match(/\bNOM\s*D[E']?USAGE\s*[:\-]?\s*([A-ZÀ-ÖØ-Þ' \-]{2,})/i);
  if (usageMatch) out.nomUsage = titleCase(usageMatch[1].trim());
  const prenomMatch = t.match(/\bPR[ÉE]NOM\(?S?\)?\s*[:\-]?\s*([A-Za-zÀ-ÖØ-öø-ÿ' \-,]{2,})/);
  if (prenomMatch) {
    const tous = prenomMatch[1].split(/[,\s]+/).filter(Boolean).map(titleCase);
    if (tous.length) {
      out.prenom = tous[0];
      out.prenomsTous = tous;
    }
  }
  const dateMatch = t.match(/\bN[ÉE]\(?E\)?\s*LE\s*(\d{1,2})[\/\.\s\-](\d{1,2})[\/\.\s\-](\d{2,4})/i) || t.match(/\b(\d{2})[\/\.\s\-](\d{2})[\/\.\s\-](\d{4})\b/);
  if (dateMatch) {
    const dd = dateMatch[1].padStart(2, "0");
    const mm = dateMatch[2].padStart(2, "0");
    let yyyy = dateMatch[3];
    if (yyyy.length === 2) {
      const n = parseInt(yyyy, 10);
      yyyy = (n > (/* @__PURE__ */ new Date()).getFullYear() % 100 ? "19" : "20") + dateMatch[3];
    }
    if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31) out.dateNaissance = `${yyyy}-${mm}-${dd}`;
  }
  const lieuMatch = t.match(/\b[ÀA]\s*[:\-]?\s*([A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þa-zà-öø-ÿ' \-]{2,40}?)(?=\s*(?:\d|\n|TAILLE|NATIONALIT|NUMERO|N°|VALID))/);
  if (lieuMatch) out.lieuNaissance = titleCase(lieuMatch[1].trim());
  if (/\bFRAN[ÇC]AIS/i.test(t) || /\bFRA\b/.test(t)) out.nationalite = "FRA";
  const numMatch = t.match(/\b(?:N[°ºo]|NUM[ÉE]RO)\s*[:\-]?\s*([A-Z0-9]{6,12})/i);
  if (numMatch) out.numeroDocument = numMatch[1];
  const tailleMatch = t.match(/\bTAILLE\s*[:\-]?\s*(\d[,\.]\d{2}\s*M?|1[,\.]\d{2}|2[,\.]\d{2})/i);
  if (tailleMatch) out.taille = tailleMatch[1].replace(",", ".");
  return out;
}
async function preprocessImage(file, opts) {
  try {
    if (typeof document === "undefined") return null;
    const img = await loadImage(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const maxDim = 2e3;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    if (opts.mode === "mrz") {
      const bandH = Math.round(h * 0.35);
      canvas.width = w;
      canvas.height = bandH;
      ctx.drawImage(img, 0, h - bandH, w, bandH, 0, 0, w, bandH);
    } else {
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
    }
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = imgData.data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) {
      const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      px[i] = px[i + 1] = px[i + 2] = g;
      sum += g;
    }
    const mean = sum / (px.length / 4);
    const threshold = mean * (opts.mode === "mrz" ? 0.85 : 1);
    if (opts.mode === "mrz") {
      for (let i = 0; i < px.length; i += 4) {
        const v = px[i] < threshold ? 0 : 255;
        px[i] = px[i + 1] = px[i + 2] = v;
      }
    } else {
      const contrast = 1.25;
      const intercept = 128 * (1 - contrast);
      for (let i = 0; i < px.length; i += 4) {
        const v = Math.max(0, Math.min(255, px[i] * contrast + intercept));
        px[i] = px[i + 1] = px[i + 2] = v;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
function digitsOnly(s) {
  return s.replace(/O/g, "0").replace(/I/g, "1").replace(/S/g, "5").replace(/B/g, "8").replace(/Z/g, "2").replace(/[^\d]/g, "");
}
function titleCase(s) {
  return s.toLowerCase().replace(/(^|\s|-)([a-zà-ÿ])/g, (_, p1, c) => p1 + c.toUpperCase());
}
function yymmddToIso(yymmdd, future = false) {
  if (!/^\d{6}$/.test(yymmdd)) return void 0;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);
  const currentYy = (/* @__PURE__ */ new Date()).getFullYear() % 100;
  let year;
  if (future) {
    year = 2e3 + yy;
  } else {
    year = yy > currentYy ? 1900 + yy : 2e3 + yy;
  }
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return void 0;
  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}
export {
  mergeIdScans,
  parseCniRecto,
  parseMrz,
  scanIdCard
};
