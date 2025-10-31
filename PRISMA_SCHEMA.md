# 📊 Schéma Prisma - Base de Données

## Vue d'ensemble

Schéma Prisma pour le MVP du TED Scraper avec **2 modèles principaux** :
- `SearchHistory` - Historique des recherches
- `Tender` - Tenders trouvés

---

## 🗄️ Modèles

### 1. SearchHistory

Représente une recherche effectuée par l'utilisateur.

```prisma
model SearchHistory {
  id            String    @id @default(cuid())
  query         String                    // Terme de recherche
  scope         String                    // ACTIVE, AWARD, ALL
  resultsCount  Int       @default(0)     // Nombre de tenders trouvés
  status        String                    // success, error
  exportFormat  String?                   // json, csv (optionnel)
  exportPath    String?                   // Chemin du fichier exporté (optionnel)
  error         String?                   // Message d'erreur si échec (optionnel)
  createdAt     DateTime  @default(now())

  tenders       Tender[]                  // Relation 1-N avec les tenders

  @@index([createdAt])
  @@index([query])
}
```

**Relations :**
- `1 SearchHistory` → `N Tender` (une recherche peut avoir plusieurs tenders)

**Index :**
- Sur `createdAt` (pour trier par date de création)
- Sur `query` (pour rechercher par terme)

---

### 2. Tender

Représente un tender trouvé lors d'une recherche.

```prisma
model Tender {
  id              String    @id @default(cuid())
  title           String                    // Titre du tender
  link            String    @unique         // URL unique vers le tender TED
  reference       String?                   // Numéro de référence du notice
  contractName    String?                   // Nom du contrat
  publicationDate String?                   // Date de publication
  deadline        String?                   // Date limite de soumission
  buyer           String?                   // Organisme acheteur
  description     String?   @db.Text        // Description (texte long)
  budget          String?                   // Budget estimé
  
  searchHistoryId String                    // ID de la recherche parente
  searchHistory   SearchHistory             // Relation N-1 avec SearchHistory
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([searchHistoryId])
  @@index([reference])
  @@index([deadline])
}
```

**Relations :**
- `N Tender` → `1 SearchHistory` (un tender appartient à une recherche)

**Contraintes :**
- `link` est unique (évite les doublons si même tender trouvé plusieurs fois)
- Cascade delete : si une recherche est supprimée, ses tenders sont aussi supprimés

**Index :**
- Sur `searchHistoryId` (requêtes par recherche)
- Sur `reference` (recherche par référence)
- Sur `deadline` (tri par deadline)

---

## 📐 Diagramme de Relations

```
┌─────────────────────────────────┐
│      SearchHistory              │
├─────────────────────────────────┤
│ id (PK)                         │
│ query                           │
│ scope                           │
│ resultsCount                    │
│ status                          │
│ exportFormat?                   │
│ exportPath?                     │
│ error?                          │
│ createdAt                       │
└─────────────────────────────────┘
           │ 1
           │
           │ N
           ▼
┌─────────────────────────────────┐
│         Tender                  │
├─────────────────────────────────┤
│ id (PK)                         │
│ title                           │
│ link (UNIQUE)                   │
│ reference?                      │
│ contractName?                   │
│ publicationDate?                │
│ deadline?                       │
│ buyer?                          │
│ description?                    │
│ budget?                         │
│ searchHistoryId (FK)            │
│ createdAt                       │
│ updatedAt                       │
└─────────────────────────────────┘
```

---

## 🔧 Configuration

### Provider
- **PostgreSQL** (compatible Supabase, Heroku Postgres, etc.)

### Génération
```bash
# Générer le client Prisma
bunx prisma generate

# Créer les migrations
bunx prisma migrate dev --name init

# Appliquer les migrations en production
bunx prisma migrate deploy
```

---

## 🔌 Variables d'environnement

Créer un fichier `.env` :

```env
# Exemple avec Supabase
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Ou avec une base locale
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tendersaas?schema=public"
```

---

## 📋 Requêtes Utiles

### Créer une recherche
```typescript
const search = await prisma.searchHistory.create({
  data: {
    query: "ballistic vests",
    scope: "ACTIVE",
    resultsCount: 5,
    status: "success",
    tenders: {
      create: [
        {
          title: "Tender 1",
          link: "https://ted.europa.eu/...",
          reference: "REF001",
          // ...
        }
      ]
    }
  }
});
```

### Récupérer les 10 dernières recherches
```typescript
const recentSearches = await prisma.searchHistory.findMany({
  take: 10,
  orderBy: { createdAt: 'desc' },
  include: {
    tenders: true
  }
});
```

### Récupérer les tenders d'une recherche
```typescript
const tenders = await prisma.tender.findMany({
  where: {
    searchHistoryId: "search-id"
  },
  orderBy: { deadline: 'asc' }
});
```

### Rechercher des tenders par terme
```typescript
const tenders = await prisma.tender.findMany({
  where: {
    OR: [
      { title: { contains: "ballistic", mode: 'insensitive' } },
      { contractName: { contains: "ballistic", mode: 'insensitive' } },
      { description: { contains: "ballistic", mode: 'insensitive' } }
    ]
  },
  include: {
    searchHistory: true
  }
});
```

---

## 🔄 Migration depuis les fichiers locaux

Pour migrer depuis `tenders.json` et `search_history.ndjson` :

```typescript
// Script de migration
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';

const prisma = new PrismaClient();

async function migrate() {
  // 1. Lire search_history.ndjson
  const historyContent = await readFile('search_history.ndjson', 'utf-8');
  const historyLines = historyContent.trim().split('\n').filter(Boolean);
  
  // 2. Pour chaque recherche, créer SearchHistory + Tenders
  for (const line of historyLines) {
    const record = JSON.parse(line);
    
    // 3. Lire les tenders correspondants depuis tenders.json
    // 4. Créer en base
  }
  
  await prisma.$disconnect();
}
```

---

## ✅ Checklist MVP

- [x] Modèle `SearchHistory` avec tous les champs
- [x] Modèle `Tender` avec tous les champs
- [x] Relation 1-N entre SearchHistory et Tender
- [x] Index pour performances
- [x] Contrainte d'unicité sur `link`
- [ ] Migration initiale créée
- [ ] Client Prisma généré
- [ ] Script de migration depuis fichiers locaux

---

**Le schéma est prêt pour PostgreSQL (Supabase compatible)** 🎯

