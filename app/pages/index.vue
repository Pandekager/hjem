<script setup lang="ts">
import HomeassistantImg from '~/public/Homeassistant.jpg'
import JellyfinImg from '~/public/Jellyfin.jpg'
import NammenamImg from '~/public/Nammenam.jpg'
</script>

<template>
  <main class="dashboard">
    <h1 class="dashboard-title">Apps</h1>
    <div class="tiles-grid">
      <AppTile
        name="Homeassistant"
        url="http://192.168.0.246:8123/lovelace/default_view"
        icon="🏠"
        :image="HomeassistantImg"
      />
      <AppTile
        name="nammenam"
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
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
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
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .tiles-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
