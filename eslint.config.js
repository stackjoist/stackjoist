import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Layering: cli -> commands -> (recipes | addons | verify) -> core. See docs/ARCHITECTURE.md.
const restrictLayers = (forbidden) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: forbidden.map((layer) => `**/${layer}/**`),
          message: 'Import breaks the layering rules in docs/ARCHITECTURE.md.',
        },
      ],
    },
  ],
});

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Spawning through a shell would reopen command injection; see docs/SECURITY.md.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.name='shell'][value.value=true]",
          message: 'Never spawn processes with shell: true.',
        },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // `const { a: _a, ...rest } = obj` is the idiomatic way to omit a key.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['src/core/**'],
    rules: restrictLayers(['cli', 'commands', 'recipes', 'addons', 'verify']),
  },
  {
    files: ['src/recipes/**', 'src/addons/**', 'src/verify/**'],
    rules: restrictLayers(['cli', 'commands']),
  },
  { files: ['src/commands/**'], rules: restrictLayers(['cli']) },
  { files: ['**/*.js', '**/*.mjs'], ...tseslint.configs.disableTypeChecked },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { URL: 'readonly', process: 'readonly', console: 'readonly' },
    },
  },
);
