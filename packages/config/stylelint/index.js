// @ts-check

/** At-rules Tailwind CSS 4, которых нет в стандартном CSS. */
const tailwindAtRules = [
  'theme',
  'apply',
  'source',
  'utility',
  'variant',
  'custom-variant',
  'plugin',
  'config',
  'reference',
];

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-unknown': [true, {ignoreAtRules: tailwindAtRules}],
    'at-rule-no-deprecated': [true, {ignoreAtRules: ['apply']}],
    'at-rule-prelude-no-invalid': [true, {ignoreAtRules: tailwindAtRules}],
    'function-no-unknown': [
      true,
      {ignoreFunctions: ['theme', '--alpha', '--spacing']},
    ],
    'import-notation': 'string',
  },
};
