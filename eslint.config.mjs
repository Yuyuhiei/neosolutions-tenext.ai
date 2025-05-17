// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"), //

  // Add this configuration object to modify rules for TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"], // Apply this configuration only to TypeScript files
    rules: {
      // Set to 'warn' to show warnings without failing the build (usually)
      // Set to 'off' to completely disable the rule
      '@typescript-eslint/no-explicit-any': 'warn', // Or 'off'

      // You can add other rule customizations here
      // For example:
      // 'another-rule': 'off',
    }
  }
];

export default eslintConfig;