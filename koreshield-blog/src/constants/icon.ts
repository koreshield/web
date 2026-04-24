import type { Favicon } from "@/types/config.ts";


export const defaultFavicons: Favicon[] = [
    // Light mode favicons
    {
        src: "/favicon/favicon-light.ico",
        theme: "light",
        sizes: "32x32",
    },
    {
        src: "/favicon/favicon-light-192.png",
        theme: "light",
        sizes: "192x192",
    },
    {
        src: "/favicon/favicon-light-512.png",
        theme: "light",
        sizes: "512x512",
    },
    // Dark mode favicons
    {
        src: "/favicon/favicon-dark.ico",
        theme: "dark",
        sizes: "32x32",
    },
    {
        src: "/favicon/favicon-dark-192.png",
        theme: "dark",
        sizes: "192x192",
    },
    {
        src: "/favicon/favicon-dark-512.png",
        theme: "dark",
        sizes: "512x512",
    },
];
