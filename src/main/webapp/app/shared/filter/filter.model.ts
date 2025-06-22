export interface IFilterField {
  translationKey: string;
  field: string;
  options: FilterOption[];
  selected?: FilterOption[];
}

export interface IFilterOption {
  displayName: string;
  field: string;
  translationKey: string | undefined;
}

export class FilterField implements IFilterField {
  constructor(
    public translationKey: string,
    public field: string,
    public options: FilterOption[],
    public selected: FilterOption[] = [],
  ) {
    this.translationKey = translationKey;
    this.field = field;
    this.options = options;
    this.selected = selected;
  }

  getQueryParamEntry(): [string, string] | null {
    if (this.selected.length === 0) {
      return null;
    }
    const key = this.field;
    const value = this.selected.map(opt => opt.field).join(',');
    return [key, value];
  }

  /**
   * Creates a new FilterField with selection set based on a param string (e.g. "IN_REVIEW,ACCEPTED")
   */
  withSelectionFromParam(param: string): FilterField {
    const paramValues = param.split(',').map(v => decodeURIComponent(v.trim()));
    const matched = this.options.filter(opt => paramValues.includes(opt.field));
    return this.withSelection(matched);
  }

  resetSelection(): FilterField {
    return new FilterField(this.translationKey, this.field, this.options, []);
  }

  /**
   * Returns a new FilterField with the given selection applied
   */
  withSelection(selected: FilterOption[]): FilterField {
    return new FilterField(this.translationKey, this.field, this.options, selected);
  }
}

export class FilterOption implements IFilterOption {
  constructor(
    public displayName: string,
    public field: string,
    public translationKey: string | undefined = undefined,
  ) {
    this.displayName = displayName;
    this.field = field;
    this.translationKey = translationKey;
  }
}
