<template>
  <div ref="editorElement"></div>
</template>

<script setup>
import Editor from "@toast-ui/editor";
import { onBeforeUnmount, onMounted, ref } from "vue";

import baseOptions from "./baseOptions.js";

const props = defineProps({
  initialValue: String,
  addImageBlobHook: Function,
});

const emit = defineEmits(["change", "keydown"]);

const editorElement = ref();
let toastEditor;

const isMac = /Mac|iP(hone|[oa]d)/.test(navigator.platform);

// Handle undo/redo shortcuts ourselves, matching on the physical key.
// ProseMirror's keymap falls back from 'Shift-Mod-z' to 'Mod-z' when redo has
// nothing to do, so depending on what `event.key` the browser reports (e.g.
// Firefox) the redo shortcut could end up performing an undo.
// Mod+Y is also accepted as redo on every platform, as some setups (seen in
// Firefox on macOS) report Cmd+Shift+Z without the Shift modifier.
function historyKeydownHandler(event) {
  const mod = isMac ? event.metaKey : event.ctrlKey;
  if (!mod || event.altKey) return;
  let command = null;
  if (event.code === "KeyZ") {
    command = event.shiftKey ? "redo" : "undo";
  } else if (event.code === "KeyY" && !event.shiftKey) {
    command = "redo";
  }
  if (command === null) return;
  event.preventDefault();
  event.stopPropagation();
  toastEditor.exec(command);
}

onMounted(() => {
  // Capture phase so this runs before the editor's own key handling
  editorElement.value.addEventListener("keydown", historyKeydownHandler, true);
  toastEditor = new Editor({
    ...baseOptions,
    el: editorElement.value,
    initialValue: props.initialValue,
    // Markdown-only: no WYSIWYG mode switch, no Write/Preview tabs,
    // no toolbar buttons
    initialEditType: "markdown",
    hideModeSwitch: true,
    toolbarItems: [],
    previewStyle: "tab",
    events: {
      change: () => {
        emit("change");
      },
      keydown: (_, event) => {
        emit("keydown", event);
      },
    },
    hooks: props.addImageBlobHook
      ? { addImageBlobHook: props.addImageBlobHook }
      : {},
  });
});

onBeforeUnmount(() => {
  editorElement.value?.removeEventListener(
    "keydown",
    historyKeydownHandler,
    true,
  );
});

function getMarkdown() {
  return toastEditor.getMarkdown();
}

defineExpose({ getMarkdown });
</script>

<style>
@import "@toast-ui/editor/dist/toastui-editor.css";
@import "prismjs/themes/prism.css";
@import "@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css";
@import "./toastui-editor-overrides.scss";
</style>
