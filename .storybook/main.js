/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: [
    '../blocks/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
  staticDirs: [
    { from: '../blocks', to: '/blocks' },
    { from: '../styles', to: '/styles' },
    { from: '../scripts', to: '/scripts' },
    { from: '../icons', to: '/icons' }
  ],
  viteFinal: async (config) => {
    // Customize vite config
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '/scripts': '/scripts',
        '/blocks': '/blocks',
        '/styles': '/styles'
      }
    };
    return config;
  }
};
export default config;