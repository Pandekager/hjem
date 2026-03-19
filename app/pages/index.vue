<script setup lang="ts">
import HomeassistantImg from "~/public/Homeassistant.jpg";
import JellyfinImg from "~/public/Jellyfin.jpg";
import NammenamImg from "~/public/Nammenam.jpg";
</script>

<template>
    <main class="dashboard">
        <h1 class="dashboard-title">Anna og Rasmus's apps :)</h1>
        <div class="tiles-grid">
            <AppTile
                name="Homeassistant"
                url="http://192.168.0.246:8123/lovelace/default_view"
                icon="🏠"
                :image="HomeassistantImg"
            />
            <AppTile
                name="Nammenam"
                url="http://192.168.0.131:3001/"
                icon="🍽️"
                :image="NammenamImg"
            />
            <AppTile
                name="Jellyfin"
                url="http://192.168.0.131:8096/web/#/home"
                icon="🎬"
                :image="JellyfinImg"
            />
        </div>
    </main>
</template>

<style scoped>
.dashboard {
    width: 100%;
    min-height: 100vh;
    padding: 2rem;
    box-sizing: border-box;
}

.dashboard-title {
    font-size: 1.875rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 2rem;
    color: #111827;
}

.tiles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    width: 100%;
}

@media (min-width: 1024px) {
    .tiles-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>
