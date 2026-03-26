# LPD Gestions - Guide Docker

## Objectif

Ce projet React/Vite est dockerise pour que tu puisses:

- lancer le projet sans installer Node localement
- avoir le meme environnement sur toutes les machines
- separer clairement le mode developpement et le mode production

## Concepts a comprendre

- Image Docker: le "template" de ton application
- Container: une instance qui tourne a partir d'une image
- Dockerfile: la recette pour construire l'image
- Docker Compose: l'outil pour lancer facilement un ou plusieurs containers

## Fichiers Docker du projet

- [Dockerfile](Dockerfile): multi-stage (dev, build, prod)
- [docker-compose.yml](docker-compose.yml): 2 services (`frontend-dev` et `frontend-prod`)
- [.dockerignore](.dockerignore): reduit la taille du contexte de build
- [nginx.conf](nginx.conf): sert l'app build en production (SPA fallback)

## Pourquoi ta commande a echoue

Tu as execute `docker compose --profile dev up --build`, mais sur ta machine:

- `docker compose` n'est pas disponible (plugin compose v2 absent)
- `docker-compose` n'est pas installe non plus

## Installer Docker Compose

### Option recommandee (Compose v2)

```bash
sudo apt update
sudo apt install -y docker-compose-plugin
docker compose version
```

### Option alternative (Compose v1)

```bash
sudo apt update
sudo apt install -y docker-compose
docker-compose --version
```

## Lancer le projet (sans profiles)

Les profiles ont ete retires pour compatibilite maximale.

### En developpement (Vite + hot reload)

Avec Compose v2:

```bash
docker compose up --build frontend-dev
```

Avec Compose v1:

```bash
docker-compose up --build frontend-dev
```

Application: http://localhost:5173

### En production locale (Nginx)

Avec Compose v2:

```bash
docker compose up --build -d frontend-prod
```

Avec Compose v1:

```bash
docker-compose up --build -d frontend-prod
```

Application: http://localhost:8080

### Arreter

Compose v2:

```bash
docker compose down
```

Compose v1:

```bash
docker-compose down
```

## Si tu veux tester sans Compose

### Dev

```bash
docker build --target dev -t lpd-frontend-dev .
docker run --rm -it -p 5173:5173 -v "$(pwd)":/app -v /app/node_modules lpd-frontend-dev
```

### Prod

```bash
docker build --target prod -t lpd-frontend-prod .
docker run --rm -d -p 8080:80 --name lpd-frontend-prod lpd-frontend-prod
```

## Bonnes pratiques deja appliquees

- image Node alpine pour reduire la taille
- `npm ci` pour des builds reproductibles
- multi-stage build pour separer dev et prod
- Nginx pour servir les fichiers statiques en prod
- fallback SPA (`try_files`) pour React Router

## Depannage rapide

### Erreur: Permission denied sur /var/run/docker.sock

Symptome classique:

- `PermissionError: [Errno 13] Permission denied`
- `docker.errors.DockerException: Error while fetching server API version`

Cause:

- l'utilisateur courant n'est pas membre du groupe `docker`

Correction (definitive):

```bash
sudo usermod -aG docker $USER
newgrp docker
docker ps
```

Si `newgrp docker` ne suffit pas, ferme la session puis reconnecte-toi, puis reteste:

```bash
docker ps
docker-compose up --build frontend-dev
```

Contournement temporaire (si urgent):

```bash
sudo docker-compose up --build frontend-dev
```
