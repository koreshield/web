<script lang="ts">
// COMMENTED: light/dark switch disabled  -  site is dark mode only
// All original code preserved below for re-enabling if needed.
//
// import Icon from "@iconify/svelte";
// import { onMount } from "svelte";
// import { BREAKPOINT_LG } from "@constants/breakpoints";
// import { SYSTEM_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";
// import { getStoredTheme, setTheme } from "@utils/theme";
// import type { LIGHT_DARK_MODE } from "@/types/config";
// import { siteConfig } from "@/config";
// import { i18n } from "@i18n/translation";
// import I18nKey from "@i18n/i18nKey";
// import DropdownItem from "@/components/common/DropdownItem.svelte";
// import DropdownPanel from "@/components/common/DropdownPanel.svelte";
//
// const seq: LIGHT_DARK_MODE[] = [LIGHT_MODE, DARK_MODE, SYSTEM_MODE];
// let mode: LIGHT_DARK_MODE = $state(siteConfig.defaultTheme || SYSTEM_MODE);
//
// onMount(() => { mode = getStoredTheme(); });
//
// function switchScheme(newMode: LIGHT_DARK_MODE) { mode = newMode; setTheme(newMode); }
// function toggleScheme() { ... }
// function showPanel() { ... }
// function hidePanel() { ... }
</script>

<!-- COMMENTED: light/dark toggle hidden  -  site is dark mode only -->