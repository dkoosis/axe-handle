module.exports = {
  "*.ts": [
    "eslint --fix",
    "prettier --write",
    (filenames) => filenames.map(filename => `node utils/validate-path-headers.js --fix --file=${filename}`)
  ],
  "*.js": [
    "eslint --fix",
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
