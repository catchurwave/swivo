# Swivo Autofill — Extension Chrome

Pré-remplit **tous** les formulaires du parcours micro-entreprise du Guichet unique INPI (procedure.inpi.fr, formalites.entreprises.gouv.fr) à partir d'un dossier Swivo exporté. Adaptatif, extensible, full personnalisable.

## Installation (mode développeur)

1. `chrome://extensions` → activer **Mode développeur**.
2. **Charger l'extension non empaquetée** → pointer `chrome-extension/swivo-autofill/`.

## Workflow rapide

1. **Admin Swivo** → dossier → **📋 Copier dans le presse-papier**.
2. Icône Swivo dans Chrome → **Coller un dossier JSON**.
3. Aller sur procedure.inpi.fr / formalites.entreprises.gouv.fr.
4. Bouton flottant **S** OU `Alt+S` → panneau → **Remplir**.

## Couverture micro-entreprise (toutes pages)

| Page | Champs |
|---|---|
| Identité | civilité, prénom(s), nom, nom d'usage, sexe |
| Naissance | date, jour/mois/année, lieu, département, pays |
| Domicile | adresse complète (n°/type/nom voie ou ligne libre), complément, CP, commune, code INSEE, pays |
| Contact | email perso + pro, téléphone, mobile |
| Activité | libellé, description, nature (BIC vente/BIC service/BNC libéral/CIPAV/artisanale), code APE/NAF, artisan, sédentaire, ambulant, date début |
| Siège | adresse, complément, CP, commune, INSEE, pays, type de domiciliation, exercice à domicile, correspondance |
| Fiscal | régime micro, versement libératoire, TVA franchise/option |
| Social | SSI/CIPAV, ACRE, insaisissabilité résidence principale (auto/renonciation) |
| Conjoint | collaborateur, civilité, prénom, nom, date naissance |
| Pièce ID | type, numéro, date délivrance/expiration, autorité, NIR |
| Divers | situation matrimoniale, dénomination/sigle/enseigne, capital (0 pour micro) |

Tous les champs sortent en **variantes multiples** côté serveur (date FR + ISO, civilité M./Monsieur/1, oui/non/true/0, code pays FRA/FR/France/250…). Le content script tente chaque variante jusqu'à acceptation.

## Personnalisation max

### 1. Réglages (icône → ⚙ Réglages avancés)

- **Auto-fill** : remplit automatiquement à chaque changement d'URL (SPA Guichet unique).
- **Record mode** : `Alt+clic` sur n'importe quel champ → mappe à une clé Swivo.
- **Logs verbose** : console détaillée pour debug.

### 2. Mappings par domaine

Page Options → table éditable. Pour chaque clé, surchargez :
- `names` (input `name`, `id`, `data-testid`, `formcontrolname`)
- `selectors` (CSS arbitraires, un par ligne)
- `labels` (texte libellé / aria-label / placeholder)
- `type` (text / date / select / radio_or_select / combobox / textarea / email / tel)

Le merge est : user override puis dictionnaire intégré → première correspondance gagne.

### 3. Record mode (le plus rapide)

1. Activez Record mode (popup OU panneau Alt+S).
2. Sur la page INPI : `Alt+clic` sur un champ non rempli.
3. Saisissez la clé Swivo (autocomplétée depuis le dictionnaire).
4. Le sélecteur (`#id` ou `[name=...]`) est ajouté aux overrides du domaine courant.
5. Rechargez la page, relancez l'autofill → champ rempli.

### 4. Surcharge côté serveur (PHP)

Pour ajouter une clé custom à tous les exports :

```php
add_filter( 'swivo_dossier_autofill', function ( $map, $dossier ) {
	$map['monChampPerso'] = array(
		'value' => 'valeur par défaut',
		'variants' => array( 'variante 1', 'variante 2' ),
	);
	return $map;
}, 10, 2 );
```

OU par-dossier, sauvegardez dans `swivo_autofill_extra` meta (array clé→valeur) sur le post `swivo_dossier`.

### 5. Export / import config

Page Options → **⬇ Exporter tout** : sauve `settings + dossier + userOverrides` en JSON, partageable avec l'équipe.

## Architecture matching

Cascade (premier match gagne) :
1. `name` (avec variantes du dictionnaire + overrides)
2. `id`
3. `data-test-id` / `data-testid`
4. `formcontrolname` (Angular)
5. Sélecteurs CSS explicites
6. Fuzzy normalisé (accents/casse strippés) sur `aria-label`, `placeholder`, `<label for>` text, `<fieldset><legend>`

## Type-aware setters

- **text/email/tel/textarea** : `nativeSetter` + dispatch input/change/blur (React/Angular safe).
- **date** : essaie ISO et FR successivement; auto-convert via `transform`.
- **select** : matche `option.value` OU texte (normalisé).
- **radio/checkbox** : sélectionne l'option dont valeur OU `<label>` contient une des variantes.
- **combobox** : type → attend le panneau `[role=listbox]` / `.MuiAutocomplete-popper` / `.mat-mdc-autocomplete-panel` → clic option matchante.

## SPA navigation

`MutationObserver` détecte les changements d'URL et les mutations DOM. Si Auto-fill activé, relance l'autofill avec un délai de 600 ms (laisse React monter les inputs).

## Sécurité

- `chrome.storage.local` seul (aucun serveur tiers).
- Content script restreint aux hosts INPI / formalites.entreprises.gouv.fr.
- Pas de permission `<all_urls>`.
- Dossier effaçable à tout moment.

## Pack distribution

```bash
cd chrome-extension/swivo-autofill
zip -r ../swivo-autofill-0.2.0.zip . -x "*.DS_Store" "README.md"
```

## Étendre le dictionnaire intégré

Si un champ revient régulièrement et concerne tous les utilisateurs, ajoutez-le à `selectors.json` (versionné) plutôt qu'aux overrides locaux :

```json
"monNouveauChamp": {
  "type": "text",
  "names": ["nomReel", "alias"],
  "labels": ["libellé visible"],
  "selectors": ["form#etape4 input[data-foo]"]
}
```

Puis côté PHP `swivo_dossier_flat_autofill()`, émettez la valeur correspondante.
