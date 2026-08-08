import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import {
  type CategorieMicro,
  type RegimeDeclaration,
  CATEGORIE_LABEL,
  calculerCotisations,
  prochainesEcheancesURSSAF,
  formatEUR,
  formatPct,
  ACRE_REDUCTION,
} from '@/lib/urssaf';
import {
  caPeriode,
  periodeMois,
  periodeTrimestre,
  getProfilFiscal,
  saveProfilFiscal,
  ensureDemoData,
  syncFromServer,
} from '@/lib/revenus';
import { Icon } from '@/components/Icons';
import { useToast } from '@/components/Toast';

export function UrssafPage() {
  const toast = useToast();
  const [profil, setProfil] = useState(() => getProfilFiscal());
  const [ca, setCa] = useState<string>('');
  const [acre, setAcre] = useState<boolean>(false);
  const [vl, setVl] = useState<boolean>(profil.versementLiberatoire);
  const [categorie, setCategorie] = useState<CategorieMicro>(profil.categorieDefaut);
  const [regime, setRegime] = useState<RegimeDeclaration>(profil.regimeDeclaration);

  useEffect(() => {
    ensureDemoData();
    void syncFromServer().then((ok) => { if (ok) setProfil(getProfilFiscal()); });
  }, []);

  // Pré-remplir CA depuis encaissements de la période actuelle
  const periodeAuto = useMemo(() => regime === 'mensuel' ? periodeMois() : periodeTrimestre(), [regime]);
  const caAuto = useMemo(() => caPeriode(periodeAuto), [periodeAuto]);

  const caNum = Number(ca.replace(',', '.')) || 0;
  const calcul = useMemo(() => calculerCotisations(caNum, categorie, { acreActive: acre, versementLiberatoire: vl }), [caNum, categorie, acre, vl]);
  const echeances = useMemo(() => prochainesEcheancesURSSAF(regime, 4), [regime]);

  function applyAuto() {
    setCa(String(caAuto));
    toast.push({ kind: 'info', message: `CA pré-rempli depuis vos encaissements : ${formatEUR(caAuto)}`, ttl: 3000 });
  }

  function saveProfil() {
    const next = saveProfilFiscal({ categorieDefaut: categorie, versementLiberatoire: vl, regimeDeclaration: regime });
    setProfil(next);
    toast.push({ kind: 'success', message: 'Profil fiscal mis à jour.', ttl: 3000 });
  }

  function simulateDeclaration() {
    if (caNum <= 0) {
      toast.push({ kind: 'warning', message: 'Saisissez un CA pour simuler la déclaration.', ttl: 4000 });
      return;
    }
    toast.push({
      kind: 'success',
      title: 'Simulation prête',
      message: `Vous devrez payer ${formatEUR(calcul.totalCharges)} à l'URSSAF. Connectez-vous sur autoentrepreneur.urssaf.fr pour déclarer ${formatEUR(caNum)}.`,
      ttl: 8000,
    });
  }

  return (
    <>
      <Seo title="Assistant déclaration URSSAF — Swivo" description="Calculez vos cotisations URSSAF en temps réel et préparez votre déclaration micro-entrepreneur." path="/urssaf" />
      <section className="container-page py-10 lg:py-14">
        <div className="mb-8">
          <span className="badge-primary"><Icon.Calc className="h-3.5 w-3.5" /> URSSAF</span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Assistant de déclaration URSSAF</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">Simulez vos cotisations en temps réel selon votre CA encaissé, votre catégorie d'activité et vos options fiscales.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="card p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Période — {regime === 'mensuel' ? 'Mensuelle' : 'Trimestrielle'}</h2>
            <p className="mt-1 text-sm text-ink-muted">{periodeAuto.from} → {periodeAuto.to}</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="label" htmlFor="ca">Chiffre d'affaires encaissé</label>
                <div className="flex gap-2">
                  <input id="ca" type="number" inputMode="decimal" className="input" placeholder="0" value={ca} onChange={(e) => setCa(e.target.value)} />
                  <span className="self-center text-sm text-ink-muted">€</span>
                  {caAuto > 0 && (
                    <button onClick={applyAuto} className="btn-outline text-xs whitespace-nowrap">
                      Auto {formatEUR(caAuto)}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-muted">CA réellement encaissé sur la période (pas le facturé).</p>
              </div>

              <div>
                <label className="label">Catégorie d'activité</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(CATEGORIE_LABEL) as CategorieMicro[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategorie(c)}
                      className={`rounded-xl border p-3 text-left text-sm transition ${categorie === c ? 'border-primary-500 bg-primary-50/40 ring-2 ring-primary-500/20' : 'border-surface-border hover:border-primary-300'}`}
                    >
                      <span className="block font-semibold text-ink">{CATEGORIE_LABEL[c]}</span>
                      <span className="block text-xs text-ink-muted">Cotisations {formatPct({ vente_bic: 0.123, service_bic: 0.212, service_bnc: 0.211, liberal_cipav: 0.232 }[c])}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`flex items-start gap-3 rounded-lg border p-3 ${acre ? 'border-secondary-300 bg-secondary-50' : 'border-surface-border'}`}>
                  <input type="checkbox" checked={acre} onChange={(e) => setAcre(e.target.checked)} className="mt-1" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">ACRE — 1ère année</span>
                    <span className="block text-xs text-ink-muted">Exonération de {formatPct(ACRE_REDUCTION)} des cotisations</span>
                  </span>
                </label>
                <label className={`flex items-start gap-3 rounded-lg border p-3 ${vl ? 'border-secondary-300 bg-secondary-50' : 'border-surface-border'}`}>
                  <input type="checkbox" checked={vl} onChange={(e) => setVl(e.target.checked)} className="mt-1" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">Versement libératoire IR</span>
                    <span className="block text-xs text-ink-muted">Payez l'IR en même temps que l'URSSAF</span>
                  </span>
                </label>
              </div>

              <div>
                <label className="label">Régime de déclaration</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button onClick={() => setRegime('mensuel')} className={`rounded-xl border p-3 text-sm transition ${regime === 'mensuel' ? 'border-primary-500 bg-primary-50/40' : 'border-surface-border'}`}>Mensuel</button>
                  <button onClick={() => setRegime('trimestriel')} className={`rounded-xl border p-3 text-sm transition ${regime === 'trimestriel' ? 'border-primary-500 bg-primary-50/40' : 'border-surface-border'}`}>Trimestriel</button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={simulateDeclaration} className="btn-primary">Simuler ma déclaration</button>
                <button onClick={saveProfil} className="btn-outline">Enregistrer ce profil</button>
                <a href="https://autoentrepreneur.urssaf.fr" target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">→ URSSAF.fr</a>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">À payer URSSAF</h3>
              <p className="mt-2 font-display text-4xl font-bold text-primary-700">{formatEUR(calcul.totalCharges)}</p>
              <p className="mt-1 text-xs text-ink-muted">Taux effectif : {formatPct(calcul.taux.effectif)}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="Cotisations sociales" v={formatEUR(calcul.urssaf)} sub={formatPct(calcul.taux.urssaf)} />
                <Row k="CFP" v={formatEUR(calcul.cfp)} sub={formatPct(calcul.taux.cfp)} />
                {calcul.taxeChambre > 0 && <Row k="Taxe CCI/CMA" v={formatEUR(calcul.taxeChambre)} sub={formatPct(calcul.taux.taxeChambre)} />}
                {vl && <Row k="Versement IR" v={formatEUR(calcul.versementLiberatoire)} sub={formatPct(calcul.taux.versementLiberatoire)} />}
              </dl>
              <div className="mt-4 rounded-lg bg-secondary-50 px-3 py-2 text-sm text-secondary-900">
                <strong>Net restant : {formatEUR(calcul.netRestant)}</strong>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">Prochaines échéances</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {echeances.map((e) => (
                  <li key={e.date} className="flex items-start justify-between gap-3 border-b border-surface-border/40 pb-2 last:border-0">
                    <div>
                      <p className="font-semibold text-ink">{e.label}</p>
                      <p className="text-xs text-ink-muted">{e.periode}</p>
                    </div>
                    <span className="badge bg-primary-50 text-primary-700">{new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link to="/pilotage" className="card block p-4 transition hover:border-primary-300 hover:shadow-soft">
              <p className="text-sm font-semibold text-primary-700">→ Voir le cockpit financier</p>
              <p className="mt-1 text-xs text-ink-muted">Vue globale CA / charges / bénéfices, alertes seuils.</p>
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}

function Row({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-surface-border/40 pb-1 last:border-0">
      <dt>
        <span className="block text-ink">{k}</span>
        {sub && <span className="block text-xs text-ink-muted">{sub}</span>}
      </dt>
      <dd className="font-semibold text-ink">{v}</dd>
    </div>
  );
}
