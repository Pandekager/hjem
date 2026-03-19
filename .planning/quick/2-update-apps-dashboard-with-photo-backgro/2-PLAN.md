---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/AppTile.vue
  - app/pages/index.vue
autonomous: true
requirements: []
must_haves:
  truths:
    - "Each tile displays a full-bleed photo background"
    - "Text remains readable over photo via gradient overlay"
    - "Tiles have hover effects (scale/lift)"
  artifacts:
    - path: "app/components/AppTile.vue"
      provides: "Photo tile component with gradient overlay"
    - path: "app/pages/index.vue"
      provides: "Dashboard with image props passed to tiles"
  key_links:
    - from: "index.vue"
      to: "AppTile.vue"
      via: "image prop binding"
---

<objective>
Replace AppTile cards with full-bleed photo backgrounds like Velvet Spectrum. Each tile shows its app photo with a gradient overlay for text readability and hover effects.
</objective>

<context>
Assets available:
- `/app/public/Homeassistant.jpg`
- `/app/public/Jellyfin.jpg`
- `/app/public/Nammenam.jpg` (note: file is `Nammenam.jpg` not `Nammenam.jpg`)

Apps:
1. Homeassistant → Homeassistant.jpg
2. nammenam → Nammenam.jpg
3. Jellyfin → Jellyfin.jpg

Reference: Velvet Spectrum uses full-bleed images with dark gradient overlays and smooth hover transforms.
</context>

<tasks>

<task type="auto">
  <name>task 1: Refactor AppTile.vue with photo background</name>
  <files>app/components/AppTile.vue</files>
  <action>
    Add `image` prop (string, optional). When provided:

    - Tile becomes position:relative with aspect-ratio:16/9 or fixed height min 200px
    - Background: set background-image to the image path, background-size:cover, background-position:center
    - Add pseudo-element or overlay div with gradient: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)
    - Position name text at bottom-left with white text, text-shadow for readability
    - Remove existing icon styling, use icon as small badge top-right or alongside name
    - Hover: transform: scale(1.03) with transition, box-shadow glow

    When no image: fallback to current white card style (backward compatible).

    Example structure:
    ```
    <a :href="url" class="tile" :style="image ? `background-image: url('${image}')` : ''">
      <div class="tile-overlay" v-if="image"></div>
      <span class="tile-icon">{{ icon }}</span>
      <span class="tile-name">{{ name }}</span>
    </a>
    ```
  </action>
  <verify>npm run build 2>&1 | head -20</verify>
  <done>Tile displays full-bleed photo with gradient overlay and hover scale effect</done>
</task>

<task type="auto">
  <name>task 2: Update index.vue to pass image props</name>
  <files>app/pages/index.vue</files>
  <action>
    Import the app images at the top of the script:

    ```ts
    import HomeassistantImg from '~/public/Homeassistant.jpg'
    import JellyfinImg from '~/public/Jellyfin.jpg'
    import NammenamImg from '~/public/Nammenam.jpg'
    ```

    Pass image prop to each AppTile:
    - Homeassistant: `:image="HomeassistantImg"`
    - nammenam: `:image="NammenamImg"`
    - Jellyfin: `:image="JellyfinImg"`

    Update grid to have equal-height tiles (grid-template-rows: 1fr or fixed min-height).
  </action>
  <verify>npm run build 2>&1 | head -20</verify>
  <done>All three tiles show their respective app photos as backgrounds</done>
</task>

</tasks>

<verification>
npm run dev (manual check)
- Tiles show full-bleed photos
- Text readable over images (gradient overlay)
- Hover effects work smoothly
</verification>

<success_criteria>
- All 3 tiles display app photos as backgrounds
- Gradient overlay ensures text readability
- Hover: scale/glow effect visible
- Build passes with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/2-update-apps-dashboard-with-photo-backgro/phase-quick-2-SUMMARY.md`
</output>
