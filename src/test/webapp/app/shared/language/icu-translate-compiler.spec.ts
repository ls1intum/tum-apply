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
    const result = compiler.compile('Hello {name}', 'en');
    expect(typeof result).toBe('function');
    expect((result as (p: Record<string, unknown>) => string)({ name: 'Anna' })).toBe('Hello Anna');
  });

  it('should select singular form for English plural at count=1', () => {
    const result = compiler.compile('{count, plural, =1 {issue} other {issues}}', 'en');
    expect((result as (p: Record<string, unknown>) => string)({ count: 1 })).toBe('issue');
  });

  it('should select plural form for English plural at count=5', () => {
    const result = compiler.compile('{count, plural, =1 {issue} other {issues}}', 'en');
    expect((result as (p: Record<string, unknown>) => string)({ count: 5 })).toBe('issues');
  });

  it('should select German singular form at count=1', () => {
    const result = compiler.compile('{n, plural, =1 {ein Problem} other {{n} Probleme}}', 'de');
    expect((result as (p: Record<string, unknown>) => string)({ n: 1 })).toBe('ein Problem');
  });

  it('should compile a translations tree recursively', () => {
    const tree = {
      title: 'Plain',
      nested: {
        greeting: 'Hi {name}',
        leafNumber: 42,
      },
    };
    const compiled = compiler.compileTranslations(tree, 'en') as {
      title: string;
      nested: { greeting: (p: Record<string, unknown>) => string; leafNumber: number };
    };
    expect(compiled.title).toBe('Plain');
    expect(typeof compiled.nested.greeting).toBe('function');
    expect(compiled.nested.greeting({ name: 'Anna' })).toBe('Hi Anna');
    expect(compiled.nested.leafNumber).toBe(42);
  });

  it('should cache compiled message instances per locale and source', () => {
    const a = compiler.compile('{n, plural, =1 {x} other {y}}', 'en');
    const b = compiler.compile('{n, plural, =1 {x} other {y}}', 'en');
    expect(a).toBe(b);
  });
});
