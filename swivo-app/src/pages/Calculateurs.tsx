import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import {
  CATEGORIE_LABEL,
  PLAFOND_CA,
  SEUIL_TVA_BASIQUE,
  SEUIL_TVA_MAJOREE,
  ABATTEMENT_IR,
  ACRE_REDUCTION,
  calculerCotisations,
  revenuNetImposable,
  formatEUR,
  formatPct,
  type CategorieMicro,
} from '@/lib/urssaf';

export function CalculateursPage() {
  return (
    <>
      <Seo
        title="Simulateurs micro-entreprise — URSSAF, TVA, revenu net"
        description="Calculez vos cotisations URSSAF, votre revenu net imposable, votre marge avant le seuil de TVA — tout pour piloter votre micro."
        path="/outils/calculateurs"
      />
      <section className="container-page py-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge-secondary">Outils gratuits</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Simulateurs micro</h1>
          <p className="mt-3 text-ink-muted">Estimations conformes aux taux 2026 (URSSAF + BOFIP). Pour la déclaration assistée, <Link to="/urssaf" className="link">utilisez le module URSSAF</Link>.</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <UrssafCalc />
          <SeuilTvaCalc />
          <RevenuNetCalc />
        </div>
      </section>
    </>
  );
}

function UrssafCalc() {
  const [ca, setCa] = useState(40000);
  const [cat, setCat] = useState<CategorieMicro>('service_bnc');
  const [acre, setAcre] = useState(false);
  const [vl, setVl] = useState(false);
  const calcul = calculerCotisations(ca, cat, { acreActive: acre, versementLiberatoire: vl });

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg font-semibold text-ink">URSSAF — Cotisations</h2>
      <p className="mt-1 text-xs text-ink-muted">Calcul exact selon catégorie + options.</p>

      <label className="label mt-4">CA annuel</label>
      <input type="number" className="input" min={0} step={500} value={ca} onChange={(e) => setCa(+e.target.value || 0)} />

      <label className="label mt-3">Catégorie</label>
      <select className="input" value={cat} onChange={(e) => setCat(e.target.value as CategorieMicro)}>
        {(Object.keys(CATEGORIE_LABEL) as CategorieMicro[]).map((c) => <option key={c} value={c}>{CATEGORIE_LABEL[c]}</option>)}
      </select>

      <div className="mt-3 grid gap-2">
        <label className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${acre ? 'border-secondary-300 bg-secondary-50' : 'border-surface-border'}`}>
          <input type="checkbox" checked={acre} onChange={(e) => setAcre(e.target.checked)} />
          ACRE 1ère année (- {formatPct(ACRE_REDUCTION)})
        </label>
        <label className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${vl ? 'border-secondary-300 bg-secondary-50' : 'border-surface-border'}`}>
          <input type="checkbox" checked={vl} onChange={(e) => setVl(e.target.checked)} />
          Versement libératoire IR
        </label>
      </div>

      <div className="mt-5 rounded-xl bg-primary-50 p-4">
        <p className="text-xs uppercase tracking-wider text-primary-700">À verser URSSAF</p>
        <p className="mt-1 font-display text-2xl font-bold text-primary-800">{formatEUR(calcul.totalCharges)}</p>
        <p className="mt-1 text-xs text-primary-700">Taux effectif {formatPct(calcul.taux.effectif)}</p>
      </div>
      <div className="mt-3 rounded-xl bg-secondary-50 p-3">
        <p className="text-xs text-secondary-700">Net restant : <strong>{formatEUR(calcul.netRestant)}</strong></p>
      </div>
    </div>
  );
}

