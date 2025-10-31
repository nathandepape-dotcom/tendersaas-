# 🎯 Schéma MVP - Minimum Viable Product

## Objectif
Interface minimale avec **une barre de recherche fonctionnelle** et **un historique des recherches**.

---

## 📐 Architecture Simplifiée

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Page Unique (1 seule page)                │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  🔍 BARRE DE RECHERCHE                    │     │    │
│  │  │  [Input: query] [Select: scope] [Search] │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  📊 RÉSULTATS (tableau)                   │     │    │
│  │  │  Title | Reference | Deadline | Link     │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  📝 HISTORIQUE                           │     │    │
│  │  │  - "query 1" (scope) - 10 résultats      │     │    │
│  │  │  - "query 2" (scope) - 5 résultats       │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│                      API SERVER (Bun)                        │
│                                                              │
│  GET /search?query=XXX&scope=ACTIVE                         │
│    → Appelle scraper                                        │
│    → Retourne JSON des tenders                             │
│                                                              │
│  GET /history                                               │
│    → Lit search_history.ndjson                             │
│    → Retourne dernières 10 recherches                      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Scraper)                         │
│                                                              │
│  TEDScraper.search(query, scope)                            │
│    → Scrape TED website (Playwright)                        │
│    → Parse HTML (Cheerio)                                   │
│    → Retourne TenderData[]                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE (Local Files)                     │
│                                                              │
│  tenders.json           → Derniers résultats                │
│  search_history.ndjson  → Historique des recherches        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Composants MVP

### 1. Frontend (1 seule page)
**Fichier:** `web/src/pages/MVP.tsx` (nouveau)

**Composants:**
- ✅ **Barre de recherche** : Input + Select scope + Bouton
- ✅ **Affichage résultats** : Tableau simple (Title, Reference, Deadline, Link)
- ✅ **Historique** : Liste des 10 dernières recherches

**Pas besoin de:**
- ❌ Navigation entre pages
- ❌ Filtres avancés
- ❌ Pagination
- ❌ Export CSV dans l'UI

### 2. API (2 endpoints minimaux)
**Fichier:** `src/api.ts`

**Endpoints:**
- ✅ `GET /search?query=XXX&scope=ACTIVE` → Retourne `{ tenders: TenderData[] }`
- ✅ `GET /history` → Retourne `SearchHistoryRecord[]` (10 derniers)

**Pas besoin de:**
- ❌ `/health`
- ❌ Gestion d'erreurs complexe
- ❌ Authentification

### 3. Storage (fichiers locaux)
- ✅ `tenders.json` → Résultats de la dernière recherche
- ✅ `search_history.ndjson` → Historique (append-only)

---

## 📋 Flow Utilisateur MVP

```
1. Utilisateur ouvre la page
   ↓
2. Voit la barre de recherche + historique vide/sauvé
   ↓
3. Tape une requête, sélectionne scope, clique "Search"
   ↓
4. Loading state → Appel API /search
   ↓
5. API → Scraper → Scrape TED website
   ↓
6. API → Sauvegarde dans tenders.json + log dans search_history.ndjson
   ↓
7. Frontend → Affiche résultats dans tableau + met à jour historique
   ↓
8. Utilisateur peut cliquer sur les liens pour voir les détails sur TED
```

---

## 🎨 Interface MVP (Schéma Visuel)

```
╔═══════════════════════════════════════════════════════════╗
║                  TED Scraper MVP                           ║
╠═══════════════════════════════════════════════════════════╣
║                                                             ║
║  🔍 Recherche                                              ║
║  ┌─────────────────────────────────────────────────────┐  ║
║  │ [Rechercher des tenders...] [ACTIVE ▼] [Rechercher]│  ║
║  └─────────────────────────────────────────────────────┘  ║
║                                                             ║
║  📊 Résultats (5)                                          ║
║  ┌─────────────────────────────────────────────────────┐  ║
║  │ Title          │ Ref    │ Deadline │ Link          │  ║
║  ├────────────────┼────────┼──────────┼───────────────┤  ║
║  │ Tender 1       │ REF001 │ 2025-12  │ [Ouvrir]      │  ║
║  │ Tender 2       │ REF002 │ 2025-11  │ [Ouvrir]      │  ║
║  │ ...            │ ...    │ ...      │ ...           │  ║
║  └─────────────────────────────────────────────────────┘  ║
║                                                             ║
║  📝 Historique des recherches                              ║
║  ┌─────────────────────────────────────────────────────┐  ║
║  │ • 2025-01-15 14:30 - "ballistic vests" (ACTIVE)    │  ║
║  │   5 résultats                                        │  ║
║  │ • 2025-01-15 14:25 - "casques" (ACTIVE)            │  ║
║  │   12 résultats                                       │  ║
║  └─────────────────────────────────────────────────────┘  ║
║                                                             ║
╚═══════════════════════════════════════════════════════════╝
```

---

## ✅ Checklist MVP

### Frontend
- [x] Barre de recherche (input + select + bouton)
- [x] Affichage résultats (tableau simple)
- [x] Affichage historique (liste des 10 dernières recherches)
- [ ] Loading state pendant la recherche
- [ ] Gestion erreurs basique

### API
- [x] Endpoint `/search`
- [x] Endpoint `/history`
- [ ] CORS configuré

### Backend
- [x] Scraper fonctionnel
- [x] Export JSON
- [x] Log historique

### Storage
- [x] `tenders.json`
- [x] `search_history.ndjson`

---

## 🚀 Commandes MVP

```bash
# Terminal 1: API Server
bun run api

# Terminal 2: Frontend
cd web && bun run dev

# Ouvrir http://localhost:5173
```

---

## 📝 Fichiers MVP (Minimaux)

```
tenderssaas/
├── src/
│   ├── scraper.ts      ✅ (existe)
│   └── api.ts          ✅ (existe - simplifier si besoin)
├── web/
│   └── src/
│       ├── pages/
│       │   └── MVP.tsx  ⚠️ (à créer - 1 seule page)
│       ├── App.tsx      ⚠️ (simplifier - juste MVP)
│       └── main.tsx     ✅
├── tenders.json         ✅ (généré)
└── search_history.ndjson ✅ (généré)
```

---

## 🎯 Différences MVP vs Version Actuelle

| Feature | Version Actuelle | MVP |
|---------|------------------|-----|
| Pages | 2 pages (Search + Tenders) | **1 seule page** |
| Navigation | Tabs/Route | **Pas de navigation** |
| Historique | Sur page séparée | **Sur la même page** |
| Résultats | Page séparée | **Sur la même page** |
| Export CSV | Bouton dans UI | ❌ Pas dans MVP |
| Filtres | Filtre de recherche | ❌ Pas dans MVP |

---

## 💡 Prochaines Étapes Après MVP

Une fois le MVP validé, on peut ajouter :
1. Filtres avancés
2. Pagination
3. Export CSV
4. Détails d'un tender
5. Sauvegarde favorites
6. Notifications

---

**MVP = Minimum pour démontrer la valeur : Recherche + Historique** 🎯

