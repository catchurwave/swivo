import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { fetchDocuments, uploadDocument, deleteDocument, type UploadedDoc } from '@/lib/pilotage-api';
import { documentsApplicables, type DocumentSlot } from '@/lib/micro-algo';
import type { Dossier } from '@/lib/formalites';

export function DocumentsManager({ dossier, draftId }: { dossier: Dossier; draftId?: number }) {
  const { nonce } = useAuth();
  const toast = useToast();
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [busySlot, setBusySlot] = useState<string | null>(null);

  const slots = documentsApplicables(dossier);

  useEffect(() => {
    fetchDocuments().then((d) => { if (d) setDocs(d); });
  }, []);

  async function handleUpload(slot: DocumentSlot, file: File) {
    setBusySlot(slot.key);
    const res = await uploadDocument(file, slot.key, draftId, nonce);
    setBusySlot(null);
    if (res.ok) {
      const doc = res.doc;
      setDocs((arr) => [doc, ...arr.filter((x) => x.slot !== slot.key || x.id !== doc.id)]);
      toast.push({ kind: 'success', message: `${slot.titre} téléversé`, ttl: 2500 });
    } else {
      toast.push({ kind: 'error', title: 'Échec de l\'upload', message: res.error, ttl: 6000 });
    }
  }

  async function remove(d: UploadedDoc) {
    if (!confirm('Supprimer ce fichier ?')) return;
    await deleteDocument(d.id, nonce);
    setDocs((arr) => arr.filter((x) => x.id !== d.id));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        Téléversez maintenant ou plus tard depuis votre espace. Les pièces obligatoires doivent être fournies avant la transmission INPI.
        Formats acceptés : PDF, JPG, PNG, HEIC. Max 10 Mo par fichier.
      </p>
      <ul className="space-y-2">
        {slots.map((s) => {
          const uploaded = docs.find((d) => d.slot === s.key);
          return (
            <SlotRow
              key={s.key}
              slot={s}
              uploaded={uploaded}
              busy={busySlot === s.key}
              onUpload={(f) => handleUpload(s, f)}
              onRemove={(d) => remove(d)}
            />
          );
        })}
      </ul>

      {/* Autres docs hors slots prédéfinis */}
      {docs.filter((d) => !slots.find((s) => s.key === d.slot)).length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Autres documents</p>
          <ul className="mt-2 space-y-1">
            {docs.filter((d) => !slots.find((s) => s.key === d.slot)).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm">
                <div className="min-w-0">
                  <a href={d.fileUrl ?? '#'} target="_blank" rel="noopener" className="truncate font-medium text-primary-700 hover:underline">{d.fileName}</a>
                  <p className="text-xs text-ink-muted">{(d.size / 1024).toFixed(0)} Ko · {d.slot}</p>
                </div>
                <button onClick={() => remove(d)} className="text-rose-600 hover:text-rose-800" aria-label="Supprimer">×</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SlotRow({ slot, uploaded, busy, onUpload, onRemove }: { slot: DocumentSlot; uploaded?: UploadedDoc; busy: boolean; onUpload: (f: File) => void; onRemove: (d: UploadedDoc) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onUpload(f);
  }

  return (
    <li
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={`rounded-xl border p-4 transition ${drag ? 'border-primary-500 bg-primary-50' : uploaded ? 'border-secondary-300 bg-secondary-50/40' : slot.obligatoire ? 'border-rose-200 bg-rose-50/30' : 'border-surface-border bg-surface'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-ink">{slot.titre}</strong>
            {slot.obligatoire ? <span className="badge bg-rose-100 text-rose-700">Obligatoire</span> : <span className="badge bg-ink-muted/10 text-ink-muted">Facultatif</span>}
            {uploaded && <span className="badge bg-secondary-100 text-secondary-800">✓ Téléversé</span>}
          </div>
          <p className="mt-1 text-xs text-ink-muted">{slot.description}</p>

          {uploaded && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <a href={uploaded.fileUrl ?? '#'} target="_blank" rel="noopener" className="truncate text-primary-700 hover:underline">{uploaded.fileName}</a>
              <span className="text-ink-muted">{(uploaded.size / 1024).toFixed(0)} Ko</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={slot.formatAccepte}
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
          />
          {uploaded ? (
            <>
              <button onClick={() => inputRef.current?.click()} className="btn-ghost text-xs" disabled={busy}>{busy ? '…' : 'Remplacer'}</button>
              <button onClick={() => onRemove(uploaded)} className="text-xs text-rose-600 hover:underline">Supprimer</button>
            </>
          ) : (
            <button onClick={() => inputRef.current?.click()} className="btn-outline text-xs" disabled={busy}>{busy ? '…' : '+ Téléverser'}</button>
          )}
        </div>
      </div>
    </li>
  );
}
