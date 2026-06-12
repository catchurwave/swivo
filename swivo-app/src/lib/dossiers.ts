export type DossierSummary = {
  id: number;
  reference: string;
  title: string;
  forme: string;
  status: 'pending' | 'awaiting_payment' | 'paid' | 'deposited' | 'completed' | 'rejected';
  statusLabel: string;
  progress: number;
  createdAt: string;
};

import { apiBase } from './config';

export async function fetchMyDossiers(): Promise<DossierSummary[]> {
  try {
    const res = await fetch(`${apiBase()}/swivo/v1/my-dossiers`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return (await res.json()) as DossierSummary[];
  } catch {
    return [];
  }
}
