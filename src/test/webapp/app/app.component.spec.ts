import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import * as common from '@angular/common';
import enLocale from '@angular/common/locales/en';
import dayjs from 'dayjs/esm';
import { provideRouter } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@angular/common', async importOriginal => {
  const actual = await importOriginal<typeof import('@angular/common')>();
  return {
    ...actual,
    registerLocaleData: vi.fn(),
  };
});

vi.mock('../../../main/webapp/app/layouts/main/main.component', () => {
  @Component({ selector: 'jhi-main', standalone: true, template: '' })
  class StubMainComponent {}
  return { default: StubMainComponent };
});

describe('AppComponent (standalone)', () => {
  let addIconsMock: ReturnType<typeof vi.fn>;
  let AppComponent: any;
  let fontAwesomeIcons: any[];

  beforeEach(async () => {
    ({ default: AppComponent } = await import('app/app.component'));
    ({ fontAwesomeIcons } = await import('app/config/font-awesome-icons'));

    addIconsMock = vi.fn();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: FaIconLibrary, useValue: { addIcons: addIconsMock } },
        NgbDatepickerConfig,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('creates the component and configures locale/icons/datepicker', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const instance = fixture.componentInstance;
    const dpConfig = TestBed.inject(NgbDatepickerConfig);

    expect(instance).toBeTruthy();

    // locale registration (registerLocaleData is a vi.fn from our module mock)
    const reg = (common as any).registerLocaleData as ReturnType<typeof vi.fn>;
    expect(reg).toHaveBeenCalledWith(enLocale);

    // Font Awesome icons added
    expect(addIconsMock).toHaveBeenCalledTimes(1);
    expect(addIconsMock).toHaveBeenCalledWith(...fontAwesomeIcons);

    // datepicker minDate = Jan 1, (currentYear - 100)
    const expectedYear = dayjs().subtract(100, 'year').year();
    expect(dpConfig.minDate).toEqual({ year: expectedYear, month: 1, day: 1 });
  });
});
