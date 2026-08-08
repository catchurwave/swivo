import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Seo } from '@/lib/seo';
import { api, useApi } from '@/lib/api';
import { POSTS_SEED } from '@/data/seeds';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function BlogIndexPage() {
  const { data, loading } = useApi((s) => api.fetchPosts(s));
  const all = data ?? POSTS_SEED;
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((p) => (p.title + p.excerpt + p.tag).toLowerCase().includes(needle));
  }, [q, all]);

  return (
    <>
      <Seo title="Blog — Création et gestion d’entreprise" description="Articles, comparatifs et actualités." path="/blog" />
      <section className="container-page py-14">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge-secondary">Blog</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Actualités & guides</h1>
          <p className="mt-3 text-ink-muted">Ce qu’il faut savoir pour créer et piloter votre entreprise.</p>
        </div>
        <div className="mx-auto mt-8 max-w-xl">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un article (SASU, micro, TVA…)" className="input h-12 text-base" aria-label="Rechercher un article" />
        </div>
        {loading && <p className="mt-8 text-center text-sm text-ink-muted">Chargement…</p>}
        {filtered.length === 0 && !loading && (
          <p className="mt-12 text-center text-sm text-ink-muted">Aucun article ne correspond à « {q} ».</p>
        )}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-elevated">
              {p.cover
                ? <img src={p.cover} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                : <div className="aspect-[16/9] bg-gradient-to-br from-primary-100 via-primary-200 to-secondary-200" />}
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="badge-primary">{p.tag}</span>
                  <span>{fmt(p.date)}</span>
                  <span>·</span>
                  <span>{p.readMin} min</span>
                </div>
                <h2 className="mt-3 font-display text-lg font-semibold text-ink group-hover:text-primary-700">{p.title}</h2>
                <p className="mt-2 text-sm text-ink-muted">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export function BlogPostPage() {
  const { slug } = useParams();
  const { data, loading } = useApi((s) => api.fetchPost(slug!, s), [slug]);
  const post = data ?? POSTS_SEED.find((s) => s.slug === slug);

  if (loading && !post) {
    return <section className="container-page py-20 text-center text-ink-muted">Chargement…</section>;
  }
  if (!post) {
    return (
      <>
        <Seo title="Article introuvable" description="" path={`/blog/${slug ?? ''}`} noindex />
        <section className="container-page py-20 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Article introuvable</h1>
          <Link to="/blog" className="btn-outline mt-6">Retour au blog</Link>
        </section>
      </>
    );
  }

  return (
    <>
      <Seo title={post.title} description={post.excerpt} path={`/blog/${post.slug}`}
        jsonLd={{
          '@context': 'https://schema.org', '@type': 'BlogPosting',
          headline: post.title, datePublished: post.date,
          author: { '@type': 'Organization', name: post.author }, description: post.excerpt,
        }}
      />
      <article className="container-page py-14">
        <div className="mx-auto max-w-2xl">
          <Link to="/blog" className="text-sm text-primary-700 hover:underline">← Tous les articles</Link>
          <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
            <span className="badge-primary">{post.tag}</span>
            <span>{fmt(post.date)}</span>
            <span>·</span>
            <span>{post.readMin} min</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">{post.title}</h1>
          <p className="mt-4 text-lg text-ink-muted">{post.excerpt}</p>
          {post.cover
            ? <img src={post.cover} alt="" className="my-8 aspect-[16/9] w-full rounded-2xl object-cover" />
            : <div className="my-8 aspect-[16/9] rounded-2xl bg-gradient-to-br from-primary-100 via-primary-200 to-secondary-200" />}
          <div className="space-y-4 text-base leading-relaxed text-ink prose-content"
               dangerouslySetInnerHTML={{ __html: post.body }} />
          <p className="mt-6 text-ink-muted">
            Pour appliquer ces règles à votre situation, lancez gratuitement notre <Link to="/creer-mon-entreprise" className="link">diagnostic en ligne</Link>.
          </p>
        </div>
      </article>
    </>
  );
}
