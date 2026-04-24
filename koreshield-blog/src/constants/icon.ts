import type { Favicon } from "@/types/config.ts";


export const defaultFavicons: Favicon[] = [
    // Light mode favicons
    {
        src: "https://koreshield.com/favicon-light.ico",
        theme: "light",
        sizes: "32x32",
    },
    {
        src: "https://koreshield.com/favicon-light-192.png",
        theme: "light",
        sizes: "192x192",
    },
    {
        src: "https://koreshield.com/favicon-light-512.png",
        theme: "light",
        sizes: "512x512",
    },
    // Dark mode favicons
    {
        src: "https://koreshield.com/favicon-dark.ico",
        theme: "dark",
        sizes: "32x32",
    },
    {
        src: "https://koreshield.com/favicon-dark-192.png",
        theme: "dark",
        sizes: "192x192",
    },
    {
        src: "https://koreshield.com/favicon-dark-512.png",
        theme: "dark",
        sizes: "512x512",
    },
];
