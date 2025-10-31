# 📊 Structure des Données - Historique & Tenders

## 📝 1. HISTORIQUE (SearchHistory)

L'historique enregistre **chaque recherche effectuée** par l'utilisateur.

### Champs (TypeScript / NDJSON)

```typescript
type SearchHistoryRecord = {
  query: string;           // ✅ Terme de recherche (ex: "ballistic vests")
  scope: string;           // ✅ Scope de recherche (ACTIVE, AWARD, ALL)
  resultsCount: number;    // ✅ Nombre de tenders trouvés
  status: 'success' | 'error';  // ✅ Statut de la recherche
  exportFormat?: string;   // ⚠️ Format d'export (json, csv) - optionnel
  exportPath?: string;     // ⚠️ Chemin du fichier exporté - optionnel
  error?: string;          // ⚠️ Message d'erreur si échec - optionnel
}
```

### Exemple de données

```json
{
  "query": "ballistic vests",
  "scope": "ACTIVE",
  "resultsCount": 5,
  "status": "success",
  "exportFormat": "json",
  "exportPath": "tenders.json"
}
```

### Schéma Prisma

```prisma
model SearchHistory {
  id            String    @id @default(cuid())     // ID unique (généré)
  query         String                             // Terme de recherche
  scope         String                             // ACTIVE, AWARD, ALL
  resultsCount  Int       @default(0)              // Nombre de résultats
  status        String                             // success, error
  exportFormat  String?                            // Format d'export (optionnel)
  exportPath    String?                            // Chemin export (optionnel)
  error         String?                            // Message d'erreur (optionnel)
  createdAt     DateTime  @default(now())          // Date de création (auto)
  
  tenders       Tender[]                           // Relation 1-N avec Tender
}
```

---

## 🔍 2. TENDERS (TenderData)

Les tenders représentent **chaque offre trouvée** lors d'une recherche.

### Champs (TypeScript / JSON)

```typescript
interface TenderData {
  title: string;              // ✅ Titre du tender (obligatoire)
  link: string;               // ✅ URL complète vers le tender sur TED (obligatoire)
  reference?: string;         // ⚠️ Numéro de référence du notice - optionnel
  contractName?: string;      // ⚠️ Nom du contrat - optionnel
  publicationDate?: string;   // ⚠️ Date de publication - optionnel
  deadline?: string;          // ⚠️ Date limite de soumission - optionnel
  buyer?: string;             // ⚠️ Organisme acheteur - optionnel
  description?: string;       // ⚠️ Description détaillée - optionnel
  budget?: string;            // ⚠️ Budget estimé (ex: "€ 50,000") - optionnel
  contractName?: string;      // ⚠️ Nom du contrat - optionnel
}
```

### Exemple de données

```json
{
  "title": "Supply of Ballistic Vests",
  "link": "https://ted.europa.eu/TED/notice/udl?uri=TED:NOTICE:123456-2025:TEXT:EN:HTML",
  "reference": "2025/S 001-123456",
  "contractName": "Personal Protective Equipment",
  "publicationDate": "2025-01-15",
  "deadline": "2025-12-31",
  "buyer": "Ministry of Defense",
  "budget": "€ 500,000",
  "description": "Supply of ballistic vests for security forces..."
}
```

### Schéma Prisma

```prisma
model Tender {
  id              String    @id @default(cuid())      // ID unique (généré)
  title           String                               // Titre (obligatoire)
  link            String    @unique                    // URL (unique, obligatoire)
  reference       String?                              // Référence du notice (optionnel)
  contractName    String?                              // Nom du contrat (optionnel)
  publicationDate String?                              // Date de publication (optionnel)
  deadline        String?                              // Date limite (optionnel)
  buyer           String?                              // Organisme acheteur (optionnel)
  description     String?   @db.Text                   // Description (texte long, optionnel)
  budget          String?                              // Budget estimé (optionnel)
  
  searchHistoryId String                               // ID de la recherche parente (FK)
  searchHistory   SearchHistory                        // Relation N-1 avec SearchHistory
  
  createdAt       DateTime  @default(now())            // Date de création (auto)
  updatedAt       DateTime  @updatedAt                 // Date de mise à jour (auto)
}
```

---

## 📋 Résumé Comparatif

| Catégorie | Historique (SearchHistory) | Tenders |
|-----------|---------------------------|---------|
| **But** | Enregistrer les recherches | Stocker les offres trouvées |
| **Relation** | 1 recherche → N tenders | N tenders → 1 recherche |
| **Champs obligatoires** | `query`, `scope`, `resultsCount`, `status` | `title`, `link` |
| **Champs optionnels** | `exportFormat`, `exportPath`, `error` | `reference`, `contractName`, `publicationDate`, `deadline`, `buyer`, `description`, `budget` |
| **Stockage actuel** | `search_history.ndjson` (fichier) | `tenders.json` (fichier) |
| **Stockage futur** | Table `search_history` (PostgreSQL) | Table `tenders` (PostgreSQL) |

---

## 🎯 Utilisation dans l'Interface

### Historique affiché dans l'UI

Dans la page `Tenders.tsx`, l'historique montre :
- ✅ Terme de recherche (`query`)
- ✅ Scope (`scope`)
- ✅ Nombre de résultats (`resultsCount`)

**Exemple d'affichage :**
```
"ballistic vests" (ACTIVE) · 5 résultats
```

### Tenders affichés dans l'UI

Dans les pages `Search.tsx` et `Tenders.tsx`, le tableau affiche :
- ✅ Titre (`title`)
- ✅ Nom du contrat (`contractName`)
- ✅ Référence (`reference`)
- ✅ Date de publication (`publicationDate`)
- ✅ Date limite (`deadline`)
- ✅ Budget (`budget`)
- ✅ Lien (`link`)

**Exemple de tableau :**
| Title | Contract Name | Reference | Publication | Deadline | Budget | Link |
|-------|---------------|-----------|-------------|----------|--------|------|
| Supply of... | PPE | 2025/S 001 | 2025-01-15 | 2025-12-31 | € 500k | [Open] |

---

## 📊 Données Extraites du Site TED

### Comment sont extraites les données ?

1. **Scraper (Playwright + Cheerio)** :
   - Navigue sur `https://ted.europa.eu`
   - Parse le HTML des résultats de recherche
   - Extrait les champs disponibles

2. **Champs extraits actuellement** :
   - ✅ `title` - Titre principal du tender
   - ✅ `link` - URL du notice
   - ✅ `reference` - Numéro de référence
   - ✅ `contractName` - Nom du contrat
   - ✅ `publicationDate` - Date de publication
   - ✅ `deadline` - Date limite
   - ✅ `budget` - Budget (via regex sur montants €)

3. **Champs non extraits (mais disponibles dans le schéma)** :
   - ⚠️ `buyer` - Organisme acheteur (peut être extrait du détail du notice)
   - ⚠️ `description` - Description complète (nécessite de scraper chaque page de détail)

---

## 🔄 Flux de Données

```
1. Utilisateur lance une recherche
   ↓
2. Scraper extrait les tenders du site TED
   ↓
3. Chaque tender est stocké avec ses champs (title, link, reference, etc.)
   ↓
4. API enregistre resultsCount et status
   ↓
5. SearchHistory + Tenders[] sont sauvegardés
```

---

**Résumé : L'historique stocke les métadonnées de recherche, les tenders stockent les détails de chaque offre trouvée.** 📊

