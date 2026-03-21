<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<style>
:root {
  --page-bg:
    radial-gradient(circle at top left, rgba(255, 214, 165, 0.95), transparent 30%),
    radial-gradient(circle at top right, rgba(255, 177, 193, 0.85), transparent 28%),
    linear-gradient(160deg, #fff7ef 0%, #fff4f6 45%, #f4fbff 100%);
  --panel-bg: rgba(255, 252, 248, 0.72);
  --panel-border: rgba(133, 88, 53, 0.12);
  --text-strong: #40281c;
  --text-soft: #6d5444;
  --shadow-soft: 0 24px 70px rgba(91, 53, 34, 0.14);
  --shadow-card: 0 18px 40px rgba(68, 37, 22, 0.18);
}

html,
body,
#__nuxt {
  min-height: 100%;
}

body {
  margin: 0;
  background: var(--page-bg);
  color: var(--text-strong);
  font-family: "Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif;
}

a {
  color: inherit;
}

* {
  box-sizing: border-box;
}
</style>
