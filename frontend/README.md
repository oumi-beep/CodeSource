# Frontend du Projet (Next.js)

Ce répertoire contient le code source de l'application frontend, développée avec Next.js. Il fournit l'interface utilisateur interactive pour toutes les fonctionnalités du projet, communiquant avec le backend via des APIs RESTful.

## Fonctionnalités Clés

- **Authentification et Gestion des Utilisateurs :** Inscription, connexion, gestion du profil utilisateur.
- **Interface de Recommandation de Stages :** Affichage et interaction avec les offres de stage personnalisées.
- **Téléchargement et Analyse de CV :** Interface pour uploader un CV et visualiser son analyse.
- **Prédiction de Filière :** Formulaire de saisie de données et affichage des résultats de prédiction.
- **Chatbot de Compétences :** Interface conversationnelle pour interagir avec le chatbot.
- **Gestion des Préférences Utilisateur :** Permet de modifier les critères de recommandation.

## Technologies Utilisées

- **Framework Frontend :** Next.js
- **Bibliothèque UI :** React.js
- **Styling :** Tailwind CSS (inféré)
- **Gestion d'état :** React Context API (pour l'authentification)
- **Icônes :** Lucide React (inféré)

## Configuration et Installation

1.  **Cloner le dépôt :**
    ```bash
    git clone <URL_DU_DEPOT>
    cd NextStep
    ```

2.  **Installer les dépendances Node.js :**
    ```bash
    npm install
    # ou yarn install
    # ou pnpm install
    ```

## Exécution de l'Application

Pour démarrer le serveur de développement Next.js :

```bash
npm run dev
# ou .\node_modules\.bin\next dev
# ou yarn dev
# ou pnpm dev
```

L'application sera accessible à l'adresse `http://localhost:3000` (par défaut).

## Build de l'Application

Pour construire l'application pour la production :

```bash
npm run build
# ou yarn build
# ou pnpm build
```

Le résultat de la construction sera généré dans le répertoire `.next/`.

## Auteur

Oumaima el alami
