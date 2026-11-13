import { defineStore } from "pinia";
import { ref } from "vue";

export const useGlobalStore = defineStore("global", () => {
  const config = ref({});
  // Whether the top header may slide away while scrolling down.
  const headerAutoHide = ref(true);

  return { config, headerAutoHide };
});
