import { FilterField, FilterOption } from 'app/shared/filter/filter.model';

describe('FilterField', () => {
  const option1 = new FilterOption('Option 1', 'opt1', 'key1');
  const option2 = new FilterOption('Option 2', 'opt2', 'key2');
  const options = [option1, option2];

  it('should clone itself and its options', () => {
    const field = new FilterField('transKey', 'field1', options, [option1]);
    const clone = field.clone();
    expect(clone).not.toBe(field);
    expect(clone.options[0]).not.toBe(field.options[0]);
    expect(clone.selected[0]).not.toBe(field.selected[0]);
    expect(clone.translationKey).toBe(field.translationKey);
    expect(clone.field).toBe(field.field);
  });

  it('should return null for getQueryParamEntry if nothing selected', () => {
    const field = new FilterField('transKey', 'field1', options, []);
    expect(field.getQueryParamEntry()).toBeNull();
  });

  it('should return correct query param entry', () => {
    const field = new FilterField('transKey', 'field1', options, [option1, option2]);
    expect(field.getQueryParamEntry()).toEqual(['field1', 'opt1,opt2']);
  });

  it('should reset selection', () => {
    const field = new FilterField('transKey', 'field1', options, [option1]);
    const reset = field.resetSelection();
    expect(reset.selected).toEqual([]);
    expect(reset.field).toBe(field.field);
  });

  it('should create new field with selection', () => {
    const field = new FilterField('transKey', 'field1', options, []);
    const withSel = field.withSelection([option2]);
    expect(withSel.selected).toEqual([option2]);
    expect(withSel).not.toBe(field);
  });
});

describe('FilterOption', () => {
  it('should clone itself', () => {
    const opt = new FilterOption('Option', 'opt', 'key');
    const clone = opt.clone();
    expect(clone).not.toBe(opt);
    expect(clone.displayName).toBe(opt.displayName);
    expect(clone.field).toBe(opt.field);
    expect(clone.translationKey).toBe(opt.translationKey);
  });
});
