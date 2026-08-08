import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import {
  addDepense,
  addEncaissement,
  caMensuel12Mois,
  caPeriode,
  deleteDepense,
  deleteEncaissement,
  depensesPeriode,
  ensureDemoData,
  getProfilFiscal,
  listDepenses,
  listEncaissements,
  periodeAnnee,
  periodeMois,
  saveProfilFiscal,
  syncFromServer,
  type Depense,
  type Encaissement,
} from '@/lib/revenus';
import {
  CATEGORIE_LABEL,
  alertesPlafonds,
  calculerCotisations,
  formatEUR,
  formatPct,
  PLAFOND_CA,
  type CategorieMicro,
} from '@/lib/urssaf';
import { Icon } from '@/components/Icons';
import { useToast } from '@/components/Toast';

export function PilotagePage() {
  const toast = useToast();
  const [profil, setProfil] = useState(() => getProfilFiscal());
  const [encs, setEncs] = useState<Encaissement[]>([]);
  const [deps, setDeps] = useState<Depense[]>([]);
  const [yearOffset, setYearOffset] = useState(0);

  useEffect(() => {
    ensureDemoData();
    setEncs(listEncaissements());
    setDeps(listDepenses());
    // Pull serveur en arrière-plan, puis re-hydrate
    void syncFromServer().then((ok) => {
      if (ok) {
        setEncs(listEncaissements());
        setDeps(listDepenses());
        setProfil(getProfilFiscal());
      }
    });
  }, []);

  const year = new Date().getFullYear() + yearOffset;
  const periodeY = useMemo(() => periodeAnnee(year), [year]);
  const periodeMo = useMemo(() => periodeMois(), []);

  const caAnnuel = useMemo(() => caPeriode(periodeY, encs), [encs, periodeY]);
  const caMensuel = useMemo(() => caPeriode(periodeMo, encs), [encs, periodeMo]);
  const depAnnuel = useMemo(() => depensesPeriode(periodeY, deps), [deps, periodeY]);
  const data12 = useMemo(() => caMensuel12Mois(encs), [encs]);

  const cotis = useMemo(() => calculerCotisations(caAnnuel, profil.categorieDefaut, {
    versementLiberatoire: profil.versementLiberatoire,
    acreActive: profil.acreJusquAu ? new Date(profil.acreJusquAu) > new Date() : false,
  }), [caAnnuel, profil]);

  const alertes = useMemo(() => alertesPlafonds(caAnnuel, profil.categorieDefaut), [caAnnuel, profil.categorieDefaut]);
  const beneficeNet = caAnnuel - cotis.totalCharges - depAnnuel;
  const objectifAnnuel = profil.caObjectifAnnuel ?? PLAFOND_CA[profil.categorieDefaut];
  const pctObjectif = Math.min(1, caAnnuel / objectifAnnuel);

  return (
    <>
      <Seo title="Cockpit financier — Swivo" description="Tableau de bord CA, charges, bénéfices et alertes seuils pour votre micro-entreprise." path="/pilotage" />
      <section className="container-page py-10 lg:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="badge-primary"><Icon.Calc className="h-3.5 w-3.5" /> Pilotage</span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Votre cockpit micro-entreprise</h1>
            <p className="mt-2 max-w-2xl text-ink-muted">CA, charges, bénéfices, alertes de seuils — tout votre pilotage en temps réel.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setYearOffset((o) => o - 1)} className="btn-ghost text-xs">←</button>
            <span className="font-display text-lg font-semibold text-ink">{year}</span>
            <button onClick={() => setYearOffset((o) => o + 1)} className="btn-ghost text-xs">→</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="CA cumulé" value={formatEUR(caAnnuel)} sub={`Objectif : ${formatEUR(objectifAnnuel)}`} progress={pctObjectif} accent="primary" />
          <Kpi title="CA du mois" value={formatEUR(caMensuel)} sub="Encaissements en cours" />
          <Kpi title="Cotisations URSSAF" value={formatEUR(cotis.totalCharges)} sub={`Taux effectif ${formatPct(cotis.taux.effectif)}`} accent="warning" />
          <Kpi title="Bénéfice net estimé" value={formatEUR(beneficeNet)} sub={`Après URSSAF + ${formatEUR(depAnnuel)} dépenses`} accent="secondary" />
        </div>

        {/* Alertes */}
        {alertes.length > 0 && (
          <div className="mt-6 space-y-2">
            {alertes.map((a) => (
              <div key={a.code} className={`rounded-xl border p-4 text-sm ${alertCls(a.niveau)}`}>
                <strong>{a.niveau === 'critical' ? '⛔' : '⚠️'} {a.message}</strong>
                {a.restant > 0 && <p className="mt-1 text-xs">Marge restante avant seuil : {formatEUR(a.restant)}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Graphique mensuel */}
        <div className="mt-8 card p-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Évolution sur 12 mois</h2>
            <span className="text-xs text-ink-muted">Cumul : {formatEUR(data12.reduce((s, d) => s + d.ca, 0))}</span>
          </div>
          <Chart data={data12} />
        </div>

        {/* Encaissements + dépenses */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <EncaissementsCard
            items={encs}
            categorieDefaut={profil.categorieDefaut}
            onAdd={(e) => { addEncaissement(e); setEncs(listEncaissements()); toast.push({ kind: 'success', message: 'Encaissement ajouté.', ttl: 2000 }); }}
            onDelete={(id) => { deleteEncaissement(id); setEncs(listEncaissements()); }}
          />
          <DepensesCard
            items={deps}
            onAdd={(d) => { addDepense(d); setDeps(listDepenses()); toast.push({ kind: 'success', message: 'Dépense ajoutée.', ttl: 2000 }); }}
            onDelete={(id) => { deleteDepense(id); setDeps(listDepenses()); }}
          />
        </div>

        {/* Profil fiscal raccourci */}
        <div className="mt-8 card p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Mon profil fiscal</h2>
          <p className="mt-1 text-sm text-ink-muted">Ces paramètres pilotent les calculs URSSAF et les alertes seuils.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Catégorie d'activité</label>
              <select className="input" value={profil.categorieDefaut} onChange={(e) => {
                const p = saveProfilFiscal({ categorieDefaut: e.target.value as CategorieMicro });
                setProfil(p);
              }}>
                {(Object.keys(CATEGORIE_LABEL) as CategorieMicro[]).map((c) => <option key={c} value={c}>{CATEGORIE_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Versement libératoire</label>
              <select className="input" value={profil.versementLiberatoire ? 'oui' : 'non'} onChange={(e) => {
                const p = saveProfilFiscal({ versementLiberatoire: e.target.value === 'oui' });
                setProfil(p);
              }}>
                <option value="non">Non</option>
                <option value="oui">Oui</option>
              </select>
            </div>
            <div>
              <label className="label">Régime de déclaration</label>
              <select className="input" value={profil.regimeDeclaration} onChange={(e) => {
                const p = saveProfilFiscal({ regimeDeclaration: e.target.value as 'mensuel' | 'trimestriel' });
                setProfil(p);
              }}>
                <option value="mensuel">Mensuel</option>
                <option value="trimestriel">Trimestriel</option>
              </select>
            </div>
            <div>
              <label className="label">CA objectif annuel (€)</label>
              <input className="input" type="number" value={profil.caObjectifAnnuel ?? ''} placeholder={String(PLAFOND_CA[profil.categorieDefaut])} onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : undefined;
                const p = saveProfilFiscal({ caObjectifAnnuel: v });
                setProfil(p);
              }} />
            </div>
            <div>
              <label className="label">ACRE jusqu'au</label>
              <input className="input" type="date" value={profil.acreJusquAu ?? ''} onChange={(e) => {
                const p = saveProfilFiscal({ acreJusquAu: e.target.value || undefined });
                setProfil(p);
              }} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/urssaf" className="btn-primary">→ Déclarer mes cotisations URSSAF</Link>
            <Link to="/outils/calculateurs" className="btn-outline">Calculateurs détaillés</Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================ */
/* SOUS-COMPOSANTS                                               */
/* ============================================================ */

function Kpi({ title, value, sub, accent, progress }: { title: string; value: string; sub?: string; accent?: 'primary' | 'secondary' | 'warning'; progress?: number }) {
  const color = accent === 'primary' ? 'text-primary-700' : accent === 'secondary' ? 'text-secondary-700' : accent === 'warning' ? 'text-amber-700' : 'text-ink';
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-ink-muted">{title}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
      {progress != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-border">
          <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

function Chart({ data }: { data: Array<{ mois: string; ca: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.ca));
  return (
    <div className="mt-4 flex h-48 items-end gap-2">
      {data.map((d) => {
        const h = (d.ca / max) * 100;
        return (
          <div key={d.mois} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div className="w-full rounded-t bg-gradient-to-t from-primary-600 to-secondary-500 transition-all" style={{ height: `${h}%`, minHeight: d.ca > 0 ? '6px' : '2px' }} title={formatEUR(d.ca)} />
            <span className="text-[10px] text-ink-muted">{d.mois}</span>
          </div>
        );
      })}
    </div>
  );
}

function EncaissementsCard({ items, categorieDefaut, onAdd, onDelete }: { items: Encaissement[]; categorieDefaut: CategorieMicro; onAdd: (e: Omit<Encaissement, 'id'>) => void; onDelete: (id: string) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [montant, setMontant] = useState('');
  const [libelle, setLibelle] = useState('');
  const [cat, setCat] = useState<CategorieMicro>(categorieDefaut);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = Number(montant.replace(',', '.'));
    if (!m || m <= 0) return;
    onAdd({ date, montant: m, categorie: cat, libelle: libelle || 'Encaissement', source: 'manuel' });
    setMontant(''); setLibelle('');
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Encaissements</h3>
        <span className="text-xs text-ink-muted">{items.length} entrée(s)</span>
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[120px_1fr_120px_1fr_auto]">
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input" placeholder="Libellé" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        <input type="number" inputMode="decimal" className="input" placeholder="€" value={montant} onChange={(e) => setMontant(e.target.value)} />
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value as CategorieMicro)}>
          {(Object.keys(CATEGORIE_LABEL) as CategorieMicro[]).map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
        </select>
        <button type="submit" className="btn-primary text-xs">+</button>
      </form>
      <ul className="mt-4 max-h-72 space-y-1 overflow-y-auto text-sm">
        {items.slice(0, 30).map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2 border-b border-surface-border/40 py-1.5">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{e.libelle}</p>
              <p className="text-xs text-ink-muted">{new Date(e.date).toLocaleDateString('fr-FR')} · {e.categorie.replace('_', ' ')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-secondary-700">{formatEUR(e.montant)}</span>
              <button onClick={() => onDelete(e.id)} className="text-xs text-rose-600" aria-label="Supprimer">✕</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DepensesCard({ items, onAdd, onDelete }: { items: Depense[]; onAdd: (d: Omit<Depense, 'id'>) => void; onDelete: (id: string) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [montant, setMontant] = useState('');
  const [libelle, setLibelle] = useState('');
  const [type, setType] = useState<Depense['type']>('logiciel');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = Number(montant.replace(',', '.'));
    if (!m || m <= 0) return;
    onAdd({ date, montant: m, libelle: libelle || 'Dépense', type });
    setMontant(''); setLibelle('');
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Dépenses</h3>
        <span className="text-xs text-ink-muted">{items.length} entrée(s)</span>
      </div>
      <p className="mt-1 text-xs text-ink-muted">Suivi à titre indicatif (la micro n'a pas de comptabilité de charges).</p>
      <form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[120px_1fr_120px_1fr_auto]">
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input" placeholder="Libellé" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
        <input type="number" inputMode="decimal" className="input" placeholder="€" value={montant} onChange={(e) => setMontant(e.target.value)} />
        <select className="input" value={type} onChange={(e) => setType(e.target.value as Depense['type'])}>
          <option value="fourniture">Fournitures</option>
          <option value="loyer">Loyer</option>
          <option value="logiciel">Logiciel</option>
          <option value="transport">Transport</option>
          <option value="communication">Communication</option>
          <option value="autre">Autre</option>
        </select>
        <button type="submit" className="btn-primary text-xs">+</button>
      </form>
      <ul className="mt-4 max-h-72 space-y-1 overflow-y-auto text-sm">
        {items.slice(0, 30).map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-2 border-b border-surface-border/40 py-1.5">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{d.libelle}</p>
              <p className="text-xs text-ink-muted">{new Date(d.date).toLocaleDateString('fr-FR')} · {d.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-700">- {formatEUR(d.montant)}</span>
              <button onClick={() => onDelete(d.id)} className="text-xs text-rose-600" aria-label="Supprimer">✕</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function alertCls(n: 'info' | 'warning' | 'critical'): string {
  if (n === 'critical') return 'border-rose-300 bg-rose-50 text-rose-900';
  if (n === 'warning')  return 'border-amber-300 bg-amber-50 text-amber-900';
  return 'border-primary-300 bg-primary-50 text-primary-900';
}
