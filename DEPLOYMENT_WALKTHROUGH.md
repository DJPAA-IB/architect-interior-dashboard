# 🚀 Guide de Déploiement Complet — Architect Interior Dashboard

Ce document décrit pas à pas comment installer, faire tourner en continu et sécuriser le tableau de bord sur votre serveur.

---

## 📌 Sommaire
1. [Prérequis](#1-prérequis)
2. [Option A : Déploiement Réseau Local / Wi-Fi Atelier (Sans Domaine)](#2-option-a--déploiement-réseau-local--wi-fi-atelier)
3. [Option B : Déploiement Public sur Internet avec HTTPS & Nom de Domaine](#3-option-b--déploiement-public-sur-internet-avec-https--nom-de-domaine)
4. [Gestion du Serveur & Mises à Jour](#4-gestion-du-serveur--mises-à-jour)
5. [Sauvegarde des Données](#5-sauvegarde-des-données)

---

## 1. Prérequis

Sur votre serveur (Ubuntu / Debian / Raspberry Pi / VPS) :
- **Node.js** (version 18 ou supérieure) : `node -v`
- **NPM** : `npm -v`
- **Git** (optionnel pour cloner)

Pour installer Node.js si besoin :
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 2. Option A : Déploiement Réseau Local / Wi-Fi Atelier

*Cas d'usage : Vous souhaitez que toute l'équipe accède au tableau de bord depuis les PC et téléphones connectés au Wi-Fi de l'atelier.*

### Étape 1 : Aller dans le dossier du projet
```bash
cd /chemin/vers/architect-interior-dashboard
```

### Étape 2 : Installer les dépendances & Compiler
```bash
npm install
npm run build
```

### Étape 3 : Lancer le serveur en tâche de fond 24/7 avec PM2
```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Démarrer le serveur de production sécurisé
pm2 start server.js --name "architect-dashboard"

# Configurer le démarrage automatique au boot du serveur
pm2 startup
pm2 save
```

### 📱 Accès :
- **Sur le PC hôte :** `http://localhost:3001`
- **Sur les téléphones / autres PC de l'atelier :** `http://IP_DE_VOTRE_SERVEUR:3001` *(ex: `http://192.168.1.101:3001`)*

---

## 3. Option B : Déploiement Public sur Internet avec HTTPS & Nom de Domaine

*Cas d'usage : Accès depuis n'importe où dans le monde (chantiers, déplacements, clients) via un nom de domaine sécurisé (ex: `studio.example.com`).*

### Étape 1 : Lancer l'application avec PM2
Suivez les étapes de l'Option A (le serveur tourne en local sur le port 3001).

### Étape 2 : Installer Nginx et Certbot
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Étape 3 : Configurer Nginx en Reverse Proxy
Créez un fichier de configuration pour votre site :
```bash
sudo nano /etc/nginx/sites-available/architect-dashboard
```

Collez la configuration suivante (en remplaçant `studio.example.com` par votre domaine) :
```nginx
server {
    listen 80;
    server_name studio.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez le site et rechargez Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/architect-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Étape 4 : Activer le Certificat SSL Gratuit (HTTPS)
Exécutez simplement Certbot :
```bash
sudo certbot --nginx -d studio.example.com
```
> Répondez aux questions (email pour le renouvellement). Certbot configure automatiquement le cadenas HTTPS et le renouvellement automatique.

---

## 4. Gestion du Serveur & Mises à Jour

Commandes utiles pour superviser le serveur :

```bash
# Voir l'état du serveur
pm2 status

# Voir les logs en direct
pm2 logs architect-dashboard

# Redémarrer après une modification
npm run build
pm2 restart architect-dashboard

# Arrêter le serveur
pm2 stop architect-dashboard
```

---

## 5. Sauvegarde des Données

Toutes les données du Studio (projets, rapports journaliers, factures, présences) sont stockées dans :
```text
architect-interior-dashboard/data/database.json
```

Pour faire une sauvegarde manuelle ou automatisée :
```bash
cp /chemin/vers/architect-interior-dashboard/data/database.json /chemin/backup/database_$(date +%F).json
```
*(Vous pouvez également utiliser le bouton d'export JSON directement depuis les Paramètres du tableau de bord).*
