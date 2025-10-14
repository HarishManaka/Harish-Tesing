module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended',
    'plugin:xwalk/recommended',
  ],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    'no-use-before-define': [2, { functions: false }],
    'no-console': [
      'error',
      {
        allow: ['warn', 'error', 'info', 'debug'],
      },
    ],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['*.json'],
      rules: {
        'xwalk/max-cells': 'off', // disable max-cells rule for JSON files
      },
    },
    {
      files: ['tests/**/*.js', 'test-*.js', '*test.js'],
      rules: {
        'no-console': 'off', // Allow console in test files for debugging
        'no-await-in-loop': 'off', // Common pattern in test scripts
        'no-plusplus': 'off', // Counter incrementing is fine in tests
        'no-restricted-syntax': 'off', // Allow for...of loops in tests
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_|page|browser' }],
      },
    },
  ],
};
