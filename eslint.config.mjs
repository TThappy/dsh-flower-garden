import js from '@eslint/js'
import globals from 'globals'

// src/ holds fragments of one closure, so they only parse once concatenated:
// lint the built client.js instead (npm test already checks it matches src/).
export default [
  { ignores: ['node_modules/', 'src/'] },
  js.configs.recommended,
  {
    files: ['client.js'],
    languageOptions: { sourceType: 'script', ecmaVersion: 2023, globals: globals.browser },
    rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', ecmaVersion: 2023, globals: globals.node },
    rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] },
  },
  { files: ['index.js', 'eslint.config.mjs'], languageOptions: { sourceType: 'module', ecmaVersion: 2023 } },
]
