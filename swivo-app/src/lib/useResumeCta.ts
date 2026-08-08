/*
  Hook qui détermine si l'utilisateur a un dossier en cours (anon profile OU
  brouillons serveur quand connecté). Renvoie le wording + l'URL à utiliser
  pour le CTA principal.

    const cta = useResumeCta();
    <Link to={cta.href}>{cta.label}</Link>

  Le label bascule entre :
    - "Démarrer mon dossier"      → aucun brouillon
    - "Reprendre mon dossier"     → 1+ brouillon détecté
*/

import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import { listAnonDrafts } from './anon-profile';
import { listDrafts } from './api';

export type ResumeCta = {
  label: string;
  shortLabel: string;
  href: string;
  hasDraft: boolean;
  count: number;
};

const DEFAULT_HREF = '/creer-mon-entreprise';

export function useResumeCta(opts?: { startLabel?: string; resumeLabel?: string; shortStart?: string; shortResume?: string }): ResumeCta {
  const { user } = useAuth();
  const [serverCount, setServerCount] = useState(0);
  const [topServer, setTopServer] = useState<{ id: number } | null>(null);

  // Anon drafts (sync, localStorage).
  const anonDrafts = typeof window !== 'undefined' ? listAnonDrafts() : [];

  useEffect(() => {
    let cancelled = false;
    if (!user) { setServerCount(0); setTopServer(null); return; }
    listDrafts().then((arr) => {
      if (cancelled) return;
      const list = Array.isArray(arr) ? arr : [];
      setServerCount(list.length);
      setTopServer(list[0] ? { id: (list[0] as any).id } : null);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  const hasAnon = anonDrafts.length > 0;
  const hasServer = serverCount > 0;
  const hasDraft = hasAnon || hasServer;
  const count = anonDrafts.length + serverCount;

  let href = DEFAULT_HREF;
  if (hasServer && topServer) {
    href = `${DEFAULT_HREF}?draft=${topServer.id}`;
  } else if (hasAnon) {
    const top = anonDrafts[0];
    href = top.token
      ? `${DEFAULT_HREF}?draft=${top.id}&token=${encodeURIComponent(top.token)}`
      : `${DEFAULT_HREF}?draft=${top.id}`;
  }

  const start  = opts?.startLabel  ?? 'Démarrer mon dossier';
  const resume = opts?.resumeLabel ?? 'Reprendre mon dossier';
  const shortS = opts?.shortStart  ?? 'Démarrer';
  const shortR = opts?.shortResume ?? 'Reprendre';

  return {
    label:      hasDraft ? resume : start,
    shortLabel: hasDraft ? shortR : shortS,
    href,
    hasDraft,
    count,
  };
}
