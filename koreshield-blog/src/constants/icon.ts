import type { Favicon } from "@/types/config.ts";


export const defaultFavicons: Favicon[] = [
    // Light mode favicons
    {
        src: "/logo/light/1x/White.png",
        theme: "light",
        sizes: "32x32",
    },
    {
        src: "/logo/light/2x/White@2x.jpg",
        theme: "light",
        sizes: "192x192",
    },
    {
        src: "/logo/light/4x/White@4x.png",
        theme: "light",
        sizes: "512x512",
    },
    // Dark mode favicons
    {
        src: "/logo/dark/1x/Black.png",
        theme: "dark",
        sizes: "32x32",
    },
    {
        src: "/logo/dark/2x/Black@2x.jpg",
        theme: "dark",
        sizes: "192x192",
    },
    {
        src: "/logo/dark/4x/Black@4x.png",
        theme: "dark",
        sizes: "512x512",
    },
];
