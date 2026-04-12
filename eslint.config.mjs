export default [
  {
    ignores: ["node_modules/", ".next/", "out/"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
      "prefer-const": "error",
    },
  },
];
