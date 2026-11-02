<template>
  <div class="flex h-full justify-center">
    <div
      class="flex max-w-[700px] flex-1 flex-col items-center pt-[6vh] md:pt-[15vh]"
    >
      <Logo class="mb-5" />
      <SearchInput
        class="mb-6 w-full max-w-[500px] shadow-[0_0_20px] shadow-theme-shadow"
      />
      <LoadingIndicator
        ref="loadingIndicator"
        class="min-h-56 w-full"
        hideLoader
      >
        <div class="grid w-full grid-cols-2 gap-4">
          <div v-for="section in sections" :key="section.title" class="min-w-0">
            <p
              class="mb-2 px-2 text-left text-xs font-bold uppercase text-theme-text-very-muted"
            >
              {{ section.title }}
            </p>
            <RouterLink
              v-for="note in section.notes.slice(0, quickAccessLimit())"
              :key="note.title"
              :to="{ name: 'note', params: { title: note.title } }"
              :title="note.title"
              class="mb-1 block truncate rounded px-2 py-1 text-left text-theme-text-muted hover:bg-theme-background-elevated"
            >
              {{ note.title }}
            </RouterLink>
            <RouterLink
              v-if="section.notes.length > quickAccessLimit()"
              :to="{
                name: 'search',
                query: {
                  term: section.term,
                  sortBy: searchSortOptions[section.sort],
                },
              }"
              title="Show more"
              class="block w-fit"
              ><CustomButton :iconPath="mdiDotsHorizontal"
            /></RouterLink>
          </div>
        </div>
      </LoadingIndicator>
    </div>
  </div>
</template>

<script setup>
import { mdiDotsHorizontal } from "@mdi/js";
import { useToast } from "primevue/usetoast";
import { onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";

import { apiErrorHandler, getNotes } from "../api.js";
import CustomButton from "../components/CustomButton.vue";
import LoadingIndicator from "../components/LoadingIndicator.vue";
import Logo from "../components/Logo.vue";
import { searchSortOptions } from "../constants.js";
import { useGlobalStore } from "../globalStore.js";
import SearchInput from "../partials/SearchInput.vue";

const globalStore = useGlobalStore();
const loadingIndicator = ref();
const toast = useToast();

// Home page columns: pinned notes on the left, all notes on the right.
const sections = ref([
  { title: "Pinned", term: "#pinned", sort: "title", notes: [] },
  { title: "All Notes", term: "*", sort: "lastModified", notes: [] },
]);

function quickAccessLimit() {
  return globalStore.config.quickAccessLimit;
}

function init() {
  if (globalStore.config.quickAccessHide) {
    return;
  }
  Promise.all(
    sections.value.map((section) =>
      getNotes(
        section.term,
        section.sort,
        // Order by ascending if sorting by title, descending otherwise.
        section.sort === "title" ? "asc" : "desc",
        // Limit is increased by 1 to check if there are more notes than the limit.
        quickAccessLimit() + 1,
      ),
    ),
  )
    .then((results) => {
      results.forEach((data, i) => {
        sections.value[i].notes = data;
      });
      loadingIndicator.value.setLoaded();
    })
    .catch((error) => {
      loadingIndicator.value.setFailed();
      apiErrorHandler(error, toast);
    });
}

// Watch to allow for delayed config load.
watch(() => globalStore.config.hideRecentlyModified, init);
onMounted(init);
</script>
