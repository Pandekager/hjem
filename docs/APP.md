# Hjem

## Formaal

`Hjem` er en lille privat Nuxt-app til Rasmus og Anna. Den fungerer som en enkel forside med store genveje til de interne tjenester, I bruger derhjemme.

Appen er bevidst simpel:

- Den viser et lille udvalg af faste links.
- Hver genvej vises som et visuelt kort med baggrundsbillede og ikon.
- Links aabnes i en ny fane.
- Tjenesterne peger paa lokale IP-adresser og er derfor lavet til brug paa hjemmenetvaerket.

## Nuvaerende genveje

- `Homeassistant` via `http://192.168.0.246:8123/lovelace/default_view`
- `Nammenam` via `http://192.168.0.131:3001/`
- `Jellyfin` via `http://192.168.0.131:8096/web/#/home`

## Teknisk overblik

- Framework: Nuxt 4
- Runtime: Bun bruges i Docker-setup, men almindelig `npm` eller `bun` virker fint lokalt
- Hovedside: [app/pages/index.vue](/home/rasmus/Work/hjem/app/pages/index.vue)
- Kort-komponent: [app/components/AppTile.vue](/home/rasmus/Work/hjem/app/components/AppTile.vue)
- Globale styles: [app/app.vue](/home/rasmus/Work/hjem/app/app.vue)
- Head og favicon: [nuxt.config.ts](/home/rasmus/Work/hjem/nuxt.config.ts)
- Billeder: `/app/public/*.jpg`

## Struktur

### [app/pages/index.vue](/home/rasmus/Work/hjem/app/pages/index.vue)

Forsiden samler indholdet og definerer, hvilke apps der vises. Hvis I vil tilfoeje en ny genvej, er det her den mest direkte aendring laves.

### [app/components/AppTile.vue](/home/rasmus/Work/hjem/app/components/AppTile.vue)

Viser et enkelt klikbart kort. Komponenten tager navn, URL, ikon, billede og kort beskrivelse som props.

### [app/app.vue](/home/rasmus/Work/hjem/app/app.vue)

Indeholder det globale layout og de overordnede designvariabler, som styrer baggrund, farver og typografi.

## Lokal udvikling

Installer dependencies:

```bash
bun install
```

Start udviklingsserveren:

```bash
bun run dev
```

Standardadressen er normalt `http://localhost:3000`.

## Produktion og container

Projektet kan bygges og koeres i Docker.

Byg og start med compose:

```bash
docker compose up --build -d
```

Appen eksponeres paa port `3002`.

Docker-setuppet bruger nu et multi-stage build:

- `builder` installerer dependencies og bygger Nuxt-outputtet
- `runner` indeholder kun Bun og den faerdige `.output` mappe
- Runtime-containeren er derfor mindre og mere fokuseret paa kun at koere appen

Compose saetter produktionsmiljoeet eksplicit via `NODE_ENV`, `HOST`, `PORT`, `NITRO_HOST` og `NITRO_PORT`.
Healthchecken rammer `127.0.0.1:3002` inde i containeren for at undgaa problemer med `localhost` og IPv6-opslag.

## Saaadan tilpasser I appen

### Tilfoej eller rediger et link

1. Aabn [app/pages/index.vue](/home/rasmus/Work/hjem/app/pages/index.vue)
2. Find listen over apps i toppen af filen
3. Ret `name`, `url`, `icon`, `description` og eventuelt `image`

### Skift billeder

1. Laeg et nyt billede i `/app/public`
2. Importer det i [app/pages/index.vue](/home/rasmus/Work/hjem/app/pages/index.vue)
3. Brug billedet paa den relevante app

### Aendr det visuelle udtryk

Det meste af temaet kan justeres i [app/app.vue](/home/rasmus/Work/hjem/app/app.vue) og [app/components/AppTile.vue](/home/rasmus/Work/hjem/app/components/AppTile.vue).

## Bemærkninger

- Appen har ingen login, ingen database og ingen kompleks forretningslogik.
- Den er bedst egnet som privat og lille hjemmeportal.
- Hvis IP-adresserne paa jeres tjenester aendrer sig, skal de opdateres i [app/pages/index.vue](/home/rasmus/Work/hjem/app/pages/index.vue).
