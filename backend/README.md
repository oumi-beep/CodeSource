# Backend du Projet (FastAPI)

Ce répertoire contient le code source du backend de l'application, développé avec FastAPI. Il expose une API RESTful qui gère la logique métier, l'interaction avec la base de données, l'intégration des modèles d'IA et le web scraping.

## Fonctionnalités Clés

- **Gestion des Utilisateurs et Authentification :** Inscription, connexion, gestion des sessions via JWT.
- **Analyse de CV :** Extraction de texte, domaine et mots-clés à partir de CV (PDF/DOCX) via l'API Groq.
- **Moteur de Recommandation de Stages :** Système hybride combinant filtrage basé sur le contenu et filtrage collaboratif.
- **Prédiction de Filière :** Modèle de Machine Learning (CatBoost) pour prédire la filière la plus adaptée à un étudiant.
- **Web Scraping :** Collecte d'offres de stage depuis des plateformes externes (LinkedIn, Indeed, Glassdoor).
- **Gestion des Préférences Utilisateur :** Permet aux utilisateurs de personnaliser leurs critères de recherche et de recommandation.

## Technologies Utilisées

- **Framework Web :** FastAPI
- **Langage :** Python 3.9+
- **Base de Données :** PostgreSQL (via `asyncpg`)
- **Authentification :** JWT (JSON Web Tokens), `bcrypt` pour le hachage des mots de passe
- **Analyse de CV :** Groq API, `pdfplumber`, `python-docx`
- **Machine Learning :** `scikit-learn`, `catboost`
- **Web Scraping :** `undetected_chromedriver`, `Selenium`
- **Autres :** `uvicorn` (serveur ASGI), `pydantic` (validation de données)

## Configuration et Installation

1.  **Cloner le dépôt :**
    ```bash
    git clone <URL_DU_DEPOT>
    cd FuturePath_Backend
    ```

3.  **Installer les dépendances Python :**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configuration de la Base de Données PostgreSQL :**
    *   Assurez-vous d'avoir un serveur PostgreSQL en cours d'exécution.
    *   Créez une base de données pour le projet (e.g., `futurepath_db`).
    *   Mettez à jour les informations de connexion à la base de données dans les variables d'environnement ou un fichier de configuration (voir section Variables d'Environnement).
    *   run the file databasse_schemas.py

5.  **Configuration des Modèles ML :**
    *   Assurez-vous que les fichiers de modèles sérialisés (`modelCatboostbest.pkl`, `label_encoder.pkl`, `X_encoded_columns.pkl`) sont présents dans le répertoire `FuturePath_Backend`.

6.  **Configuration de l'API Groq :**
    *   Obtenez une clé API Groq et configurez-la comme variable d'environnement.  


## Exécution de l'Application

Pour démarrer le serveur FastAPI :

```bash
uvicorn main:app --reload
```

L'API sera accessible à l'adresse `http://localhost:8000` (ou l'adresse IP de votre serveur). La documentation interactive de l'API (Swagger UI) sera disponible à `http://localhost:8000/docs`.

## Points d'API Principaux

- `/users` (POST) : Inscription d'un nouvel utilisateur.
- `/token` (POST) : Connexion et obtention d'un token JWT.
- `/upload_cv` (POST) : Téléchargement et analyse d'un CV.
- `/predict` (POST) : Prédiction de filière.
- `/recommendations` (GET) : Obtention des recommandations de stages.
- `/preferences` (PUT) : Mise à jour des préférences utilisateur.


## Auteur

Oumaima el alami

