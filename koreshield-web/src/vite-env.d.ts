/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_USE_SIMULATED_API?: string
    readonly VITE_CLERK_PUBLISHABLE_KEY?: string
    readonly VITE_GA_MEASUREMENT_ID?: string
    readonly VITE_PLAUSIBLE_DOMAIN?: string
    readonly VITE_ENV?: string
    // Note: VITE_PUBLIC_API_KEY removed for security - use JWT auth only
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.mdx' {
    let MDXComponent: (props: Record<string, unknown>) => JSX.Element
    export default MDXComponent
}
