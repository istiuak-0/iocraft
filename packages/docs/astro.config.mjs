// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'iocraft',
			titleDelimiter: '-',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/istiuak-0/iocraft' }],
			sidebar: [
				{
					label: 'Getting Started',
					slug: 'get-started'
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Services', slug: 'guides/services' },
						{ label: 'Dependency Injection', slug: 'guides/injection' },
						{ label: 'Lifecycle Hooks', slug: 'guides/lifecycle' },
						{ label: 'Context Sharing', slug: 'guides/context' },
					],
				},
				{
					label: 'Common Utilities',
					items: [
						{ label: 'Store Helper', slug: 'common/store' },
						{ label: 'Resource Management', slug: 'common/resource' },
						{ label: 'Navigation Service', slug: 'common/navigation' },
					],
				},
				{
					label: 'Reference',
					items: [
						{
							label: 'obtainers reference',
							slug: 'reference/obtainer'
						},
						{
							label: 'store reference',
							slug: 'reference/store'
						},
						{
							label: 'plugin reference',
							slug: 'reference/plugin'
						},
						{
							label: 'resource reference',
							slug: 'reference/resource'
						}
					]
				}
			],
		}),
	],
});
