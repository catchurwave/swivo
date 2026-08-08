import{s as P,r as Y,p as H,k as _,E as J,j as q,C as K,G as R,R as f,n as G,m as Q,o as W,g as X,i as Z,B as O,h as tt,z as C,y as F}from"./wizard-BrepEI2s.js";const U=()=>f("swivo.pilotage.encaissements.v1"),N=()=>f("swivo.pilotage.depenses.v1"),$=()=>f("swivo.pilotage.profil.v1"),g={categorieDefaut:"service_bnc",versementLiberatoire:!1,regimeDeclaration:"mensuel"};function m(){try{const t=localStorage.getItem(U());return t?JSON.parse(t):[]}catch{return[]}}function v(t){try{localStorage.setItem(U(),JSON.stringify(t))}catch{}}function et(t){const e={...t,id:k()};return v([e,...m()]),J(e),e}function dt(t){v(m().filter(e=>e.id!==t)),_(t)}function S(){try{const t=localStorage.getItem(N());return t?JSON.parse(t):[]}catch{return[]}}function D(t){try{localStorage.setItem(N(),JSON.stringify(t))}catch{}}function ut(t){const e={...t,id:k()};return D([e,...S()]),K(e),e}function pt(t){D(S().filter(e=>e.id!==t)),q(t)}function nt(){try{const t=localStorage.getItem($());return t?{...g,...JSON.parse(t)}:g}catch{return g}}function ft(t){const e={...nt(),...t};try{localStorage.setItem($(),JSON.stringify(e))}catch{}return R({profil:e}),e}function it(t=new Date){const e=t.getFullYear(),n=t.getMonth(),i=new Date(e,n,1).toISOString().slice(0,10),o=new Date(e,n+1,0).toISOString().slice(0,10);return{from:i,to:o}}function mt(t=new Date().getFullYear()){return{from:`${t}-01-01`,to:`${t}-12-31`}}function gt(t=new Date){const e=Math.floor(t.getMonth()/3),n=t.getFullYear(),i=new Date(n,e*3,1).toISOString().slice(0,10),o=new Date(n,e*3+3,0).toISOString().slice(0,10);return{from:i,to:o}}function ot(t,e=m()){return e.filter(n=>n.date>=t.from&&n.date<=t.to).reduce((n,i)=>n+i.montant,0)}function vt(t=m(),e=new Date){const n=[];for(let i=11;i>=0;i--){const o=new Date(e.getFullYear(),e.getMonth()-i,1),a=it(o);n.push({mois:o.toLocaleDateString("fr-FR",{month:"short",year:"2-digit"}),ca:ot(a,t)})}return n}function ht(t,e=S()){return e.filter(n=>n.date>=t.from&&n.date<=t.to).reduce((n,i)=>n+i.montant,0)}function k(){return typeof crypto<"u"&&"randomUUID"in crypto?crypto.randomUUID():"enc-"+Math.random().toString(36).slice(2)+Date.now().toString(36)}async function bt(){try{const[t,e,n]=await Promise.all([P(),Y(),H()]);if(e&&v(e),n&&D(n),t&&t.profil&&Object.keys(t.profil).length>0)try{localStorage.setItem($(),JSON.stringify({...g,...t.profil}))}catch{}return!!(e||n||t)}catch{return!1}}const w="swivo.billing.docs.v1",u="swivo.billing.clients.v1",p="swivo.billing.catalog.v1",T="swivo.billing.emetteur.v1",B={nom:"",prefixeFacture:`F-${new Date().getFullYear()}-`,prefixeDevis:`D-${new Date().getFullYear()}-`,prefixeAvoir:`A-${new Date().getFullYear()}-`,derniereNumeroFacture:0,derniereNumeroDevis:0,derniereNumeroAvoir:0,conditionsParDefaut:"Paiement à 30 jours. Aucun escompte pour paiement anticipé. Pénalités de retard : taux légal + 40 € forfaitaires (art. L441-10 C. commerce).",notesParDefaut:"TVA non applicable, art. 293 B du CGI."};function h(t,e){try{const n=localStorage.getItem(f(t));return n?JSON.parse(n):e}catch{return e}}function c(t,e){try{localStorage.setItem(f(t),JSON.stringify(e))}catch{}}function E(){return{...B,...h(T,{})}}function y(t){const e={...E(),...t};return c(T,e),R({emetteur:e}),e}function j(){return h(u,[])}function yt(t){const e=j();if(t.id){const i=e.map(a=>a.id===t.id?{...a,...t,id:t.id}:a);c(u,i);const o=i.find(a=>a.id===t.id);return C(o),o}const n={...t,id:b("cli"),createdAt:new Date().toISOString()};return c(u,[n,...e]),C(n),n}function xt(t){c(u,j().filter(e=>e.id!==t)),tt(t)}function L(){return h(p,[])}function $t(t){const e=L();if(t.id){const i=e.map(a=>a.id===t.id?{...a,...t,id:t.id}:a);c(p,i);const o=i.find(a=>a.id===t.id);return F(o),o}const n={...t,id:b("cat")};return c(p,[n,...e]),F(n),n}function St(t){c(p,L().filter(e=>e.id!==t)),X(t)}function l(){return h(w,[])}function I(t){c(w,t)}function rt(t){const e=E();if(t==="facture"){const i=(e.derniereNumeroFacture??0)+1;return`${e.prefixeFacture??""}${String(i).padStart(3,"0")}`}if(t==="devis"){const i=(e.derniereNumeroDevis??0)+1;return`${e.prefixeDevis??""}${String(i).padStart(3,"0")}`}const n=(e.derniereNumeroAvoir??0)+1;return`${e.prefixeAvoir??""}${String(n).padStart(3,"0")}`}function at(t){const e=E();y(t==="facture"?{derniereNumeroFacture:(e.derniereNumeroFacture??0)+1}:t==="devis"?{derniereNumeroDevis:(e.derniereNumeroDevis??0)+1}:{derniereNumeroAvoir:(e.derniereNumeroAvoir??0)+1})}function st(t){const e=M(t.lignes,t.tvaApplicable,t.tvaPct??20),n=t.numero??rt(t.type),i={...t,id:b("doc"),numero:n,status:t.status??"brouillon",...e};return t.numero||at(t.type),I([i,...l()]),O(i),i}function A(t,e){const n=l(),i=n.findIndex(a=>a.id===t);if(i<0)return null;const o={...n[i],...e};return(e.lignes||e.tvaApplicable!==void 0||e.tvaPct!==void 0)&&Object.assign(o,M(o.lignes,o.tvaApplicable,o.tvaPct??20)),n[i]=o,I(n),O(o),o}function Dt(t){I(l().filter(e=>e.id!==t)),Z(t)}function wt(t){const n=l().find(i=>i.id===t);return n?st({type:n.type,clientId:n.clientId,clientSnapshot:n.clientSnapshot,dateEmission:new Date().toISOString().slice(0,10),dateEcheance:n.dateEcheance,lignes:n.lignes.map(i=>({...i,id:b("lig")})),notes:n.notes,conditions:n.conditions,tvaApplicable:n.tvaApplicable,tvaPct:n.tvaPct,categorieFiscale:n.categorieFiscale,acompte:n.acompte}):null}function Tt(t,e){var r;const n=l().find(s=>s.id===t);if(!n||n.type!=="facture")return null;const i=new Date().toISOString().slice(0,10),o=n.totalTTC,a=et({date:i,montant:o,categorie:n.categorieFiscale,libelle:`${n.numero} — ${((r=n.clientSnapshot)==null?void 0:r.nom)??""}`.trim(),source:"facture",factureId:n.id});return A(t,{status:"paye",paidAt:i,paidAmount:o,encaissementId:a.id})}function Et(t){const e=l().find(i=>i.id===t);if(!(e!=null&&e.encaissementId))return null;const n=m().filter(i=>i.id!==e.encaissementId);return v(n),A(t,{status:"envoye",paidAt:void 0,paidAmount:void 0,encaissementId:void 0})}function It(t){const e=l().find(n=>n.id===t);return e?A(t,{reminderCount:(e.reminderCount??0)+1,lastReminderAt:new Date().toISOString()}):null}function At(t){var o;const e=((o=t.clientSnapshot)==null?void 0:o.email)??"",n=`Relance — Facture ${t.numero}`,i=`Bonjour,

Sauf erreur de notre part, le règlement de la facture ${t.numero} d'un montant de ${d(t.totalTTC)} émise le ${t.dateEmission} reste à ce jour en attente.

Merci de bien vouloir procéder au règlement dans les meilleurs délais.

Cordialement,`;return`mailto:${e}?subject=${encodeURIComponent(n)}&body=${encodeURIComponent(i)}`}function M(t,e,n){const i=x(t.reduce((r,s)=>r+(s.quantite??0)*(s.prixUnitaireHT??0),0)),o=e?x(i*n/100):0,a=x(i+o);return{totalHT:i,totalTVA:o,totalTTC:a}}function Ct(t,e=new Date){return t.type!=="facture"||t.status!=="envoye"||!t.dateEcheance?!1:new Date(t.dateEcheance)<e}function Ft(t){const e=["Numero","Type","Date","Client","HT","TVA","TTC","Statut","Payé le"],n=t.map(i=>{var o;return[i.numero,i.type,i.dateEmission,((o=i.clientSnapshot)==null?void 0:o.nom)??"",i.totalHT.toFixed(2),i.totalTVA.toFixed(2),i.totalTTC.toFixed(2),i.status,i.paidAt??""]});return[e,...n].map(i=>i.map(o=>`"${String(o).replace(/"/g,'""')}"`).join(",")).join(`
`)}function d(t){return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(t)}function x(t){return Math.round(t*100)/100}function b(t="id"){return typeof crypto<"u"&&"randomUUID"in crypto?`${t}-${crypto.randomUUID().slice(0,8)}`:`${t}-${Math.random().toString(36).slice(2,10)}`}const ct={brouillon:"Brouillon",envoye:"Envoyée",accepte:"Acceptée",refuse:"Refusée",paye:"Payée",retard:"En retard",annule:"Annulée"};async function Pt(){try{const[t,e,n,i]=await Promise.all([G(),Q(),W(),P()]);return t&&c(u,t),e&&c(p,e),n&&c(w,n),i!=null&&i.emetteur&&Object.keys(i.emetteur).length>0&&c(T,{...B,...i.emetteur}),!!(t||e||n||i)}catch{return!1}}const Rt={brouillon:"bg-ink-muted/10 text-ink-muted",envoye:"bg-primary-50 text-primary-700",accepte:"bg-secondary-100 text-secondary-800",refuse:"bg-rose-100 text-rose-700",paye:"bg-secondary-100 text-secondary-800",retard:"bg-rose-100 text-rose-700",annule:"bg-ink-muted/10 text-ink-muted"};function V(t,e){const n=t.type==="facture"?"FACTURE":t.type==="devis"?"DEVIS":"AVOIR",i=t.tvaApplicable?`TVA appliquée : ${t.tvaPct??20} %`:"TVA non applicable, art. 293 B du CGI",o=t.clientSnapshot??{},a=s=>s?new Date(s).toLocaleDateString("fr-FR"):"",r=s=>s?s.replace(/[<>&]/g,z=>({"<":"&lt;",">":"&gt;","&":"&amp;"})[z]):"";return`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${n} ${r(t.numero)}</title>
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
      <div style="font-weight:700;font-size:18px;letter-spacing:-0.01em">${r(e.nom)||"Mon entreprise"}</div>
      <div class="muted">${r(e.adresse)||""}</div>
      <div class="muted">${r([e.codePostal,e.ville].filter(Boolean).join(" "))}</div>
      <div class="muted">${r(e.email)||""} ${e.telephone?"· "+r(e.telephone):""}</div>
      ${e.siret?`<div class="muted">SIRET : ${r(e.siret)}</div>`:""}
    </div>
    <div style="text-align:right">
      <h1>${n} <span class="status ${t.status}">${ct[t.status]}</span>
        <span class="num">N° ${r(t.numero)}</span>
      </h1>
      <div class="muted">Émise le <strong>${a(t.dateEmission)}</strong></div>
      ${t.dateEcheance?`<div class="muted">${t.type==="devis"?"Validité jusqu’au":"Échéance le"} <strong>${a(t.dateEcheance)}</strong></div>`:""}
    </div>
  </header>

  <div class="blocks">
    <div class="block">
      <div class="label">Émetteur</div>
      <div><strong>${r(e.nom)||"—"}</strong></div>
      ${e.adresse?`<div>${r(e.adresse)}</div>`:""}
      ${e.codePostal||e.ville?`<div>${r([e.codePostal,e.ville].filter(Boolean).join(" "))}</div>`:""}
      ${e.siret?`<div class="muted">SIRET ${r(e.siret)}</div>`:""}
    </div>
    <div class="block">
      <div class="label">Client</div>
      <div><strong>${r(o.nom)||"—"}</strong></div>
      ${o.adresse?`<div>${r(o.adresse)}</div>`:""}
      ${o.codePostal||o.ville?`<div>${r([o.codePostal,o.ville].filter(Boolean).join(" "))}</div>`:""}
      ${o.siren?`<div class="muted">SIREN ${r(o.siren)}</div>`:""}
      ${o.tvaIntra?`<div class="muted">TVA ${r(o.tvaIntra)}</div>`:""}
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
      ${t.lignes.map(s=>`
        <tr>
          <td>
            <div><strong>${r(s.libelle)}</strong></div>
            ${s.description?`<div class="desc">${r(s.description)}</div>`:""}
          </td>
          <td class="num">${s.quantite}</td>
          <td class="num">${d(s.prixUnitaireHT)}</td>
          <td class="num">${d((s.quantite??0)*(s.prixUnitaireHT??0))}</td>
        </tr>
      `).join("")}
    </tbody>
    <tfoot>
      <tr><td colspan="3" class="right muted">Total HT</td><td class="right"><strong>${d(t.totalHT)}</strong></td></tr>
      ${t.tvaApplicable?`<tr><td colspan="3" class="right muted">TVA ${t.tvaPct??20} %</td><td class="right">${d(t.totalTVA)}</td></tr>`:""}
      <tr class="total"><td colspan="3" class="right">Total ${t.tvaApplicable?"TTC":"à payer"}</td><td class="right">${d(t.totalTTC)}</td></tr>
    </tfoot>
  </table>

  <div class="conditions">
    <div class="label">Mentions légales & conditions</div>
    <div>${r(i)}</div>
    ${t.conditions?`<div style="margin-top:6px">${r(t.conditions)}</div>`:""}
    ${t.notes?`<div style="margin-top:6px"><em>${r(t.notes)}</em></div>`:""}
    ${e.iban?`<div style="margin-top:6px"><strong>Coordonnées bancaires :</strong> IBAN ${r(e.iban)}${e.bic?" · BIC "+r(e.bic):""}</div>`:""}
  </div>

  <div class="footer">
    ${r(e.nom)||"Mon entreprise"}${e.siret?" · SIRET "+r(e.siret):""} · Document généré via Swivo
  </div>

  <script>
    // Auto-print on direct open (?print=1)
    if (location.search.includes('print=1')) { setTimeout(() => window.print(), 250); }
  <\/script>
</body>
</html>`}function Ot(t,e){const n=V(t,e),i=window.open("","_blank","width=900,height=1100");i&&(i.document.open(),i.document.write(n),i.document.close(),setTimeout(()=>i.print(),350))}function Ut(t,e){const n=V(t,e),i=new Blob([n],{type:"text/html;charset=utf-8"}),o=document.createElement("a");o.href=URL.createObjectURL(i),o.download=`${t.type}-${t.numero}.html`,o.click(),URL.revokeObjectURL(o.href)}function Nt(t,e="factures.csv"){const n=new Blob(["\uFEFF"+t],{type:"text/csv;charset=utf-8"}),i=document.createElement("a");i.href=URL.createObjectURL(n),i.download=e,i.click(),URL.revokeObjectURL(i.href)}export{It as A,Ot as B,mt as C,it as D,gt as E,y as F,ft as G,Ct as H,Pt as I,bt as J,Nt as K,Ut as L,b as M,A as N,$t as O,yt as P,Rt as S,ct as a,ut as b,et as c,Et as d,At as e,vt as f,ot as g,st as h,St as i,xt as j,pt as k,Dt as l,dt as m,ht as n,wt as o,Ft as p,d as q,rt as r,E as s,nt as t,L as u,j as v,S as w,l as x,m as y,Tt as z};
