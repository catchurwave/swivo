import { useMemo, useState } from 'react';
import { Seo } from '@/lib/seo';
import { TEMPLATES, CATEGORIES, type Template, type TemplateCategory } from '@/data/modeles';
import { useToast } from '@/components/Toast';

export function ModelesPage() {
  const toast = useToast();
  const [selected, setSelected] = useState<Template>(TEMPLATES[0]!);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<TemplateCategory | 'all'>('all');

  const text = useMemo(() => selected.body({ ...defaults(selected), ...vars }), [selected, vars]);

  const filtered = useMemo(() => filter === 'all' ? TEMPLATES : TEMPLATES.filter((t) => t.category === filter), [filter]);

  function download() {
    const html = wrapHtml(selected.title, text);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selected.slug}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.push({ kind: 'success', message: 'Téléchargé (HTML imprimable, Ctrl+P pour PDF).', ttl: 3000 });
  }

  function printNow() {
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) return;
    win.document.open();
    win.document.write(wrapHtml(selected.title, text));
    win.document.close();
    setTimeout(() => win.print(), 350);
  }

  function copyText() {
    navigator.clipboard?.writeText(text).then(() =>
      toast.push({ kind: 'success', message: 'Texte copié dans le presse-papier.', ttl: 2500 }),
    );
  }

  return (
    <>
      <Seo title="Modèles juridiques & administratifs — Swivo" description="Bibliothèque de modèles : lettres, attestations, mentions légales, RGPD, CGV, contrats." path="/outils/modeles" noindex />
      <section className="container-page py-10 lg:py-14">
        <div className="mb-8">
          <span className="badge-secondary">Outil Gestion</span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Modèles juridiques & administratifs</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">Complétez les champs, prévisualisez en temps réel, téléchargez ou imprimez. {TEMPLATES.length} modèles couvrant les démarches micro-entrepreneur courantes.</p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')} className={`badge ${filter === 'all' ? 'bg-primary-600 text-ink-inverse' : 'bg-primary-50 text-primary-700'}`}>Tous ({TEMPLATES.length})</button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`badge ${filter === c ? 'bg-primary-600 text-ink-inverse' : 'bg-primary-50 text-primary-700'}`}>
              {c} ({TEMPLATES.filter((t) => t.category === c).length})
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <nav aria-label="Modèles" className="card p-3 self-start lg:sticky lg:top-20">
            <ul className="space-y-1 max-h-[70vh] overflow-y-auto">
              {filtered.map((t) => (
                <li key={t.slug}>
                  <button onClick={() => { setSelected(t); setVars({}); }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selected.slug === t.slug ? 'bg-primary-50 text-primary-800 font-semibold' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'}`}>
                    <span className="block">{t.title}</span>
                    <span className="block text-xs font-normal text-ink-muted">{t.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="badge bg-primary-50 text-primary-700">{selected.category}</span>
                  <h2 className="mt-2 font-display text-xl font-semibold text-ink">{selected.title}</h2>
                  <p className="mt-1 text-sm text-ink-muted">{selected.description}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {selected.fields.map((f) => (
                  <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="label" htmlFor={`f-${f.key}`}>{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea id={`f-${f.key}`} className="input min-h-[80px]" placeholder={f.placeholder ?? ''} value={vars[f.key] ?? ''} onChange={(e) => setVars((v) => ({ ...v, [f.key]: e.target.value }))} />
                    ) : (
                      <input
                        id={`f-${f.key}`}
                        type={f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'}
                        className="input"
                        placeholder={f.placeholder ?? ''}
                        value={vars[f.key] ?? ''}
                        onChange={(e) => setVars((v) => ({ ...v, [f.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={download} className="btn-primary">↓ Télécharger HTML</button>
                <button onClick={printNow} className="btn-outline">Imprimer / PDF</button>
                <button onClick={copyText} className="btn-ghost text-sm">Copier le texte</button>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-surface-border bg-surface-muted px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">Aperçu</div>
              <pre className="whitespace-pre-wrap p-6 text-sm leading-relaxed text-ink">{text}</pre>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function defaults(t: Template) {
  return Object.fromEntries(t.fields.map((f) => [f.key, f.placeholder ?? `[${f.label}]`]));
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

function wrapHtml(title: string, body: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: 'Inter', system-ui, sans-serif; max-width: 820px; margin: 0 auto; padding: 40px 32px; line-height: 1.6; color: #0f172a; }
  h1 { font-size: 22px; color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 24px; letter-spacing: -0.01em; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
  @media print { body { padding: 18mm; } }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <pre>${escapeHtml(body)}</pre>
  <script>if(location.search.includes('print=1')){setTimeout(()=>window.print(),250);}</script>
</body>
</html>`;
}
