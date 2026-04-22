# SmartPark 🅿️

**Système de parking intelligent connecté (IoT)** — Dashboard web temps-réel
pour visualiser, réserver et analyser les places d'un parking équipé de
capteurs ultrasons (HC-SR04) pilotés par un module Arduino + ESP8266.

> Stack moderne React 18 / TypeScript / Vite / Supabase
> (PostgreSQL + Auth + RLS).

---

## ✨ Fonctionnalités

| Catégorie | Détails |
|---|---|
| 🅿️ **Carte parking live** | Grille visuelle des 4 places (libre / occupée / réservée) avec compte à rebours. |
| 📊 **KPIs temps réel** | Places libres, occupées, taux d'occupation calculés automatiquement. |
| 📈 **Analytics** | Trafic horaire et historique d'occupation (graphiques Recharts). |
| ⏱️ **Réservation 5 min** | Bloque une place le temps d'arriver, libération automatique à expiration. |
| 🔔 **Alertes** | Toast d'avertissement dès que l'occupation dépasse le seuil configurable. |
| 💸 **Tarification dynamique** | Surge pricing automatique au-delà d'un seuil d'occupation. |
| 🔐 **Auth complète** | Inscription, connexion, mot de passe oublié / reset, sessions Supabase. |
| 👮 **Rôles & RLS** | `user` / `admin` via table dédiée + `SECURITY DEFINER` (zéro risque d'escalade). |
| 🌗 **Thèmes** | Clair / sombre / système (`next-themes`). |

---

## 📌 Statut

| Couche | État |
|---|---|
| Dashboard web | ✅ Complet |
| Authentification & rôles | ✅ Complet |
| Base de données Supabase | ✅ Complet |
| Intégration IoT (Arduino + ESP8266) | 🔧 En cours |

## 🧱 Stack technique

**Frontend**
- React 18 · TypeScript (strict) · Vite 5 · SWC
- Tailwind CSS 3 + shadcn/ui (Radix primitives)
- TanStack Query · React Router DOM v6 · React Hook Form · Zod
- Recharts · Lucide icons · Sonner (toasts) · `next-themes`

**Backend (Supabase)**
- PostgreSQL managé · Auth (email/password) · Row Level Security
- Tables : `profiles`, `user_roles`, `reservations`
- Triggers : auto-création de profil + rôle par défaut à l'inscription

**Outillage**
- ESLint 9 (flat config) · Vitest + Testing Library + JSDOM
- Bun ou npm

**IoT (cible matérielle)**
- Arduino Uno + 4 × HC-SR04 (capteurs ultrasons)
- ESP8266 (NodeMCU) — WiFi, POST JSON vers une edge function Supabase

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js ≥ 18** ([download](https://nodejs.org)) ou **[Bun](https://bun.sh) ≥ 1.0**
- Un projet Supabase (ou utiliser celui pré-configuré dans `.env`)

### Installation

```bash
# 1. Cloner
git clone <repo-url> smartpark && cd smartpark

# 2. Installer les dépendances
bun install        # ou : npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# puis éditer .env (cf. section ci-dessous)

# 4. Lancer en mode dev
bun run dev        # ou : npm run dev
# → http://localhost:5173
```

---

## 🔐 Variables d'environnement

Créer un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL="https://<your-project>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon-public-key>"
VITE_SUPABASE_PROJECT_ID="<your-project-id>"
```

> ℹ️ La clé `anon` est **publique** par design (Supabase). La sécurité repose
> sur les politiques RLS de la base — **ne jamais** exposer la `service_role` côté client.

---

## 📦 Scripts disponibles

| Commande | Description |
|---|---|
| `bun run dev` | Serveur de dev avec HMR (Vite) |
| `bun run build` | Build de production → `dist/` |
| `bun run build:dev` | Build en mode développement (sourcemaps) |
| `bun run preview` | Sert le build de production en local |
| `bun run lint` | Vérifie le code avec ESLint |
| `bun run test` | Lance les tests unitaires (Vitest) |
| `bun run test:watch` | Tests en mode watch |

---

## 🗄️ Base de données

### Schéma

```
auth.users            ← géré par Supabase Auth
   │
   ├─→ profiles        (1:1)  email, full_name, phone
   ├─→ user_roles      (1:N)  enum app_role: 'admin' | 'user'
   └─→ reservations    (1:N)  spot_number, status, expires_at
```

### Appliquer les migrations

```bash
# Via Supabase CLI
npx supabase link --project-ref <project-id>
npx supabase db push
```

Les migrations se trouvent dans `supabase/migrations/`.

### Promouvoir un utilisateur admin

Après l'inscription d'un compte, exécuter dans le SQL Editor Supabase :

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'votre@email.com'
on conflict do nothing;
```

### Sécurité (RLS)

Toutes les tables ont **Row Level Security activée**. Règles principales :

- Un utilisateur ne lit / modifie que **ses propres** lignes (`auth.uid() = user_id`).
- Les admins lisent **toutes** les lignes via la fonction `has_role(uid, 'admin')`.
- La fonction `has_role` est `SECURITY DEFINER` pour éviter la récursion RLS.
- Les rôles vivent dans une table **séparée** (`user_roles`) — pas sur `profiles` —
  pour empêcher les escalades de privilèges.

---

## 📁 Structure du projet

```
smartpark/
├── public/                    # Assets statiques
├── src/
│   ├── components/
│   │   ├── dashboard/         # Widgets métier (KPI, Map, Charts, Pricing…)
│   │   ├── ui/                # Primitives shadcn/ui
│   │   ├── AdminRoute.tsx     # Guard route admin
│   │   ├── ProtectedRoute.tsx # Guard route authentifiée
│   │   └── ThemeProvider.tsx
│   ├── data/
│   │   └── mockParking.ts     # 🔌 Couche mock — à remplacer par les capteurs ESP8266
│   ├── hooks/
│   │   ├── useAuth.tsx        # Contexte d'authentification Supabase
│   │   ├── useUserRole.tsx    # Lecture du rôle (admin / user)
│   │   └── useParkingData.ts  # État des places + timers de réservation
│   ├── integrations/
│   │   └── supabase/          # Client + types générés
│   ├── layouts/
│   │   └── DashboardLayout.tsx
│   ├── pages/
│   │   ├── Landing.tsx        # Page d'accueil publique
│   │   ├── Login.tsx · Register.tsx · ForgotPassword.tsx · ResetPassword.tsx
│   │   ├── NotFound.tsx
│   │   └── dashboard/         # Overview, Reservations, History, Account, Admin
│   ├── lib/utils.ts           # Helpers (cn, etc.)
│   ├── test/                  # Setup Vitest
│   ├── App.tsx                # Routing + providers
│   ├── main.tsx               # Entry point
│   └── index.css              # Tokens Tailwind / CSS variables
├── supabase/
│   ├── config.toml
│   └── migrations/            # Schéma SQL versionné
├── .env                       # Variables d'env
├── .env.example               # Template des variables requises
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## 🔌 Intégration IoT (ESP8266 → Supabase)

L'application est conçue pour être pilotée par 4 capteurs HC-SR04 reliés à un
ESP8266. Le contrat d'intégration prévu :

1. **Côté Supabase** : créer une edge function `POST /functions/v1/parking-state`
   qui met à jour une table `parking_state` (à créer).
2. **Côté ESP8266** : envoyer toutes les ~2 s un payload JSON :
   ```json
   { "spots": [
       { "id": 1, "status": "free" },
       { "id": 2, "status": "free" },
       { "id": 3, "status": "free" },
       { "id": 4, "status": "free" }
   ]}
   ```
3. **Côté frontend** : remplacer `useParkingData` par un abonnement
   **Supabase Realtime** sur la table `parking_state` — la carte se mettra
   à jour automatiquement pour tous les utilisateurs connectés.

> Tant que le matériel n'est pas branché, `src/data/mockParking.ts` simule les
> capteurs et l'application reste 100% fonctionnelle en démonstration.

---

## 🧪 Tests

```bash
bun run test            # exécution unique
bun run test:watch      # mode watch
```

Stack : **Vitest + @testing-library/react + jsdom**. Setup global dans
`src/test/setup.ts`.

---

## 🗺️ Roadmap

- [ ] Edge function Supabase pour ingestion des capteurs ESP8266
- [ ] Abonnement Supabase Realtime côté frontend
- [ ] Persistance réelle des paramètres admin (table `settings`)
- [ ] Job `pg_cron` pour expirer automatiquement les réservations
- [ ] Tests unitaires sur `useAuth`, `useParkingData`, guards
- [ ] Internationalisation (FR / EN / AR)
- [ ] PWA + notifications push

---

## 👤 Auteur

**Oussema Amri**

## 📜 Licence

© 2026 SmartPark. Tous droits réservés.
