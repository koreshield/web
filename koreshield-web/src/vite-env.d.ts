/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PUBLIC_API_KEY: string
    // add other env vars here
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.mdx' {
    let MDXComponent: (props: Record<string, unknown>) => JSX.Element
    export default MDXComponent
}
