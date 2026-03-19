<script setup lang="ts">
defineProps<{
  name: string
  url: string
  icon: string
  image?: string
}>()
</script>

<template>
  <a
    :href="url"
    target="_blank"
    rel="noopener"
    class="tile"
    :class="{ 'has-image': image }"
    :style="image ? `background-image: url('${image}')` : ''"
  >
    <div v-if="image" class="tile-overlay" />
    <div class="tile-content">
      <span class="tile-icon">{{ icon }}</span>
      <span class="tile-name">{{ name }}</span>
    </div>
  </a>
</template>

<style scoped>
.tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 1.5rem;
  border-radius: 0.75rem;
  text-decoration: none;
  color: inherit;
  background: white;
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  aspect-ratio: 16 / 9;
  min-height: 200px;
  position: relative;
  overflow: hidden;
}

.tile.has-image {
  border: none;
}

.tile:hover {
  transform: scale(1.03);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.2);
}

.tile-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%);
  pointer-events: none;
}

.tile-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tile-icon {
  font-size: 1.5rem;
}

.tile.has-image .tile-name {
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.tile:not(.has-image) .tile-name {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
}
</style>
