<template>
  <LoadingIndicator
    ref="loadingIndicator"
    class="container mx-auto flex h-screen flex-col px-2 pb-4 print:max-w-full"
  >
    <PrimeToast />
    <SearchModal v-model="isSearchModalVisible" />
    <!-- Spacer reserving room for the fixed header below -->
    <div
      class="shrink-0 print:hidden"
      :style="{ height: `${headerHeight}px` }"
    ></div>
    <!-- Header: slides away when scrolling down, comes back when scrolling up -->
    <header
      ref="header"
      class="fixed inset-x-0 top-0 z-30 bg-theme-background transition-transform duration-200 print:static print:translate-y-0"
      :class="{ '-translate-y-full': isHeaderHidden }"
    >
      <div class="container mx-auto px-2 pt-4 print:max-w-full">
        <NavBar
          v-if="showNavBar"
          ref="navBar"
          :class="{ 'print:hidden': route.name == 'note' }"
          :hide-logo="!showNavBarLogo"
          @toggleSearchModal="toggleSearchModal"
        />
        <!-- Pages can teleport their own header (e.g. note title) here -->
        <div id="page-header"></div>
      </div>
    </header>
    <RouterView />
  </LoadingIndicator>
</template>

<script setup>
import Mousetrap from "mousetrap";
import "mousetrap/plugins/global-bind/mousetrap-global-bind";
import { useToast } from "primevue/usetoast";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterView, useRoute } from "vue-router";

import { apiErrorHandler, getConfig } from "./api.js";
import PrimeToast from "./components/PrimeToast.vue";
import { useGlobalStore } from "./globalStore.js";
import { loadTheme } from "./helpers.js";
import NavBar from "./partials/NavBar.vue";
import SearchModal from "./partials/SearchModal.vue";
import LoadingIndicator from "./components/LoadingIndicator.vue";
import router from "./router.js";

const globalStore = useGlobalStore();
const isSearchModalVisible = ref(false);
const loadingIndicator = ref();
const navBar = ref();
const header = ref();
const headerHeight = ref(0);
const isHeaderHidden = ref(false);
const route = useRoute();
const toast = useToast();

// '/' to search
Mousetrap.bind("/", () => {
  if (route.name !== "login") {
    toggleSearchModal();
    return false;
  }
});

// 'CTRL + ALT/OPT + N' to create new note
Mousetrap.bindGlobal("ctrl+alt+n", () => {
  if (route.name !== "login") {
    router.push({ name: "new" });
    return false;
  }
});

// 'CTRL + ALT/OPT + H' to go to home
Mousetrap.bindGlobal("ctrl+alt+h", () => {
  if (route.name !== "login") {
    router.push({ name: "home" });
    return false;
  }
});

getConfig()
  .then((data) => {
    globalStore.config = data;
    loadingIndicator.value.setLoaded();
  })
  .catch((error) => {
    apiErrorHandler(error, toast);
    loadingIndicator.value.setFailed();
  });

const showNavBar = computed(() => {
  return route.name !== "login";
});

const showNavBarLogo = computed(() => {
  return route.name !== "home";
});

function toggleSearchModal() {
  isSearchModalVisible.value = !isSearchModalVisible.value;
}

// Auto-hiding header
let lastScrollY = 0;
let headerResizeObserver = null;

function scrollHandler() {
  const scrollY = Math.max(window.scrollY, 0);
  const delta = scrollY - lastScrollY;
  if (!globalStore.headerAutoHide || scrollY <= headerHeight.value) {
    isHeaderHidden.value = false;
  } else if (delta > 5) {
    isHeaderHidden.value = true;
  } else if (delta < -5) {
    isHeaderHidden.value = false;
  } else {
    return; // Ignore tiny movements, keep the last reference point
  }
  lastScrollY = scrollY;
}

watch(
  () => globalStore.headerAutoHide,
  (enabled) => {
    if (!enabled) isHeaderHidden.value = false;
  },
);

// Always show the header again when navigating to another page
watch(
  () => route.fullPath,
  () => {
    isHeaderHidden.value = false;
  },
);

onMounted(() => {
  window.addEventListener("scroll", scrollHandler, { passive: true });
  headerResizeObserver = new ResizeObserver(() => {
    headerHeight.value = header.value?.offsetHeight || 0;
  });
});

// The header only exists once the config has loaded
watch(header, (element, oldElement) => {
  if (oldElement) headerResizeObserver?.unobserve(oldElement);
  if (element) headerResizeObserver?.observe(element);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", scrollHandler);
  headerResizeObserver?.disconnect();
});

loadTheme();
</script>
