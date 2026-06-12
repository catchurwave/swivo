import { useMemo, useState } from 'react';
import { Seo } from '@/lib/seo';
import { api, useApi } from '@/lib/api';
import type { FaqItem } from '@/data/types';

const CATS: { key: FaqItem['cat'] | 'all'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'creation', label: 'Création' },
  { key: 'gestion', label: 'Gestion' },
  { key: 'tarifs', label: 'Tarifs' },
  { key: 'legal', label: 'Légal' },
];

export function FaqPage() {
  const { data: faq } = useApi((s) => api.fetchFaq(s));
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<FaqItem['cat'] | 'all'>('all');

  const filtered = useMemo(() => {
    const list = faq ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter((f) => (cat === 'all' || f.cat === cat) && (!needle || (f.q + f.a).toLowerCase().includes(needle)));
  }, [q, cat, faq]);

  return (
    <>
      <Seo title="FAQ — Création et gestion d’entreprise" description="Toutes les réponses sur la création d’entreprise en France." path="/faq"
        jsonLd={{
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: (faq ?? []).map((f) => ({
            '@type': 'Question', name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />
      <section className="container-page py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Questions fréquentes</h1>
          <p className="mt-3 text-ink-muted">Trouvez la réponse, ou demandez à notre chatbot.</p>
        </div>
        <div className="mx-auto mt-8 max-w-2xl">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="input h-12 text-base" aria-label="Rechercher" />
          <div className="mt-4 flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button key={c.key} onClick={() => setCat(c.key)}
                className={`badge px-3 py-1 ${cat === c.key ? 'bg-primary-600 text-ink-inverse' : 'bg-surface text-ink-muted hover:bg-surface-muted border border-surface-border'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {filtered.length === 0 && <p className="text-center text-sm text-ink-muted">Aucun résultat.</p>}
          {filtered.map((f) => (
            <details key={f.q} className="card group p-5 open:shadow-elevated">
              <summary className="flex cursor-pointer items-start justify-between gap-4 font-display font-semibold text-ink">
                {f.q}
                <span className="ml-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-ink-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
