# MAM-WebUnityBuild

---

## Installation

### Prérequis 
Un gestionnaire de paquets inclus dans Node.js (npm) est requis.  

### Étapes d'installation

1. **Téléchargement**
   - Clonez ce projet

2. **Configuration**
   - `npm i`

3. **Lancement**
   - **Développement**: `npm run dev`  
   - **Build**: `npm run build`

--- 

## Unity

### Prérequis
Une build d'un projet Unity WEBGL, sans compression de fichier

### Intégration

1. **Ajouter les fichiers**
   - Remplacer les fichiers du dossier `public/UnityBuild/Build` par les fichiers de votre build présent dans `NomDeLaBuild/Build`

2. **Mettre à jour le site**
    - Dans le fichier `src/components/UnityGame.tsx`, remplacer la valeur de la variable `buildName` par le nom de votre build. 

Et voilà, votre nouvelle build est intégrée ! 


--- 

## DSFR (Design System de l’État)

### Installation

Le DSFR est installé automatiquement via les dépendances npm :

```bash
npm install


---

## BigBlueButton (BBB)

Ce projet utilise BigBlueButton (BBB) pour la **visioconférence**.

### Important - Ordre de démarrage

**Le backend doit être lancé AVANT le frontend pour que BBB fonctionne.**

### Lancement

1. **Démarrer le backend** (Go)

   ```bash
   cd backend
   cd bbb-backend
   go run main.go
   ```
   
2. **Démarrer le frontend** (dans un autre terminal)
   ```bash
   npm run dev
   ```

Le backend Go gère la connexion avec le serveur BBB et génère les liens de jointure sécurisés pour les visioconférences.

---