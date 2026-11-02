import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  formatters: true,
  ignores: [`.github`, `scripts`, `docker`, `packages/md-cli`, `src/assets`, `example`, `apps/web/src/assets/example/`, `apps/web/vendor/syncblog-plugin/`, `apps/distribution-extension/master/docs.js`],
}, {
  rules: {
    'semi': [`error`, `never`],
    'no-unused-vars': `off`,
    'no-console': `off`,
    'no-debugger': `off`,
    'e18e/prefer-array-at': `off`,
    'e18e/prefer-static-regex': `off`,
    'ts/no-namespace': `off`,
    'style/max-statements-per-line': `off`,
  },
}, {
  files: ['apps/distribution-extension/tests/**/*.mjs'],
  rules: { 'test/no-import-node-test': 'off' },
})
