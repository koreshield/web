import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { createServerFn } from "@tanstack/react-start";
import { source } from "@/lib/source";
import browserCollections from "fumadocs-mdx:collections/browser";
import {
    DocsBody,
    DocsDescription,
    DocsPage,
    DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { baseOptions } from "@/lib/layout.shared";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { Mermaid } from "@/components/mdx/mermaid";

export const Route = createFileRoute("/docs/")({
    component: Page,
    loader: async () => {
        const data = await serverLoader();
        await clientLoader.preload(data.path);
        return data;
    },
});

const serverLoader = createServerFn({
    method: "GET",
})
    .handler(async () => {
        // Try to find the root page (index.mdx)
        const page = source.getPage([]);
        if (!page) throw notFound();

        return {
            path: page.path,
            pageTree: await source.serializePageTree(source.getPageTree()),
        };
    });

const clientLoader = browserCollections.docs.createClientLoader({
    component({ toc, frontmatter, default: MDX }) {
        return (
            <DocsPage toc={toc}>
                <DocsTitle>{frontmatter.title}</DocsTitle>
                <DocsDescription>{frontmatter.description}</DocsDescription>
                <DocsBody>
                    <MDX
                        components={{
                            ...defaultMdxComponents,
                            Mermaid,
                        }}
                    />
                </DocsBody>
            </DocsPage>
        );
    },
});

function Page() {
    const data = Route.useLoaderData();
    const { pageTree } = useFumadocsLoader(data);
    const Content = clientLoader.getComponent(data.path);

    return (
        <DocsLayout
            {...baseOptions()}
            tree={pageTree}
            sidebar={{
                collapsible: false,
            }}
        >
            <Content />
        </DocsLayout>
    );
}
