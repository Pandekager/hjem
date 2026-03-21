<script setup lang="ts">
useHead({
    title: "Hjem",
});

import HomeassistantImg from "~/public/Homeassistant.jpg";
import JellyfinImg from "~/public/Jellyfin.jpg";
import NammenamImg from "~/public/Nammenam.jpg";

const apps = [
    {
        name: "Homeassistant",
        url: "http://192.168.0.246:8123/lovelace/default_view",
        icon: "🏠",
        image: HomeassistantImg,
        description: 'Lys og andre ting Rasmus synes er "smarte"',
    },
    {
        name: "Nammenam",
        url: "http://192.168.0.131:3001/",
        icon: "🍽️",
        image: NammenamImg,
        description: "Indkøb og alle Anna-venlige opskrifter",
    },
    {
        name: "Jellyfin",
        url: "http://192.168.0.131:8096/web/#/home",
        icon: "🎬",
        image: JellyfinImg,
        description: "Film, serier og afslapning til filmaftener og regnvejr",
    },
];
</script>

<template>
    <main class="dashboard">
        <section class="hero">
            <div class="hero-copy">
                <span class="hero-kicker">Hjemmebasen</span>
                <h1 class="dashboard-title">Anna og Rasmus' apps</h1>
            </div>

            <div class="hero-note">
                <span class="note-label">Kun til os :)</span>
                <p>
                    Dækker hele vores digitale base - en indgang til alle vores
                    private apps.
                </p>
            </div>
        </section>

        <section class="tiles-grid" aria-label="Apps">
            <AppTile
                v-for="app in apps"
                :key="app.name"
                :name="app.name"
                :url="app.url"
                :icon="app.icon"
                :image="app.image"
                :description="app.description"
            />
        </section>
    </main>
</template>

<style scoped>
.dashboard {
    width: 100%;
    min-height: 100vh;
    padding: clamp(1.2rem, 3vw, 2.5rem);
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.hero {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.95fr);
    gap: 1.2rem;
    align-items: stretch;
}

.hero-copy,
.hero-note {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--panel-border);
    background: var(--panel-bg);
    backdrop-filter: blur(18px);
    box-shadow: var(--shadow-soft);
}

.hero-copy {
    padding: clamp(1.5rem, 4vw, 3rem);
    border-radius: 2rem;
}

.hero-copy::after {
    content: "";
    position: absolute;
    inset: auto -3rem -3rem auto;
    width: 12rem;
    height: 12rem;
    border-radius: 999px;
    background: radial-gradient(
        circle,
        rgba(255, 188, 126, 0.28),
        transparent 68%
    );
}

.hero-note {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 1.5rem;
    border-radius: 1.6rem;
    background:
        linear-gradient(
            160deg,
            rgba(255, 255, 255, 0.7),
            rgba(255, 240, 230, 0.85)
        ),
        repeating-linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.32),
            rgba(255, 255, 255, 0.32) 12px,
            rgba(255, 232, 218, 0.28) 12px,
            rgba(255, 232, 218, 0.28) 24px
        );
}

.hero-kicker {
    display: inline-flex;
    align-items: center;
    padding: 0.45rem 0.8rem;
    border-radius: 999px;
    background: rgba(255, 239, 226, 0.92);
    color: #9f4f2b;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.dashboard-title {
    margin: 1rem 0 0.8rem;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(2.4rem, 5vw, 4.6rem);
    line-height: 0.98;
    letter-spacing: -0.04em;
    color: var(--text-strong);
}

.hero-text,
.hero-note p {
    margin: 0;
    max-width: 36rem;
    font-size: 1.04rem;
    line-height: 1.7;
    color: var(--text-soft);
}

.note-label {
    display: inline-block;
    margin-bottom: 0.9rem;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: #5a3524;
}

.tiles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.4rem;
    width: 100%;
}

@media (min-width: 1024px) {
    .tiles-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 860px) {
    .hero {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 640px) {
    .dashboard {
        padding: 1rem;
    }

    .hero-copy,
    .hero-note {
        border-radius: 1.4rem;
    }
}
</style>
