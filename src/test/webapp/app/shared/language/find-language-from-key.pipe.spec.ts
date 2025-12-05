import FindLanguageFromKeyPipe from 'app/shared/language/find-language-from-key.pipe';

describe('FindLanguageFromKeyPipe', () => {
  let pipe: FindLanguageFromKeyPipe;

  beforeEach(() => {
    pipe = new FindLanguageFromKeyPipe();
  });

  it('should return English for en', () => {
    expect(pipe.transform('en')).toBe('English');
  });

  it('should return Deutsch for de', () => {
    expect(pipe.transform('de')).toBe('Deutsch');
  });

  it('should throw or return undefined for unknown language', () => {
    expect(() => pipe.transform('fr')).toThrowError();
  });
});
