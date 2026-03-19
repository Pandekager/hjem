<script setup lang="ts">
defineProps<{
  name: string
  url: string
  icon: string
}>()
</script>

<template>
  <a
    :href="url"
    target="_blank"
    rel="noopener"
    class="tile"
  >
    <span class="tile-icon">{{ icon }}</span>
    <span class="tile-name">{{ name }}</span>
  </a>
</template>

<style scoped>
.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  text-decoration: none;
  color: inherit;
  background: white;
  transition: box-shadow 0.2s, transform 0.2s;
}

.tile:hover {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.tile-icon {
  font-size: 2.5rem;
}

.tile-name {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
}
</style>
