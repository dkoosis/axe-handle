// src/registerAliases.ts
// Registers module aliases for development with ts-node
import moduleAlias from 'module-alias';
import path from 'path';

// Register module aliases
moduleAlias.addAliases({
  '@axe': path.join(__dirname, 'axe'),
  '@generators': path.join(__dirname, 'generators'),
  '@utils': path.join(__dirname, 'utils'),
  '@templates': path.join(__dirname, '../templates')
});

export {};
