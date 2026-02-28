import { config, fields, collection, component } from '@keystatic/core';

export default config({
  storage: import.meta.env.PROD ? {
    kind: 'cloud',
  } : {
    kind: 'local',
  },
  cloud: {
    project: 'koreshield/blog',
  },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'slug',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.text({ label: 'Title' }),
        slug: fields.text({
          label: 'Slug',
          description: 'The filename of the post (e.g. "my-post"). Do not change this after publishing.',
          validation: { length: { min: 1 } }
        }),
        description: fields.text({ label: 'Description', multiline: true }),
        published: fields.date({ label: 'Published Date' }),
        updated: fields.date({ label: 'Updated Date', defaultValue: { kind: 'today' } }),
        cover: fields.image({
          label: 'Cover Image',
          directory: 'public',
          publicPath: '/',
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: props => props.value
        }),
        category: fields.text({ label: 'Category' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        author: fields.relationship({
          label: 'Author',
          collection: 'authors',
        }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          dividers: true,
          links: true,
          images: {
            directory: 'public/images/posts',
            publicPath: '/images/posts/',
          },
          componentBlocks: {
            callout: component({
              label: 'Callout',
              preview: () => null,
              schema: {
                type: fields.select({
                  label: 'Type',
                  options: [
                    { label: 'Note', value: 'note' },
                    { label: 'Tip', value: 'tip' },
                    { label: 'Info', value: 'info' },
                    { label: 'Important', value: 'important' },
                    { label: 'Warning', value: 'warning' },
                    { label: 'Caution', value: 'caution' },
                    { label: 'Danger', value: 'danger' },
                  ],
                  defaultValue: 'note',
                }),
                title: fields.text({ label: 'Title' }),
                content: fields.child({
                  kind: 'block',
                  placeholder: 'Content...',
                }),
              },
            }),
          },
        }),
      },
    }),
    authors: collection({
      label: 'Authors',
      slugField: 'name',
      path: 'src/content/authors/*',
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        role: fields.text({ label: 'Role' }),
        bio: fields.text({ label: 'Bio', multiline: true }),
        avatar: fields.image({
          label: 'Avatar',
          directory: 'public/images/authors',
          publicPath: '/images/authors/',
        }),
        twitter: fields.text({ label: 'Twitter URL' }),
        github: fields.text({ label: 'GitHub URL' }),
        linkedin: fields.text({ label: 'LinkedIn URL' }),
      },
    }),
  },
});
