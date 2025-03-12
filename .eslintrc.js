module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  plugins: [
    '@typescript-eslint',
    'neverthrow',
    'complexity',
    'header'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  env: {
    node: true,
    es6: true,
    jest: true
  },
  rules: {
    // TypeScript rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    
    // Neverthrow rules
    'neverthrow/no-throw': 'error',
    
    // Complexity rules
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 3],
    'max-lines-per-function': ['warn', { 'max': 80, 'skipBlankLines': true, 'skipComments': true }],
    
    // Documentation rules
    'header/header': [
      'error',
      'block',
      [
        '*',
        ' * @file ${filename}',
        ' * @description ${description}',
        ' * @author ${author}',
        ' * @created ${created}',
        ' * @copyright ${copyright}',
        ' * @license ${license}',
        ' '
      ],
      2
    ],
    
    // Best practices
    'prefer-const': 'error',
    'no-console': 'warn',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    
    // Formatting (will be handled by Prettier, but adding a few specific rules)
    'prettier/prettier': 'error'
  },
  overrides: [
    {
      // Disable certain rules for test files
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'max-lines-per-function': 'off',
        'neverthrow/no-throw': 'off'
      }
    }
  ]
};
