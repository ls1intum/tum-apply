import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(() => '');

const FORBIDDEN_DECORATORS = new Set(['Input', 'Output', 'ViewChild', 'ViewChildren', 'ContentChild', 'ContentChildren']);

const SIGNAL_REPLACEMENTS = {
  Input: 'input() / input.required()',
  Output: 'output()',
  ViewChild: 'viewChild() / viewChild.required()',
  ViewChildren: 'viewChildren()',
  ContentChild: 'contentChild() / contentChild.required()',
  ContentChildren: 'contentChildren()',
};

const enforceSignalApis = createRule({
  name: 'enforce-signal-apis',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid legacy Angular decorators (@Input, @Output, @ViewChild, @ViewChildren, @ContentChild, @ContentChildren). Use signal-based APIs instead.',
    },
    messages: {
      forbiddenDecorator: "Legacy decorator '@{{decoratorName}}' is not allowed. Use {{replacement}} instead.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename ?? context.getFilename();

    // Skip test/spec files
    if (filename.endsWith('.spec.ts')) {
      return {};
    }

    return {
      Decorator(node) {
        let decoratorName;
        const expr = node.expression;

        if (expr.type === 'CallExpression' && expr.callee.type === 'Identifier') {
          decoratorName = expr.callee.name;
        } else if (expr.type === 'Identifier') {
          decoratorName = expr.name;
        }

        if (decoratorName && FORBIDDEN_DECORATORS.has(decoratorName)) {
          context.report({
            node,
            messageId: 'forbiddenDecorator',
            data: {
              decoratorName,
              replacement: SIGNAL_REPLACEMENTS[decoratorName],
            },
          });
        }
      },
    };
  },
});

export default {
  rules: {
    'enforce-signal-apis': enforceSignalApis,
  },
};
