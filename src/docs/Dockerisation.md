# React + Vite

## Dockerisation du projet

Ce projet est une application React/Vite. La dockerisation a ete preparee en 2 modes:

- Developpement: serveur Vite avec rechargement a chaud (HMR)
- Production: build statique servi par Nginx

### Pourquoi Docker ?

- Avoir le meme environnement sur toutes les machines
- Eviter les problemes de versions Node/npm
- Demarrer rapidement le projet avec des commandes standard
- Produire une image deployable pour serveur

### Fichiers utilises

- `Dockerfile`: multi-stage build (dev, build, prod)
- `docker-compose.yml`: orchestration des services dev/prod
- `.dockerignore`: reduction du contexte de build
- `nginx.conf`: configuration SPA (fallback vers `index.html`)

### Lancer en developpement

Prerequis:

- Docker installe
- Docker Compose installe

Commandes:

```bash
docker compose --profile dev up --build
```

Application disponible sur:

- http://localhost:5173

Arreter:

```bash
docker compose --profile dev down
```

### Lancer en production (local)

Commandes:

```bash
docker compose --profile prod up --build -d
```

Application disponible sur:

- http://localhost:8080

Arreter:

```bash
docker compose --profile prod down
```

### Bonnes pratiques adoptees

- Image Node alpine pour reduire la taille
- `npm ci` pour des installations reproductibles
- Separation dev/prod dans un Dockerfile multi-stage
- Service Nginx pour servir les assets de production
- Fallback SPA (`try_files`) pour gerer React Router
- `node_modules` en volume dedie en dev pour de meilleures perfs