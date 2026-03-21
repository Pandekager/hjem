<script setup lang="ts">
defineProps<{
    name: string;
    url: string;
    icon: string;
    description: string;
    image?: string;
}>();
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
        <div class="tile-glow" />
        <div class="tile-content">
            <div class="tile-heading">
                <span class="tile-icon">{{ icon }}</span>
                <span class="tile-name">{{ name }}</span>
            </div>
            <p class="tile-description">{{ description }}</p>
            <span class="tile-action">Åbn app</span>
        </div>
    </a>
</template>

<style scoped>
.tile {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-end;
    padding: 1.4rem;
    border-radius: 1.5rem;
    text-decoration: none;
    color: inherit;
    background: linear-gradient(
        145deg,
        rgba(255, 255, 255, 0.92),
        rgba(255, 244, 233, 0.88)
    );
    background-size: cover;
    background-position: center;
    transition:
        transform 0.28s ease,
        box-shadow 0.28s ease,
        border-color 0.28s ease;
    min-height: 260px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(126, 79, 51, 0.14);
    box-shadow: var(--shadow-card);
    isolation: isolate;
}

.tile.has-image {
    border-color: rgba(255, 255, 255, 0.18);
}

.tile:hover {
    transform: translateY(-6px) rotate(-0.4deg);
    box-shadow: 0 26px 46px rgba(48, 27, 16, 0.22);
}

.tile:focus-visible {
    outline: 3px solid rgba(255, 145, 77, 0.45);
    outline-offset: 4px;
}

.tile-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        to top,
        rgba(37, 18, 11, 0.82) 0%,
        rgba(58, 27, 16, 0.24) 52%,
        rgba(255, 255, 255, 0.04) 100%
    );
    pointer-events: none;
}

.tile-glow {
    position: absolute;
    top: -20%;
    right: -10%;
    width: 11rem;
    height: 11rem;
    border-radius: 999px;
    background: radial-gradient(
        circle,
        rgba(255, 214, 161, 0.3),
        transparent 68%
    );
    pointer-events: none;
}

.tile-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.9rem;
}

.tile-heading {
    display: flex;
    align-items: center;
    gap: 0.8rem;
}

.tile-icon {
    display: inline-grid;
    place-items: center;
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 999px;
    font-size: 1.35rem;
    background: rgba(255, 247, 240, 0.24);
    backdrop-filter: blur(6px);
}

.tile-name {
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: 0.01em;
}

.tile-description {
    margin: 0;
    max-width: 18rem;
    line-height: 1.45;
    font-size: 0.98rem;
}

.tile-action {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 0.55rem 0.9rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(255, 247, 240, 0.9);
    color: #613924;
}

.tile.has-image .tile-name,
.tile.has-image .tile-description {
    color: white;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.34);
}

.tile:not(.has-image) .tile-name {
    color: #40281c;
}

.tile:not(.has-image) .tile-description {
    color: #6d5444;
}

.tile.has-image .tile-action {
    background: rgba(255, 245, 235, 0.94);
}

@media (max-width: 640px) {
    .tile {
        min-height: 220px;
    }
}
</style>
