# Configuration Vercel

## Variables d'environnement requises

Pour déployer cette application sur Vercel, vous devez configurer les variables d'environnement suivantes :

### 1. Accédez aux paramètres de votre projet Vercel
- Allez sur https://vercel.com/dashboard
- Sélectionnez votre projet
- Cliquez sur "Settings" → "Environment Variables"

### 2. Ajoutez les variables suivantes :

#### Variables requises :
- `NEXT_PUBLIC_SUPABASE_URL` : L'URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : La clé anonyme (anon key) de votre projet Supabase

#### Variable optionnelle (pour les migrations) :
- `SUPABASE_SERVICE_ROLE_KEY` : La clé de service (service role key) pour les opérations admin

### 3. Où trouver ces valeurs dans Supabase :
1. Connectez-vous à https://supabase.com
2. Sélectionnez votre projet
3. Allez dans "Settings" → "API"
4. Vous y trouverez :
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role secret → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Redéployer
Après avoir ajouté les variables d'environnement, redéployez votre application :
- Cliquez sur "Redeploy" dans Vercel
- Ou faites un nouveau commit pour déclencher un déploiement automatique

## Exemple de configuration locale
Créez un fichier `.env.local` à la racine du projet (non versionné) :
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```