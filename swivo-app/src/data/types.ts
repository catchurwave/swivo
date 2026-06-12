export type FormeJuridique = {
  slug: 'micro';
  label: string;
  shortLabel: string;
  tagline: string;
  capitalMin?: string;
  associesMin: number;
  associesMax?: number;
  regimeFiscal: string;
  regimeSocial: string;
  responsabilite: string;
  bonPour: string[];
};

export type FaqItem = { q: string; a: string; cat: 'creation' | 'gestion' | 'tarifs' | 'legal' };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  readMin: number;
  tag: string;
  author: string;
  cover?: string;
};

export type Pricing = {
  creation: { price: string; suffix: string; features: string[]; note: string };
  gestion: { price: string; suffix: string; features: string[]; note: string };
  inpiFees: { k: string; v: string }[];
};
