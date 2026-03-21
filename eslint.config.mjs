import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // shadcn/ui generated components — do not lint
    "src/components/ui/**",
    // uselayouts.com copy-paste components — do not lint
    "src/components/layouts/**",
    "src/components/3d-book.tsx",
    "src/components/animated-collection.tsx",
    "src/components/bento-card.tsx",
    "src/components/bottom-menu.tsx",
    "src/components/bucket.tsx",
    "src/components/day-picker.tsx",
    "src/components/delete-button.tsx",
    "src/components/discover-button.tsx",
    "src/components/discrete-tabs.tsx",
    "src/components/dynamic-toolbar.tsx",
    "src/components/empty-testimonial.tsx",
    "src/components/expandable-gallery.tsx",
    "src/components/feature-carousel.tsx",
    "src/components/fluid-expanding-grid.tsx",
    "src/components/folder-interaction.tsx",
    "src/components/inline-edit.tsx",
    "src/components/magnified-bento.tsx",
    "src/components/morphing-input.tsx",
    "src/components/multi-step-form.tsx",
    "src/components/pricing-card.tsx",
    "src/components/shake-testimonial-card.tsx",
    "src/components/smooth-dropdown.tsx",
    "src/components/stacked-list.tsx",
    "src/components/status-button.tsx",
    "src/components/vertical-tabs.tsx",
    // Payload CMS generated types
    "src/payload/payload-types.ts",
  ]),
]);

export default eslintConfig;
