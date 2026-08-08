import{j as e}from"./jsx-runtime-BYYWji4R.js";import{L as q}from"./index-C8Ciso8e.js";import{r as G}from"./index-ClcD9ViR.js";import{u as A}from"./auth-DZIDgx-z.js";import{a as I}from"./api-DYntn1ye.js";import{I as i}from"./Icons-DyaHOfnA.js";import{d as R}from"./index-DVNimI6A.js";import"./index-Brl4xq4Y.js";import"./_commonjsHelpers-Cpj98o6Y.js";const C=["Facturation & devis illimités","Calculateurs URSSAF / TVA / IS","Modèles juridiques (PV, AG, lettres)","Mise en pause assistée","Fermeture d’entreprise complète","Support juridique prioritaire"];function o({children:t,feature:c}){var u;const{user:l,loading:S,nonce:w}=A(),k=R(),[m,d]=G.useState(!1);if(S)return null;if(!l)return k("/connexion",{state:{from:location.pathname}}),null;if((u=l.gestion)!=null&&u.active)return e.jsx(e.Fragment,{children:t});const _=async()=>{var p;d(!0);const s=await I(w);d(!1),s.ok&&((p=s.data)!=null&&p.url)&&(window.location.href=s.data.url)};return e.jsx("section",{className:"container-page py-16",children:e.jsx("div",{className:"mx-auto max-w-2xl",children:e.jsxs("div",{className:"card relative overflow-hidden p-10 text-center shadow-elevated",children:[e.jsx("div",{className:"absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent-300/40 blur-3xl"}),e.jsx("div",{className:"absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary-300/40 blur-3xl"}),e.jsxs("div",{className:"relative",children:[e.jsx("span",{className:"inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-ink-inverse shadow-soft",children:e.jsx(i.Lock,{className:"h-7 w-7"})}),e.jsx("h1",{className:"mt-5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl",children:c?`${c} — réservé à la formule Gestion`:"Formule Gestion requise"}),e.jsxs("p",{className:"mt-3 text-ink-muted",children:["Activez la formule ",e.jsx("strong",{children:"Gestion"})," pour débloquer tous les outils de pilotage de votre entreprise.",e.jsx("span",{className:"block mt-1",children:"Sans engagement, résiliable en 1 clic."})]}),e.jsxs("div",{className:"mt-6 inline-flex items-baseline gap-1",children:[e.jsx("span",{className:"font-display text-5xl font-bold text-primary-700",children:"9,90 €"}),e.jsx("span",{className:"text-ink-muted",children:"/ mois"})]}),e.jsx("ul",{className:"mx-auto mt-8 max-w-md space-y-2 text-left text-sm",children:C.map(s=>e.jsxs("li",{className:"flex items-start gap-3",children:[e.jsx(i.Check,{className:"mt-0.5 h-5 w-5 shrink-0 text-secondary-600"}),e.jsx("span",{children:s})]},s))}),e.jsxs("div",{className:"mt-8 flex flex-wrap justify-center gap-3",children:[e.jsxs("button",{onClick:_,disabled:m,className:"btn-primary px-7 py-3 text-base",children:[m?"Redirection…":"Activer la Gestion (9,90 €/mois)"," ",e.jsx(i.Arrow,{className:"h-4 w-4"})]}),e.jsx(q,{to:"/espace-createur",className:"btn-outline",children:"Retour au tableau de bord"})]}),e.jsx("p",{className:"mt-5 text-xs text-ink-muted",children:"Paiement sécurisé Stripe · Données hébergées en France"})]})]})})})}try{o.displayName="RequireGestion",o.__docgenInfo={description:"",displayName:"RequireGestion",props:{feature:{defaultValue:null,description:"",name:"feature",required:!1,type:{name:"string"}}}}}catch{}const P={title:"Auth/RequireGestion",component:o,tags:["autodocs"],args:{feature:"facturation",children:e.jsx("div",{className:"card p-8 text-center",children:"Contenu protégé débloqué ✅"})}},r={},a={decorators:[t=>{try{localStorage.setItem("swivo.user.v1",JSON.stringify({id:1,name:"Camille Test",email:"c@test.fr",gestion:{active:!1}}))}catch{}return e.jsx(t,{})}]},n={decorators:[t=>{try{localStorage.setItem("swivo.user.v1",JSON.stringify({id:1,name:"Camille Test",email:"c@test.fr",gestion:{active:!0,until:"2099-12-31"}}))}catch{}return e.jsx(t,{})}]};var x,f,h;r.parameters={...r.parameters,docs:{...(x=r.parameters)==null?void 0:x.docs,source:{originalSource:"{}",...(h=(f=r.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};var g,N,j;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  decorators: [Story => {
    try {
      localStorage.setItem('swivo.user.v1', JSON.stringify({
        id: 1,
        name: 'Camille Test',
        email: 'c@test.fr',
        gestion: {
          active: false
        }
      }));
    } catch {}
    return <Story />;
  }]
}`,...(j=(N=a.parameters)==null?void 0:N.docs)==null?void 0:j.source}}};var v,y,b;n.parameters={...n.parameters,docs:{...(v=n.parameters)==null?void 0:v.docs,source:{originalSource:`{
  decorators: [Story => {
    try {
      localStorage.setItem('swivo.user.v1', JSON.stringify({
        id: 1,
        name: 'Camille Test',
        email: 'c@test.fr',
        gestion: {
          active: true,
          until: '2099-12-31'
        }
      }));
    } catch {}
    return <Story />;
  }]
}`,...(b=(y=n.parameters)==null?void 0:y.docs)==null?void 0:b.source}}};const z=["LockedNoUser","LockedNoSubscription","Unlocked"];export{a as LockedNoSubscription,r as LockedNoUser,n as Unlocked,z as __namedExportsOrder,P as default};