function SeuilTvaCalc() {
  const [ca, setCa] = useState(30000);
  const [cat, setCat] = useState<CategorieMicro>('service_bnc');
  const seuilBasique = SEUIL_TVA_BASIQUE[cat];
  const seuilMajore = SEUIL_TVA_MAJOREE[cat];
  const plafond = PLAFOND_CA[cat];
  const margeBasique = Math.max(0, seuilBasique - ca);
  const pctBasique = Math.min(1, ca / seuilBasique);
  const pctPlafond = Math.min(1, ca / plafond);
  const status =
    ca >= seuilMajore ? { msg: 'TVA obligatoire — passage au réel immédiat', cls: 'bg-rose-50 text-rose-900 border-rose-300' } :
    ca >= seuilBasique ? { msg: 'TVA à partir du mois suivant', cls: 'bg-amber-50 text-amber-900 border-amber-300' } :
    ca >= seuilBasique * 0.85 ? { msg: 'Seuil TVA proche', cls: 'bg-amber-50 text-amber-900 border-amber-300' } :
    { msg: 'Franchise en base — pas de TVA à facturer', cls: 'bg-secondary-50 text-secondary-900 border-secondary-300' };

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Seuils TVA & plafond micro</h2>
      <p className="mt-1 text-xs text-ink-muted">Suivez votre marge avant assujettissement.</p>

      <label className="label mt-4">CA cumulé année en cours</label>
      <input type="number" className="input" min={0} step={500} value={ca} onChange={(e) => setCa(+e.target.value || 0)} />

      <label className="label mt-3">Catégorie</label>
      <select className="input" value={cat} onChange={(e) => setCat(e.target.value as CategorieMicro)}>
        {(Object.keys(CATEGORIE_LABEL) as CategorieMicro[]).map((c) => <option key={c} value={c}>{CATEGORIE_LABEL[c]}</option>)}
      </select>

      <div className={`mt-5 rounded-xl border p-3 text-sm ${status.cls}`}>{status.msg}</div>

      <div className="mt-4 space-y-3">
        <Bar label={`TVA basique ${formatEUR(seuilBasique)}`} pct={pctBasique} />
        <Bar label={`Plafond micro ${formatEUR(plafond)}`}    pct={pctPlafond} />
        <p className="text-xs text-ink-muted">Marge avant TVA : <strong>{formatEUR(margeBasique)}</strong></p>
      </div>
    </div>
  );
}

function RevenuNetCalc() {
  const [ca, setCa] = useState(40000);
  const [cat, setCat] = useState<CategorieMicro>('service_bnc');
  const [tmi, setTmi] = useState(11);
  const cotisations = calculerCotisations(ca, cat);
  const revenuImposable = revenuNetImposable(ca, cat);
  const irEstime = (revenuImposable * tmi) / 100;
  const netDisponible = ca - cotisations.totalCharges - irEstime;

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Revenu net réel</h2>
      <p className="mt-1 text-xs text-ink-muted">Après URSSAF + IR au barème (hors versement libératoire).</p>

      <label className="label mt-4">CA annuel</label>
      <input type="number" className="input" min={0} step={500} value={ca} onChange={(e) => setCa(+e.target.value || 0)} />

      <label className="label mt-3">Catégorie</label>
      <select className="input" value={cat} onChange={(e) => setCat(e.target.value as CategorieMicro)}>
        {(Object.keys(CATEGORIE_LABEL) as CategorieMicro[]).map((c) => <option key={c} value={c}>{CATEGORIE_LABEL[c]}</option>)}
      </select>

      <label className="label mt-3">Tranche marginale IR</label>
      <select className="input" value={tmi} onChange={(e) => setTmi(+e.target.value)}>
        <option value={0}>0 %</option>
        <option value={11}>11 %</option>
        <option value={30}>30 %</option>
        <option value={41}>41 %</option>
        <option value={45}>45 %</option>
      </select>

      <div className="mt-5 space-y-3">
        <Stat label="Abattement forfaitaire IR" value={formatPct(ABATTEMENT_IR[cat])} />
        <Stat label="Revenu net imposable" value={formatEUR(revenuImposable)} />
        <Stat label="IR estimé" value={formatEUR(irEstime)} />
        <Stat label="URSSAF" value={formatEUR(cotisations.totalCharges)} />
        <Stat label="Net disponible" value={formatEUR(netDisponible)} accent />
      </div>
    </div>
  );
}

function Bar({ label, pct }: { label: string; pct: number }) {
  const w = Math.round(pct * 100);
  const color = pct >= 1 ? 'bg-rose-500' : pct >= 0.85 ? 'bg-amber-500' : 'bg-secondary-500';
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{label}</span>
        <span className="font-semibold text-ink">{w} %</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-border">
        <div className={`h-full transition-all ${color}`} style={{ width: `${Math.min(100, w)}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${accent ? 'bg-secondary-50' : 'bg-surface-muted'}`}>
      <span className="text-xs uppercase tracking-wider text-ink-muted">{label}</span>
      <span className={`font-display text-lg font-bold ${accent ? 'text-secondary-700' : 'text-ink'}`}>{value}</span>
    </div>
  );
}
