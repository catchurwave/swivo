import{j as e}from"./jsx-runtime-BYYWji4R.js";import{useMDXComponents as r}from"./index-DUy19JZU.js";import{a as i}from"./index-DXSd1L4N.js";import"./index-ClcD9ViR.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./iframe-CuTUquLu.js";import"./index-Brl4xq4Y.js";import"./index-ClL5Gxbg.js";import"./index-DrFu-skq.js";function o(s){const n={code:"code",h1:"h1",h2:"h2",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...r(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(i,{title:"Docs/Introduction"}),`
`,e.jsx(n.h1,{id:"swivo-storybook",children:"Swivo Storybook"}),`
`,e.jsx(n.p,{children:"Catalogue interactif des composants React du SPA Swivo."}),`
`,e.jsx(n.h2,{id:"conventions",children:"Conventions"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Tailwind + design tokens dans ",e.jsx(n.code,{children:"src/styles/theme.css"}),"."]}),`
`,e.jsxs(n.li,{children:["Toggle thème ",e.jsx(n.strong,{children:"Light / Dark"})," dans la barre d'outils → ",e.jsx(n.code,{children:'data-theme="dark"'})," sur ",e.jsx(n.code,{children:"<html>"}),"."]}),`
`,e.jsxs(n.li,{children:["Viewports : ",e.jsx(n.code,{children:"mobile"})," (390×844), ",e.jsx(n.code,{children:"tablet"})," (820×1180), ",e.jsx(n.code,{children:"desktop"})," (1440×900)."]}),`
`,e.jsxs(n.li,{children:["Routes simulées via ",e.jsx(n.code,{children:"MemoryRouter"}),". Override par story via ",e.jsx(n.code,{children:"parameters.route"}),"."]}),`
`]}),`
`,e.jsx(n.h2,{id:"workflow-dev",children:"Workflow dev"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bash",children:`npm run storybook          # SB seul sur :6006
npm run dev:all            # Vite (:5173) + SB (:6006) en parallèle
npm run build-storybook    # bundle statique pour Chromatic / GitHub Pages
`})}),`
`,e.jsx(n.h2,{id:"ajouter-un-composant",children:"Ajouter un composant"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["Créer ",e.jsx(n.code,{children:"src/components/Foo.tsx"}),"."]}),`
`,e.jsxs(n.li,{children:["Créer ",e.jsx(n.code,{children:"src/stories/Foo.stories.tsx"})," à côté."]}),`
`,e.jsxs(n.li,{children:["Une story par variante visuelle. Tests d'interactions via ",e.jsx(n.code,{children:"@storybook/test"}),"."]}),`
`,e.jsxs(n.li,{children:["Accessibilité auto via ",e.jsx(n.code,{children:"addon-a11y"})," — corriger avant merge."]}),`
`]})]})}function m(s={}){const{wrapper:n}={...r(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(o,{...s})}):o(s)}export{m as default};
