<script lang="ts">
    import Icon from "@iconify/svelte";
    import { onMount } from "svelte";

    import type { NavbarLink } from "@/types/config";
    import { url } from "@utils/url";

    interface Props {
        links: NavbarLink[];
    }

    let { links }: Props = $props();
    let isOpen = $state(false);
    let focusedIndex = $state(-1);

    function togglePanel() {
        isOpen = !isOpen;
        if (isOpen) {
            focusedIndex = 0;
            // Focus the first menu item after opening
            setTimeout(() => {
                const firstItem = document.querySelector("#nav-menu-panel a");
                firstItem?.focus();
            }, 100);
        } else {
            focusedIndex = -1;
        }
    }

    // 点击外部关闭面板
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!isOpen) return;

        const panel = document.getElementById("nav-menu-panel");
        const button = document.getElementById("nav-menu-switch");

        if (
            panel &&
            !panel.contains(target) &&
            button &&
            !button.contains(target)
        ) {
            isOpen = false;
            focusedIndex = -1;
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (!isOpen) return;

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                focusedIndex = Math.min(focusedIndex + 1, links.length - 1);
                updateFocus();
                break;
            case "ArrowUp":
                event.preventDefault();
                focusedIndex = Math.max(focusedIndex - 1, 0);
                updateFocus();
                break;
            case "Enter":
                event.preventDefault();
                const focusedLink = document.querySelector(
                    `#nav-menu-panel a:nth-child(${focusedIndex + 1})`,
                ) as HTMLAnchorElement;
                focusedLink?.click();
                break;
            case "Escape":
                event.preventDefault();
                isOpen = false;
                focusedIndex = -1;
                const button = document.getElementById(
                    "nav-menu-switch",
                ) as HTMLButtonElement;
                button?.focus();
                break;
            case "Tab":
                // Allow tab navigation within the menu
                break;
        }
    }

    function updateFocus() {
        const menuItems = document.querySelectorAll("#nav-menu-panel a");
        menuItems.forEach((item, index) => {
            if (index === focusedIndex) {
                (item as HTMLElement).focus();
            }
        });
    }

    onMount(() => {
        document.addEventListener("click", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    });
</script>

<div class="relative md:hidden">
    <button
        aria-label="Menu"
        name="Nav Menu"
        class="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 active:scale-90 hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400"
        id="nav-menu-switch"
        onclick={togglePanel}
        aria-expanded={isOpen}
        aria-controls="nav-menu-panel"
    >
        <Icon icon="material-symbols:menu-rounded" class="text-2xl"></Icon>
    </button>
    <div
        id="nav-menu-panel"
        class="float-panel fixed transition-all right-4 top-16 px-2 py-2 max-h-[80vh] overflow-y-auto glass-panel rounded-xl shadow-2xl z-[60]"
        class:float-panel-closed={!isOpen}
        role="menu"
        aria-labelledby="nav-menu-switch"
    >
        {#each links as link, index}
            <div class="mobile-menu-item mb-1 last:mb-0">
                <a
                    href={link.external ? link.url : url(link.url)}
                    class="group flex justify-between items-center py-3 pl-4 pr-3 rounded-lg gap-8 transition-colors duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    target={link.external ? "_blank" : null}
                    role="menuitem"
                    tabindex={isOpen ? 0 : -1}
                >
                    <div
                        class="flex items-center transition font-bold text-neutral-200 group-hover:text-[var(--primary)]"
                    >
                        {#if link.icon}
                            <Icon
                                icon={link.icon}
                                class="text-xl mr-3 opacity-80"
                            />
                        {/if}
                        {link.name}
                    </div>
                    {#if !link.external}
                        <Icon
                            icon="material-symbols:chevron-right-rounded"
                            class="transition text-xl text-neutral-500 group-hover:text-[var(--primary)]"
                        />
                    {:else}
                        <Icon
                            icon="fa6-solid:arrow-up-right-from-square"
                            class="transition text-xs text-neutral-500 group-hover:text-[var(--primary)]"
                        />
                    {/if}
                </a>
            </div>
        {/each}
    </div>
</div>
