module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended"
  ],
  rules: {
    "require-jsdoc": "off",
    "max-len": "off",
    "no-inner-declarations": "off"
  }
};
