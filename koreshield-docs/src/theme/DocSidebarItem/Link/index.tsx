/**
 * KoreShield Docs  -  Custom sidebar item with icon support.
 *
 * This swizzle wraps the default DocSidebarItemLink to inject
 * an SVG icon from customProps.icon before the label text.
 *
 * Usage in sidebars.ts:
 *   { type: 'doc', id: 'foo', label: 'Foo', customProps: { icon: '<svg>…</svg>' } }
 */

import React from 'react';
import OriginalDocSidebarItemLink from '@theme-original/DocSidebarItem/Link';
import type { Props } from '@theme/DocSidebarItem/Link';

export default function DocSidebarItemLink(props: Props): React.JSX.Element {
	const { item } = props;
	const icon = item.customProps?.icon as string | undefined;

	if (!icon) {
		return <OriginalDocSidebarItemLink {...props} />;
	}

	// Clone props and strip icon from customProps to avoid unknown DOM attribute warnings
	const itemWithoutIcon = {
		...item,
		customProps: { ...item.customProps, icon: undefined },
	};

	return (
		<OriginalDocSidebarItemLink
			{...props}
			item={itemWithoutIcon}
		/>
	);
}
