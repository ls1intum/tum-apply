import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService, TranslateStore } from '@ngx-translate/core';

import TranslateDirective from '../../language/translate.directive';

import { ImprintPageComponent } from './imprint-page.component';

describe('ImprintPageComponent', () => {
  let component: ImprintPageComponent;
  let fixture: ComponentFixture<ImprintPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateDirective, TranslateService, TranslateStore, ImprintPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImprintPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
