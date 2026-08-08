import type { Meta, StoryObj } from '@storybook/react';
import { FormalitesWizard } from '@/components/FormalitesWizard';
import { newDossier, buildMandat } from '@/lib/formalites';

const meta: Meta<typeof FormalitesWizard> = {
  title: 'Formalités/FormalitesWizard',
  component: FormalitesWizard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => {
      try {
        localStorage.removeItem('swivo.formalites.dossier.v2');
        localStorage.removeItem('swivo.formalites.draft.ref.v1');
      } catch {}
      return <Story />;
    },
  ],
};
export default meta;
type Story = StoryObj<typeof FormalitesWizard>;

export const Empty: Story = {};

export const ResumeSASUDraft: Story = {
  args: {
    initialDraft: {
      id: 999,
      token: 'demo-token',
      payload: {
        ...newDossier(),
        forme: 'micro',
        denomination: 'Atelier Numérique du Nord',
        objetSocial: 'Conseil et développement de solutions numériques pour PME et startups, formation associée.',
        duree: 99,
        dateClotureExercice: '2026-12-31',
        capital: { montantTotal: 1000, montantLibere: 500 },
        activites: [{ description: 'Conseil en transformation digitale', categorie: 'liberale_non_reglementee', ape: '70.22Z' }],
        etablissementPrincipal: {
          domiciliation: 'chez_dirigeant',
          adresse: { voie: '12 rue de la République', codePostal: '75011', commune: 'Paris', pays: 'FRA' },
          dateDebutActivite: '2026-06-01',
        },
        associes: [{ type: 'personne_physique', personne: { civilite: 'Mme', prenom: 'Camille', nom: 'Lefèvre', nationalite: 'FRA' }, apport: { numeraire: 1000, numeraireLibere: 500 }, partsSociales: 100 }],
        dirigeants: [{ type: 'personne_physique', fonction: 'president', personne: { civilite: 'Mme', prenom: 'Camille', nom: 'Lefèvre', nationalite: 'FRA' } }],
        beneficiairesEffectifs: [],
        options: {},
        mandat: buildMandat(),
        statut: 'brouillon',
        scoreCompletude: 60,
        version: 1,
      },
    },
  },
};
