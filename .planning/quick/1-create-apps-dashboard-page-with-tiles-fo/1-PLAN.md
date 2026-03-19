---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - app/pages/index.vue
  - app/components/AppTile.vue
autonomous: true
requirements: []
---

<objective>
Create apps dashboard page at `/` with clickable tiles for Homeassistant, nammenam (foodplanner), and Jellyfin.
</objective>

<context>
@app/app.vue — Existing Nuxt4 app shell with only `<NuxtPage />`
</context>

<tasks>

<task type="auto">
  <name>Create apps dashboard with tile links</name>
  <files>app/pages/index.vue, app/components/AppTile.vue</files>
  <action>
Create two files:

**app/components/AppTile.vue** — Reusable tile component:
- Props: `name` (string), `url` (string), `icon` (string, emoji)
- Renders a styled card/tile with name, emoji icon, and a link wrapping the whole tile
- Link opens in new tab (`target="_blank" rel="noopener"`)
- Use CSS Grid layout, centered content, hover effect (scale or shadow)
- Tailwind classes: `block p-6 rounded-xl border hover:shadow-lg transition`

**app/pages/index.vue** — Dashboard page:
- `<AppTile>` for each app:
  - Homeassistant: name="Homeassistant", url="http://192.168.0.246:8123/lovelace/default_view", icon="🏠"
  - nammenam: name="nammenam", url="http://192.168.0.131:3001/", icon="🍽️"
  - Jellyfin: name="Jellyfin", url="http://192.168.0.131:8096/web/#/home", icon="🎬"
- Page layout: centered grid (1 col mobile, 3 col desktop)
- Page title: "Apps" or "Dashboard" in an h1
</action>
  <verify>
    <automated>grep -l "Homeassistant\|Jellyfin" app/pages/index.vue app/components/AppTile.vue</automated>
  </verify>
  <done>Three app tiles visible on `/`, each linking to correct URL in new tab</done>
</task>

</tasks>

<verification>
- Page renders at `/` with 3 tiles
- Each tile links to correct external URL
- Links open in new tab
</verification>

<success_criteria>
- `app/pages/index.vue` exists and renders `<AppTile>` for all 3 apps
- `app/components/AppTile.vue` exists with props for name, url, icon
- All 3 URLs are correct per spec
</success_criteria>

<output>
After completion, create `.planning/quick/1-create-apps-dashboard-page-with-tiles-fo/1-SUMMARY.md`
</output>
