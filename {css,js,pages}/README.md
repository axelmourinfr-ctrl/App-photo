# 🎉 Fête des Familles — Concours Photo

Application web mobile · Cloudinary (photos) + Google Sheets (données)

---

## 📁 Structure des fichiers

```
fete-familles/
│
├── index.html              ← Page principale de l'app
│
├── css/
│   └── style.css           ← Design (ne pas toucher sauf pour les couleurs)
│
├── js/
│   ├── config.js           ← ⚙️  À MODIFIER — nom événement, catégories, mots de passe
│   ├── api.js              ← Connexion Cloudinary & Google Sheets (ne pas toucher)
│   ├── utils.js            ← Fonctions communes (ne pas toucher)
│   ├── upload.js           ← Logique d'envoi photo (ne pas toucher)
│   ├── vote.js             ← Logique de vote (ne pas toucher)
│   ├── results.js          ← Affichage podium (ne pas toucher)
│   ├── admin.js            ← Panel admin (ne pas toucher)
│   └── app.js              ← Navigation (ne pas toucher)
│
├── pages/
│   └── slideshow.html      ← Diaporama pour TV
│
└── Code.gs                 ← Script à coller dans Google Apps Script
```

---

## 🚀 Installation en 4 étapes

---

### ÉTAPE 1 — Créer le Google Sheet et le script

1. Allez sur **[sheets.google.com](https://sheets.google.com)**
2. Créez une **nouvelle feuille** (bouton `+`)
3. Donnez-lui un nom : ex. `Fête des Familles 2025`
4. Dans le menu : **Extensions → Apps Script**
5. Une nouvelle fenêtre s'ouvre (l'éditeur de script)
6. **Effacez tout** le code existant
7. Ouvrez le fichier `Code.gs` de ce projet
8. **Copiez tout** et **collez-le** dans l'éditeur Apps Script
9. Cliquez sur 💾 **Enregistrer** (icône disquette)
10. Cliquez sur **Déployer → Nouveau déploiement**
    - Type : **Application Web**
    - Exécuter en tant que : **Moi**
    - Qui a accès : **Tout le monde**
11. Cliquez **Déployer** → autorisez les permissions demandées
12. **Copiez l'URL** qui apparaît — elle ressemble à :
    `https://script.google.com/macros/s/ABC123.../exec`

---

### ÉTAPE 2 — Créer un compte Cloudinary (stockage photos)

1. Allez sur **[cloudinary.com](https://cloudinary.com)** → **Sign Up Free**
2. Remplissez le formulaire (email + mot de passe)
3. Sur le tableau de bord, notez votre **Cloud name** (en haut à gauche)
4. Allez dans **Settings → Upload**
5. Faites défiler jusqu'à **Upload presets**
6. Cliquez **Add upload preset**
   - Signing mode : **Unsigned** ← important !
   - Folder : `fete-2025` (ou le nom de votre édition)
7. Cliquez **Save**
8. Notez le **nom du preset** créé (ex: `ml_default` ou `fete_familles`)

---

### ÉTAPE 3 — Configurer l'application

Ouvrez `js/config.js` et remplissez ces 3 zones :

```js
// Nom et infos de l'événement
eventName:     "Fête des Familles",
eventSubtitle: "Foyer Les Tilleuls • Juin 2025",
eventEdition:  "fete-2025",         // ← Dossier Cloudinary et onglet Sheets

// Mot de passe admin (changez-le !)
adminPassword: "MonMotDePasse2025",

// Cloudinary
cloudinary: {
  cloudName:    "mon-cloud-name",   // ← Copié à l'étape 2
  uploadPreset: "fete_familles",    // ← Copié à l'étape 2
},

// Google Apps Script
scriptUrl: "https://script.google.com/macros/s/ABC.../exec",  // ← Copié à l'étape 1
```

---

### ÉTAPE 4 — Mettre en ligne (GitHub Pages — gratuit)

1. Créez un compte sur **[github.com](https://github.com)** si pas encore fait
2. Créez un nouveau **repository** public (bouton `+` → New repository)
3. Uploadez tous les fichiers du projet (glisser-déposer)
4. Allez dans **Settings → Pages**
5. Source : **Deploy from a branch** → branche `main` → dossier `/`
6. Cliquez **Save**
7. Après 1-2 minutes, votre app est disponible à :
   `https://VOTRE_NOM.github.io/NOM_DU_REPO/`

---

### Générer le QR code

1. Allez sur **[qr-code-generator.com](https://www.qr-code-generator.com)**
2. Entrez l'URL GitHub Pages de votre app
3. Personnalisez (couleurs rouge `#E8452C` / orange `#F2813A`)
4. Téléchargez en **PNG haute résolution**
5. Imprimez et placez à l'entrée !

---

## 📊 Ce que vous voyez dans Google Sheets

Un onglet est créé automatiquement par édition (ex : `fete-2025`) avec ces colonnes :

| URL | Catégorie | Pseudo | Statut | Votes | VisitorID | Date |
|-----|-----------|--------|--------|-------|-----------|------|
| https://... | famille | La famille Martin | pending | 0 | v_123... | 2025-... |

- **pending** = en attente de modération
- **approved** = visible dans le concours
- **rejected** = refusée

Vous pouvez aussi modifier directement dans Sheets si besoin.

---

## 🔁 Réutiliser l'année suivante

Il suffit de changer dans `config.js` :
```js
eventSubtitle: "Foyer Les Tilleuls • Juin 2026",
eventEdition:  "fete-2026",   // ← Nouvel onglet dans le même Sheets
```
Un nouvel onglet est créé automatiquement.  
L'ancien reste archivé dans le même Google Sheet.

---

## 💰 Coûts

| Service | Plan gratuit | Limite |
|---------|-------------|--------|
| GitHub Pages | ✅ Gratuit | Illimité |
| Google Sheets + Apps Script | ✅ Gratuit | Illimité |
| Cloudinary | ✅ Gratuit | 25 Go stockage, 25 Go bande passante/mois |

Pour une journée avec 100 familles → environ 500 Mo de photos.  
**Tout reste largement dans les limites gratuites.**

---

## 🐛 Problèmes fréquents

**"Erreur d'envoi" au moment d'envoyer une photo**
→ Vérifiez `cloudName` et `uploadPreset` dans `config.js`
→ Le preset doit être en mode **Unsigned**

**Les photos n'apparaissent pas dans le vote**
→ Allez dans Admin et **approuvez** les photos d'abord

**"Action inconnue" dans la console**
→ Vérifiez que `scriptUrl` est bien l'URL de déploiement (et non l'URL d'édition)
→ Redéployez le script après chaque modification du `Code.gs`

**Le diaporama est vide**
→ Approuvez des photos depuis le panel Admin
→ Attendez 60 secondes (le diaporama se recharge toutes les 60s)

---

## 📱 Compatibilité

- ✅ iPhone (Safari iOS 14+)
- ✅ Android (Chrome)
- ✅ Tablette
- ✅ Ordinateur (pour l'admin)
- ✅ TV / écran HDMI (pour le diaporama)
