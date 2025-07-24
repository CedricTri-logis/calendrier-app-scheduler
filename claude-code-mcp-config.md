# Configuration MCP pour Claude Code

Pour connecter Serena à Claude Code, ajoute ceci dans les paramètres MCP de Claude Code :

```json
{
  "serena": {
    "url": "http://localhost:8000",
    "transport": "sse"
  }
}
```

## Ou utilise cette commande dans un nouveau terminal :

```bash
cd /Users/cedriclajoie/test/serena
uv run serena-mcp-server --project /Users/cedriclajoie/test/calendrier-app --transport sse --port 8000
```

## Vérifier que ça marche

Une fois connecté, tu peux demander à Claude :
- "Utilise Serena pour trouver le composant Calendar"
- "Montre-moi tous les symboles dans le projet avec Serena"
- "Trouve toutes les références à handleDragStart"