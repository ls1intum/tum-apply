import FindLanguageFromKeyPipe from 'app/shared/language/find-language-from-key.pipe';

describe('FindLanguageFromKeyPipe', () => {
  let pipe: FindLanguageFromKeyPipe;

  beforeEach(() => {
    pipe = new FindLanguageFromKeyPipe();
  });

  it.each([
    ['en', 'English'],
    ['de', 'Deutsch'],
  ])('should return %s as %s', (key, expected) => {
    expect(pipe.transform(key)).toBe(expected);
  });

  it('should throw for unknown language', () => {
    expect(() => pipe.transform('fr')).toThrowError();
  });
});
