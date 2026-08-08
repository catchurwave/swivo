import{j as e}from"./jsx-runtime-BYYWji4R.js";import"./index-ClcD9ViR.js";import"./_commonjsHelpers-Cpj98o6Y.js";const O={title:"Docs/Design Tokens",tags:["autodocs"]},c=(C,H,T)=>e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"font-display text-sm font-semibold text-ink",children:C}),e.jsx("div",{className:"flex flex-wrap gap-2",children:T.map(d=>e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx("div",{className:`h-14 w-14 rounded-lg shadow-soft bg-${H}-${d}`}),e.jsx("span",{className:"mt-1 font-mono text-[10px] text-ink-muted",children:d})]},d))})]}),s={render:()=>e.jsxs("div",{className:"space-y-6",children:[c("Primary","primary",[50,100,200,300,400,500,600,700,800,900]),c("Secondary","secondary",[50,100,200,300,400,500,600,700,800,900]),c("Accent","accent",[300,400,500,600]),e.jsxs("div",{className:"grid gap-3 sm:grid-cols-3",children:[e.jsxs("div",{className:"card p-4",children:[e.jsx("div",{className:"h-10 rounded bg-surface border border-surface-border"}),e.jsx("p",{className:"mt-2 text-xs",children:"surface"})]}),e.jsxs("div",{className:"card p-4",children:[e.jsx("div",{className:"h-10 rounded bg-surface-muted"}),e.jsx("p",{className:"mt-2 text-xs",children:"surface-muted"})]}),e.jsxs("div",{className:"card p-4",children:[e.jsx("div",{className:"h-10 rounded bg-ink"}),e.jsx("p",{className:"mt-2 text-xs",children:"ink"})]})]})]})},a={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsx("h1",{className:"font-display text-6xl font-bold text-ink",children:"Display 6xl"}),e.jsx("h1",{className:"font-display text-5xl font-bold text-ink",children:"Display 5xl"}),e.jsx("h2",{className:"font-display text-4xl font-bold text-ink",children:"Heading 4xl"}),e.jsx("h3",{className:"font-display text-3xl font-bold text-ink",children:"Heading 3xl"}),e.jsx("h4",{className:"font-display text-2xl font-semibold text-ink",children:"Heading 2xl"}),e.jsx("p",{className:"text-lg text-ink",children:"Lead 1.125rem — Lorem ipsum dolor sit amet."}),e.jsx("p",{className:"text-base text-ink",children:"Body 1rem — The quick brown fox jumps over the lazy dog."}),e.jsx("p",{className:"text-sm text-ink-muted",children:"Small muted 0.875rem — secondary content."}),e.jsx("p",{className:"text-xs uppercase tracking-wider text-ink-muted",children:"Label · uppercase 0.75rem"})]})},r={render:()=>e.jsxs("div",{className:"flex flex-wrap gap-3",children:[e.jsx("button",{className:"btn-primary",children:"Primary"}),e.jsx("button",{className:"btn-secondary",children:"Secondary"}),e.jsx("button",{className:"btn-outline",children:"Outline"}),e.jsx("button",{className:"btn-ghost",children:"Ghost"}),e.jsx("button",{className:"btn-primary",disabled:!0,children:"Disabled"})]})},t={render:()=>e.jsxs("div",{className:"flex flex-wrap gap-3",children:[e.jsx("span",{className:"badge-primary",children:"Primary"}),e.jsx("span",{className:"badge-secondary",children:"Secondary"}),e.jsx("span",{className:"badge bg-amber-100 text-amber-800",children:"Warning"}),e.jsx("span",{className:"badge bg-rose-100 text-rose-800",children:"Danger"}),e.jsx("span",{className:"badge bg-ink-muted/10 text-ink-muted",children:"Neutral"})]})},l={render:()=>e.jsxs("div",{className:"grid gap-4 sm:grid-cols-3",children:[e.jsxs("div",{className:"card p-5",children:[e.jsx("p",{className:"font-semibold",children:"Card simple"}),e.jsx("p",{className:"text-sm text-ink-muted",children:"Texte par défaut"})]}),e.jsxs("div",{className:"card p-5 shadow-elevated",children:[e.jsx("p",{className:"font-semibold",children:"Card elevated"}),e.jsx("p",{className:"text-sm text-ink-muted",children:"Ombre prononcée"})]}),e.jsxs("div",{className:"card border-primary-300 bg-primary-50 p-5",children:[e.jsx("p",{className:"font-semibold text-primary-800",children:"Highlight"}),e.jsx("p",{className:"text-sm text-primary-700",children:"Accent primary"})]})]})},n={render:()=>e.jsxs("div",{className:"max-w-md space-y-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"Email"}),e.jsx("input",{className:"input",placeholder:"vous@email.fr"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"Numéro"}),e.jsx("input",{className:"input",type:"number",placeholder:"0"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"label",children:"Message"}),e.jsx("textarea",{className:"input min-h-[100px]",placeholder:"Décrivez votre projet…"})]})]})};var i,m,o;s.parameters={...s.parameters,docs:{...(i=s.parameters)==null?void 0:i.docs,source:{originalSource:`{
  render: () => <div className="space-y-6">
      {colorScale('Primary', 'primary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900])}
      {colorScale('Secondary', 'secondary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900])}
      {colorScale('Accent', 'accent', [300, 400, 500, 600])}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><div className="h-10 rounded bg-surface border border-surface-border" /><p className="mt-2 text-xs">surface</p></div>
        <div className="card p-4"><div className="h-10 rounded bg-surface-muted" /><p className="mt-2 text-xs">surface-muted</p></div>
        <div className="card p-4"><div className="h-10 rounded bg-ink" /><p className="mt-2 text-xs">ink</p></div>
      </div>
    </div>
}`,...(o=(m=s.parameters)==null?void 0:m.docs)==null?void 0:o.source}}};var p,x,u;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <h1 className="font-display text-6xl font-bold text-ink">Display 6xl</h1>
      <h1 className="font-display text-5xl font-bold text-ink">Display 5xl</h1>
      <h2 className="font-display text-4xl font-bold text-ink">Heading 4xl</h2>
      <h3 className="font-display text-3xl font-bold text-ink">Heading 3xl</h3>
      <h4 className="font-display text-2xl font-semibold text-ink">Heading 2xl</h4>
      <p className="text-lg text-ink">Lead 1.125rem — Lorem ipsum dolor sit amet.</p>
      <p className="text-base text-ink">Body 1rem — The quick brown fox jumps over the lazy dog.</p>
      <p className="text-sm text-ink-muted">Small muted 0.875rem — secondary content.</p>
      <p className="text-xs uppercase tracking-wider text-ink-muted">Label · uppercase 0.75rem</p>
    </div>
}`,...(u=(x=a.parameters)==null?void 0:x.docs)==null?void 0:u.source}}};var N,b,h;r.parameters={...r.parameters,docs:{...(N=r.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-3">
      <button className="btn-primary">Primary</button>
      <button className="btn-secondary">Secondary</button>
      <button className="btn-outline">Outline</button>
      <button className="btn-ghost">Ghost</button>
      <button className="btn-primary" disabled>Disabled</button>
    </div>
}`,...(h=(b=r.parameters)==null?void 0:b.docs)==null?void 0:h.source}}};var g,v,y;t.parameters={...t.parameters,docs:{...(g=t.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-3">
      <span className="badge-primary">Primary</span>
      <span className="badge-secondary">Secondary</span>
      <span className="badge bg-amber-100 text-amber-800">Warning</span>
      <span className="badge bg-rose-100 text-rose-800">Danger</span>
      <span className="badge bg-ink-muted/10 text-ink-muted">Neutral</span>
    </div>
}`,...(y=(v=t.parameters)==null?void 0:v.docs)==null?void 0:y.source}}};var j,f,k;l.parameters={...l.parameters,docs:{...(j=l.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <div className="grid gap-4 sm:grid-cols-3">
      <div className="card p-5"><p className="font-semibold">Card simple</p><p className="text-sm text-ink-muted">Texte par défaut</p></div>
      <div className="card p-5 shadow-elevated"><p className="font-semibold">Card elevated</p><p className="text-sm text-ink-muted">Ombre prononcée</p></div>
      <div className="card border-primary-300 bg-primary-50 p-5"><p className="font-semibold text-primary-800">Highlight</p><p className="text-sm text-primary-700">Accent primary</p></div>
    </div>
}`,...(k=(f=l.parameters)==null?void 0:f.docs)==null?void 0:k.source}}};var S,w,D;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div className="max-w-md space-y-3">
      <div>
        <label className="label">Email</label>
        <input className="input" placeholder="vous@email.fr" />
      </div>
      <div>
        <label className="label">Numéro</label>
        <input className="input" type="number" placeholder="0" />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea className="input min-h-[100px]" placeholder="Décrivez votre projet…" />
      </div>
    </div>
}`,...(D=(w=n.parameters)==null?void 0:w.docs)==null?void 0:D.source}}};const z=["Colors","Typography","Buttons","Badges","Cards","Inputs"];export{t as Badges,r as Buttons,l as Cards,s as Colors,n as Inputs,a as Typography,z as __namedExportsOrder,O as default};
