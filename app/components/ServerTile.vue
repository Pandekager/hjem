<script setup lang="ts">
const { data, error: fetchError, refresh } = useFetch('/api/mc/status');

const serverState = ref<string | null>(null);
const actionInProgress = ref(false);
const actionError = ref<string | null>(null);

// Initialize serverState from API response
watchEffect(() => {
    if (data.value?.state) {
        serverState.value = data.value.state;
    }
});

const hasFetchError = computed(() => !!fetchError.value);

const stateConfig = computed(() => {
    if (hasFetchError.value) {
        return { color: '#ef4444', label: 'Ingen forbindelse' };
    }

    if (serverState.value === null) {
        return { color: '#9ca3af', label: 'Indlæser...' };
    }

    switch (serverState.value) {
        case 'active':
            return { color: '#22c55e', label: 'Kører' };
        case 'inactive':
        case 'not-found':
            return { color: '#9ca3af', label: 'Stoppet' };
        case 'activating':
            return { color: '#eab308', label: 'Starter...' };
        case 'deactivating':
            return { color: '#f97316', label: 'Stopper...' };
        case 'failed':
            return { color: '#ef4444', label: 'Fejl' };
        default:
            return { color: '#9ca3af', label: 'Ukendt' };
    }
});

const showStart = computed(() => {
    return (
        serverState.value === 'inactive' ||
        serverState.value === 'not-found' ||
        serverState.value === 'failed'
    );
});

const showStop = computed(() => {
    return serverState.value === 'active';
});

const showRetry = computed(() => {
    return hasFetchError.value || !!actionError.value;
});

async function startServer() {
    actionInProgress.value = true;
    actionError.value = null;
    try {
        await $fetch('/api/mc/start', { method: 'POST' });
        serverState.value = 'activating';
    } catch (e: any) {
        if (e?.response?.status === 409) {
            serverState.value = 'activating';
        } else {
            actionError.value = 'Kunne ikke starte serveren';
        }
    } finally {
        actionInProgress.value = false;
    }
}

async function stopServer() {
    actionInProgress.value = true;
    actionError.value = null;
    try {
        await $fetch('/api/mc/stop', { method: 'POST' });
        serverState.value = 'deactivating';
    } catch (e: any) {
        if (e?.response?.status === 409) {
            serverState.value = 'deactivating';
        } else {
            actionError.value = 'Kunne ikke stoppe serveren';
        }
    } finally {
        actionInProgress.value = false;
    }
}

function retry() {
    actionError.value = null;
    refresh();
}
</script>

<template>
    <div class="tile">
        <div class="tile-glow" />
        <div class="tile-content">
            <div class="tile-heading">
                <span class="tile-icon">⛏️</span>
                <span class="tile-name">MC Server</span>
            </div>

            <div class="status-row">
                <span
                    class="status-dot"
                    :style="{ backgroundColor: stateConfig.color }"
                />
                <span class="status-label">{{ stateConfig.label }}</span>
            </div>

            <p v-if="actionError" class="error-text">{{ actionError }}</p>

            <div class="tile-actions">
                <button
                    v-if="showStart"
                    class="tile-action"
                    :disabled="actionInProgress"
                    @click="startServer"
                >
                    Start
                </button>
                <button
                    v-if="showStop"
                    class="tile-action"
                    :disabled="actionInProgress"
                    @click="stopServer"
                >
                    Stop
                </button>
                <button
                    v-if="showRetry"
                    class="tile-action"
                    @click="retry"
                >
                    Prøv igen
                </button>
            </div>
        </div>
    </div>
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

.tile:hover {
    transform: translateY(-6px) rotate(-0.4deg);
    box-shadow: 0 26px 46px rgba(48, 27, 16, 0.22);
}

.tile:focus-visible {
    outline: 3px solid rgba(255, 145, 77, 0.45);
    outline-offset: 4px;
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
    color: #40281c;
}

.status-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.status-dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: background-color 0.3s ease;
}

.status-label {
    font-size: 0.98rem;
    color: #6d5444;
}

.error-text {
    margin: 0;
    font-size: 0.82rem;
    color: #ef4444;
    line-height: 1.4;
}

.tile-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
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
    border: none;
    cursor: pointer;
    transition: opacity 0.2s ease;
    font-family: inherit;
}

.tile-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tile-action:not(:disabled):hover {
    background: rgba(255, 247, 240, 1);
}

@media (max-width: 640px) {
    .tile {
        min-height: 220px;
    }
}
</style>
