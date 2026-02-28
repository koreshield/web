import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
    tags: {
        callout: {
            render: component('./src/components/MarkdocCallout.astro'),
            attributes: {
                type: { type: String, default: 'note' },
                title: { type: String }
            },
        },
    },
});
