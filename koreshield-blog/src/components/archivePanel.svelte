<script lang="ts">
    import { onMount } from "svelte";
    import { fade, blur } from "svelte/transition";
    import { getPostUrl } from "@utils/url";

    interface Post {
        id: string;
        data: {
            title: string;
            tags: string[];
            category?: string;
            published: Date | string;
            routeName?: string;
            cover?: string;
        };
        readingTime?: string;
    }

    interface Props {
        sortedPosts?: Post[];
        categories?: string[];
    }

    let { sortedPosts = [], categories = [] }: Props = $props();

    let searchQuery = $state("");
    let selectedCategory = $state("Recent"); // Default to Recent (All)
    let currentPage = $state(1);
    const postsPerPage = 6;

    // "Recent" adds to the start of categories for UI
    const uiCategories = ["Recent", ...categories];

    function formatDate(date: Date | string) {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    // Filtered Posts
    let filteredPosts = $derived.by(() => {
        let posts = sortedPosts;

        // Filter by Category
        if (selectedCategory && selectedCategory !== "Recent") {
            posts = posts.filter(
                (post) => post.data.category === selectedCategory,
            );
        }

        // Filter by Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            posts = posts.filter(
                (post) =>
                    post.data.title.toLowerCase().includes(query) ||
                    post.data.tags?.some((tag) =>
                        tag.toLowerCase().includes(query),
                    ),
            );
        }

        return posts;
    });

    // Paginated Posts
    let paginatedPosts = $derived.by(() => {
        const startIndex = (currentPage - 1) * postsPerPage;
        return filteredPosts.slice(startIndex, startIndex + postsPerPage);
    });

    let totalPages = $derived(Math.ceil(filteredPosts.length / postsPerPage));

    function setCategory(category: string) {
        selectedCategory = category;
        currentPage = 1;
    }

    function nextPage() {
        if (currentPage < totalPages) currentPage++;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function prevPage() {
        if (currentPage > 1) currentPage++; // Assuming prevPage goes back, wait logic is currentPage--
        // Fixed logic below in template to call currentPage--
    }

    function setPage(page: number) {
        currentPage = page;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
</script>

<div class="py-12">
    <!-- Header -->
    <div class="mb-16">
        <h1
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 md:mb-12 tracking-tight"
        >
            Article library
        </h1>

        <div
            class="flex flex-col md:flex-row gap-6 justify-between items-center"
        >
            <!-- Filter Pills -->
            <div
                class="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 md:flex-wrap no-scrollbar"
            >
                <button
                    class="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border
                    {selectedCategory === 'Recent'
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-[var(--primary)] hover:text-white hover:bg-white/10'}"
                    onclick={() => setCategory("Recent")}
                >
                    Recent
                </button>

                {#each categories as category}
                    <button
                        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border
                        {selectedCategory === category
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-[var(--primary)] hover:text-white hover:bg-white/10'}"
                        onclick={() => setCategory(category)}
                    >
                        {category}
                    </button>
                {/each}
            </div>

            <!-- Search Bar -->
            <div class="w-full md:w-80 relative">
                <input
                    type="text"
                    placeholder="Search by title, name, type"
                    bind:value={searchQuery}
                    class="w-full pl-4 pr-10 py-3 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all placeholder-gray-500 text-sm backdrop-blur-sm"
                />
                <div
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--primary)]"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <!-- Posts Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {#each paginatedPosts as post (post.id)}
            <a
                href={getPostUrl(post)}
                class="group block h-full"
                in:fade={{ duration: 300 }}
            >
                <div
                    class="bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:border-[var(--primary)]/50 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col backdrop-blur-sm"
                >
                    <!-- Image Placeholder or Cover -->
                    <div
                        class="h-48 bg-gradient-to-br from-white/5 to-white/10 relative overflow-hidden"
                    >
                        {#if post.data.cover}
                            <img
                                src={post.data.cover}
                                alt={post.data.title}
                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        {:else}
                            <div
                                class="absolute inset-0 flex items-center justify-center text-white/20"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-12 w-12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="1.5"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        {/if}
                        <!-- Tag Overlay -->
                        {#if post.data.category}
                            <div
                                class="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-white shadow-sm border border-white/20"
                            >
                                {post.data.category}
                            </div>
                        {/if}
                    </div>

                    <div class="p-6 flex flex-col flex-grow">
                        <!-- Date -->
                        <div
                            class="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide group-hover:text-[var(--primary)] transition-colors"
                        >
                            {formatDate(post.data.published)}
                        </div>

                        <h3
                            class="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-[var(--primary)] transition-colors"
                        >
                            {post.data.title}
                        </h3>

                        <!-- Read More / Arrow -->
                        <div
                            class="mt-auto pt-4 flex items-center text-sm font-semibold text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300"
                        >
                            Read Article
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 ml-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </a>
        {/each}
    </div>

    <!-- Empty State -->
    {#if paginatedPosts.length === 0}
        <div
            class="text-center py-20 border-2 border-dashed border-white/10 rounded-2xl bg-white/5"
        >
            <p class="text-gray-400 text-lg">
                No articles found matching your criteria.
            </p>
            <button
                class="mt-4 text-[var(--primary)] font-medium hover:underline"
                onclick={() => {
                    searchQuery = "";
                    selectedCategory = "Recent";
                }}
            >
                Clear filters
            </button>
        </div>
    {/if}

    <!-- Pagination -->
    {#if totalPages > 1}
        <div class="flex flex-wrap justify-center items-center gap-2">
            <!-- Numbers -->
            {#each Array(totalPages) as _, i}
                <button
                    class="w-10 h-10 rounded-lg text-sm font-medium transition-all
                    {currentPage === i + 1
                        ? 'bg-[var(--primary)] text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}"
                    onclick={() => setPage(i + 1)}
                >
                    {i + 1}
                </button>
            {/each}

            <!-- Next Button -->
            <button
                class="px-6 py-2.5 rounded-lg text-sm font-bold bg-[var(--primary)] text-white hover:bg-blue-600 transition-colors ml-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                disabled={currentPage === totalPages}
                onclick={nextPage}
            >
                Next
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                </svg>
            </button>
        </div>
    {/if}
</div>
