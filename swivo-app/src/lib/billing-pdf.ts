/*
  Rendu HTML imprimable d'une facture/devis micro-entreprise.
  Conformité minimum :
  - Numéro chronologique unique
  - Dates émission + échéance
  - Identité émetteur (nom, adresse, SIRET)
  - Identité client + adresse
  - Détail prestations (libellé, qté, PU HT, total HT)
  - Total HT / TVA / TTC
  - Mention TVA non applicable art. 293B CGI (si franchise)
  - Conditions de règlement + pénalités de retard
  - Mention pénalités forfaitaires 40 € (D441-5 C. com.)
*/
import type { BillingDoc, Emetteur } from './billing';
import { STATUS_LABEL, formatEUR } from './billing';

export function renderDocHtml(doc: BillingDoc, emetteur: Emetteur): string {
  const titre = doc.type === 'facture' ? 'FACTURE' : doc.type === 'devis' ? 'DEVIS' : 'AVOIR';
  const mentionTVA = doc.tvaApplicable
    ? `TVA appliquée : ${doc.tvaPct ?? 20} %`
    : 'TVA non applicable, art. 293 B du CGI';
  const cli = doc.clientSnapshot ?? ({} as NonNullable<BillingDoc['clientSnapshot']>);
  const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('fr-FR') : '';
  const e = (s?: string) => (s ? s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!)) : '');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${titre} ${e(doc.numero)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; margin: 0; padding: 32px; max-width: 820px; line-height: 1.45; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1d4ed8; padding-bottom: 18px; margin-bottom: 28px; }
  h1 { margin: 0; font-size: 28px; color: #1d4ed8; letter-spacing: -0.02em; }
  h1 .num { display: block; font-size: 14px; color: #475569; font-weight: 500; margin-top: 4px; }
  .blocks { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .block { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin-bottom: 4px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  thead th { background: #f1f5f9; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #475569; text-align: left; border-bottom: 1px solid #cbd5e1; }
  tbody td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tbody td.num { text-align: right; white-space: nowrap; }
  tbody td.desc { color: #475569; font-size: 12px; }
  tfoot td { padding: 6px 8px; }
  tfoot .total td { font-weight: 700; border-top: 2px solid #0f172a; padding-top: 10px; font-size: 16px; }
  .right { text-align: right; }
  .muted { color: #64748b; font-size: 12px; }
  .conditions { margin-top: 24px; padding: 14px 16px; background: #f8fafc; border-radius: 10px; font-size: 12px; color: #334155; }
  .footer { margin-top: 30px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
  .status { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; margin-left: 8px; vertical-align: middle; }
  .status.paye, .status.accepte { background: #ecfdf5; color: #047857; }
  .status.retard, .status.refuse { background: #fef2f2; color: #b91c1c; }
  .status.envoye { background: #eff6ff; color: #1d4ed8; }
  .status.brouillon, .status.annule { background: #f1f5f9; color: #64748b; }
  @media print { body { padding: 18mm; } }
</style>
</head>
<body>
  <header>
    <div>
      <div style="font-weight:700;font-size:18px;letter-spacing:-0.01em">${e(emetteur.nom) || 'Mon entreprise'}</div>
      <div class="muted">${e(emetteur.adresse) || ''}</div>
      <div class="muted">${e([emetteur.codePostal, emetteur.ville].filter(Boolean).join(' '))}</div>
      <div class="muted">${e(emetteur.email) || ''} ${emetteur.telephone ? '· ' + e(emetteur.telephone) : ''}</div>
      ${emetteur.siret ? `<div class="muted">SIRET : ${e(emetteur.siret)}</div>` : ''}
    </div>
    <div style="text-align:right">
      <h1>${titre} <span class="status ${doc.status}">${STATUS_LABEL[doc.status]}</span>
        <span class="num">N° ${e(doc.numero)}</span>
      </h1>
      <div class="muted">Émise le <strong>${fmtDate(doc.dateEmission)}</strong></div>
      ${doc.dateEcheance ? `<div class="muted">${doc.type === 'devis' ? 'Validité jusqu’au' : 'Échéance le'} <strong>${fmtDate(doc.dateEcheance)}</strong></div>` : ''}
    </div>
  </header>

  <div class="blocks">
    <div class="block">
      <div class="label">Émetteur</div>
      <div><strong>${e(emetteur.nom) || '—'}</strong></div>
      ${emetteur.adresse ? `<div>${e(emetteur.adresse)}</div>` : ''}
      ${(emetteur.codePostal || emetteur.ville) ? `<div>${e([emetteur.codePostal, emetteur.ville].filter(Boolean).join(' '))}</div>` : ''}
      ${emetteur.siret ? `<div class="muted">SIRET ${e(emetteur.siret)}</div>` : ''}
    </div>
    <div class="block">
      <div class="label">Client</div>
      <div><strong>${e(cli.nom) || '—'}</strong></div>
      ${cli.adresse ? `<div>${e(cli.adresse)}</div>` : ''}
      ${(cli.codePostal || cli.ville) ? `<div>${e([cli.codePostal, cli.ville].filter(Boolean).join(' '))}</div>` : ''}
      ${cli.siren ? `<div class="muted">SIREN ${e(cli.siren)}</div>` : ''}
      ${cli.tvaIntra ? `<div class="muted">TVA ${e(cli.tvaIntra)}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:55%">Désignation</th>
        <th style="width:10%" class="right">Qté</th>
        <th style="width:15%" class="right">PU HT</th>
        <th style="width:20%" class="right">Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${doc.lignes.map((l) => `
        <tr>
          <td>
            <div><strong>${e(l.libelle)}</strong></div>
            ${l.description ? `<div class="desc">${e(l.description)}</div>` : ''}
          </td>
          <td class="num">${l.quantite}</td>
          <td class="num">${formatEUR(l.prixUnitaireHT)}</td>
          <td class="num">${formatEUR((l.quantite ?? 0) * (l.prixUnitaireHT ?? 0))}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr><td colspan="3" class="right muted">Total HT</td><td class="right"><strong>${formatEUR(doc.totalHT)}</strong></td></tr>
      ${doc.tvaApplicable ? `<tr><td colspan="3" class="right muted">TVA ${doc.tvaPct ?? 20} %</td><td class="right">${formatEUR(doc.totalTVA)}</td></tr>` : ''}
      <tr class="total"><td colspan="3" class="right">Total ${doc.tvaApplicable ? 'TTC' : 'à payer'}</td><td class="right">${formatEUR(doc.totalTTC)}</td></tr>
    </tfoot>
  </table>

  <div class="conditions">
    <div class="label">Mentions légales & conditions</div>
    <div>${e(mentionTVA)}</div>
    ${doc.conditions ? `<div style="margin-top:6px">${e(doc.conditions)}</div>` : ''}
    ${doc.notes ? `<div style="margin-top:6px"><em>${e(doc.notes)}</em></div>` : ''}
    ${(emetteur.iban) ? `<div style="margin-top:6px"><strong>Coordonnées bancaires :</strong> IBAN ${e(emetteur.iban)}${emetteur.bic ? ' · BIC ' + e(emetteur.bic) : ''}</div>` : ''}
  </div>

  <div class="footer">
    ${e(emetteur.nom) || 'Mon entreprise'}${emetteur.siret ? ' · SIRET ' + e(emetteur.siret) : ''} · Document généré via Swivo
  </div>

  <script>
    // Auto-print on direct open (?print=1)
    if (location.search.includes('print=1')) { setTimeout(() => window.print(), 250); }
  </script>
</body>
</html>`;
}

/** Ouvre une fenêtre avec le document imprimable, prêt à exporter en PDF (Ctrl+P → "Enregistrer en PDF"). */
export function ouvrirImpression(doc: BillingDoc, emetteur: Emetteur): void {
  const html = renderDocHtml(doc, emetteur);
  const win = window.open('', '_blank', 'width=900,height=1100');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 350);
}

/** Télécharge le HTML autonome (sera ouvert en PDF par le navigateur). */
export function telechargerHtml(doc: BillingDoc, emetteur: Emetteur): void {
  const html = renderDocHtml(doc, emetteur);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${doc.type}-${doc.numero}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function telechargerCSV(content: string, filename = 'factures.csv'): void {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
