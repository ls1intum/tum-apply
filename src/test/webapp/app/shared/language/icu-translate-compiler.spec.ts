import { beforeEach, describe, expect, it } from 'vitest';
import { IcuTranslateCompiler } from 'app/shared/language/icu-translate-compiler';

describe('IcuTranslateCompiler', () => {
  let compiler: IcuTranslateCompiler;

  beforeEach(() => {
    compiler = new IcuTranslateCompiler();
  });

  it('should return plain strings without placeholders unchanged', () => {
    expect(compiler.compile('Plain text', 'en')).toBe('Plain text');
  });

  it('should interpolate simple parameters', () => {
    const result = compiler.compile('Hello {name}', 'en') as (p: Record<string, unknown>) => string;
    expect(result({ name: 'Anna' })).toBe('Hello Anna');
  });

  it.each([
    ['en', '{count, plural, =1 {issue} other {issues}}', { count: 1 }, 'issue'],
    ['en', '{count, plural, =1 {issue} other {issues}}', { count: 5 }, 'issues'],
    ['de', '{n, plural, =1 {ein Problem} other {{n} Probleme}}', { n: 1 }, 'ein Problem'],
  ])('should select the correct plural form (lang=%s)', (lang, source, params, expected) => {
    const result = compiler.compile(source, lang) as (p: Record<string, unknown>) => string;
    expect(result(params)).toBe(expected);
  });

  it('should compile a translations tree recursively', () => {
    const tree = {
      title: 'Plain',
      nested: { greeting: 'Hi {name}', leafNumber: 42 },
    } as unknown as Parameters<IcuTranslateCompiler['compileTranslations']>[0];
    const compiled = compiler.compileTranslations(tree, 'en') as unknown as {
      title: string;
      nested: { greeting: (p: Record<string, unknown>) => string; leafNumber: number };
    };
    expect(compiled.title).toBe('Plain');
    expect(compiled.nested.greeting({ name: 'Anna' })).toBe('Hi Anna');
    expect(compiled.nested.leafNumber).toBe(42);
  });

  it('should cache compiled message instances per locale and source', () => {
    expect(compiler.compile('{n, plural, =1 {x} other {y}}', 'en')).toBe(compiler.compile('{n, plural, =1 {x} other {y}}', 'en'));
  });
});
