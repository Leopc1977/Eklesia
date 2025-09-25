v1

- gerer max_tokens => done MAIS mettre tous les options rassemblé dans un objet 
 - change parameters variable (x,y,z) to a object {x:x,y:y,z:z}; (standby)
-     "moderator_visibility": "all",
- const orchestrator = new Orchestrator({ strategy: "roundRobin" })
- gerer quand le provider est indisposible
- le load config dot aussi prendre en compte quand y'a pas de moderateur sauf si on oblige d'avoir un modo
- terminal_sentences ? ou terminal_sentence sans S
- deleguer le load config opur chaque composante de l'arena au lieu de tout chareg depuis l'arena ?
- meme chose pour reset ?
- avoir des valeurs par defaut pour certains params de load config
- les exemple changer pour utiliser le dist au lieu de src
- ajouter les endpoints dans les configs

---

vX
- pour l'instant le terminalConditionPrompt est case insensitive, en faire une option sensitive ?
- ajouter les tests sur les reponses 
- integrer les api/modele options de game_arena voire +
  - "temperature", "top_p", "top_k", "max_tokens", "stream"

---

- Priorité : **implémenter tous les use cases** pour montrer la polyvalence.
  - AI Council : simulation de débat multi-agents avec un humain.
  - Jeux (Uno, RPS) : simulation avec règles et orchestrateur.
  - Chat multi-agents : intégration front/back simple.

1. Stabiliser et documenter l’API (`Arena`, `Orchestrator`, `Environment`, `Agent`).
2. Créer des exemples showcase complets pour chaque use case.
3. Assurer compatibilité **backend-agnostic** et intégration facile pour devs web.
4. Ajouter éventuellement UI simple pour visualiser interactions / jeux.
- Faire d’Eklesia un **framework SaaS web moderne**, simple à utiliser, démontrant la puissance du multi-agents dans différents contextes (chat, jeu, simulations).
- Différents modes d’orchestration (séquentiel, parallèle, événementiel).
- Support providers multiples (OpenAI, Ollama, API custom).
- Multimodalité (texte + images/sons).

DSL simple pour définir environnements/règles.

----
misc

Backend-agnostic → marche avec Next.js, Bun, Elysia, Node, Deno.

Orchestrateur explicite → gestion avancée des flows (séquentiel, parallèle, hiérarchique, événementiel).

Multi-environnements → pas seulement du chat : jeux, économie, simulations sociales, SaaS collaboratifs.

Human-in-the-loop → un utilisateur peut être un agent.

Config JSON/DSL → définir des environnements/règles sans coder.

Interopérabilité web → intégration facile en front/back moderne.

Explicabilité → log clair des décisions et de l’état global.

Multimodalité (plus tard) → pas que texte, mais aussi images/sons/actions.

AI Council → agents qui débattent entre eux + humain (ex. CEO).

Jeux → Uno, pierre-papier-ciseaux, échecs.

SaaS collaboratif → agents + humains en chatroom.

Simulations sociales/économiques → marché, dilemme du prisonnier, société virtuelle.