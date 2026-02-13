// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'iocraft',
			titleDelimiter:'-',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/istiuak-0/iocraft' }],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{
							label: 'Introduction',
							slug: 'guides/get-started/intro'
						},
						{
							label: 'Quick Start',
							slug: 'guides/get-started/quick-start'
						}
					]
				},

				{
					label: 'Core Concepts',
					items: [
						{ label: 'Services & Registration', slug: 'guides/core/services' },
						{ label: 'Dependency Injection', slug: 'guides/core/injection' },
						{ label: 'Lifecycle Hooks', slug: 'guides/core/lifecycle' },
						{ label: 'Context Sharing', slug: 'guides/core/context' },
					],
				},

				{
					label: 'Common Utilities',
					items: [
						{ label: 'Store Helper', slug: 'guides/common/store' },
						{ label: 'Resource Management', slug: 'guides/common/resource' },
						{ label: 'Navigation Service', slug: 'guides/common/navigation' },
					],
				},
			],
		}),
	],
});
