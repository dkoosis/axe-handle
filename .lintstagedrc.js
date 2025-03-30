module.exports = {
  "*.ts": [
    "eslint --fix",
    "prettier --write",
    (filenames) => filenames.map(filename => `node utils/validate-path-headers.js --fix --file=${filename}`)
  ],
  "*.js": [
    // Temporarily comment out ESLint for JS files
    // "eslint --fix",
    "prettier --write",
    (filenames) => filenames.map(filename => `node utils/validate-path-headers.js --fix --file=${filename}`)
  ],
  "*.json": [
    "prettier --write"
  ],
  "*.md": [
    "prettier --write"
  ]
};