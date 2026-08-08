import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getAnonProfile, removeAnonDraft, type AnonDraftRef } from '@/lib/anon-profile';

const DISMISS_KEY = 'swivo.anon.banner.dismissed';

export function AnonResumeBanner() {
  const { user, loading } = useAuth();
  const [drafts, setDrafts] = useState<AnonDraftRef[]>([]);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    setDrafts(getAnonProfile()?.drafts ?? []);
  }, [user]);

  if (loading || user || dismissed || drafts.length === 0) return null;
  const top = drafts[0]!;

  return (
    <div className="sticky top-0 z-40 border-b border-primary-200 bg-primary-50/95 backdrop-blur">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
        <p className="text-primary-900">
          ✨ Vous avez <strong>{drafts.length} brouillon{drafts.length > 1 ? 's' : ''}</strong> en cours sur cet appareil
          {top.score != null && ` · ${top.score}% complété`}
          {top.savedAt && ` · sauvegardé ${relative(top.savedAt)}`}
        </p>
        <div className="flex items-center gap-2">
          <Link to={`/creer-mon-entreprise?draft=${top.id}&token=${encodeURIComponent(top.token)}`} className="btn-primary text-xs">Reprendre</Link>
          <Link to="/inscription" className="btn-outline text-xs">Créer mon compte</Link>
          <button
            onClick={() => { removeAnonDraft(top.id); setDrafts(getAnonProfile()?.drafts ?? []); }}
            className="text-xs text-rose-600 hover:underline"
            aria-label="Supprimer le brouillon"
          >Supprimer</button>
          <button
            onClick={() => { try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {} setDismissed(true); }}
            className="text-ink-muted hover:text-ink"
            aria-label="Masquer le rappel"
          >✕</button>
        </div>
      </div>
    </div>
  );
}

function relative(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  if (diff < 60_000) return 'à l’instant';
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}
