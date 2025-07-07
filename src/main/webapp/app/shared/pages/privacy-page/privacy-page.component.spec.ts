import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService, TranslateStore } from '@ngx-translate/core';

import TranslateDirective from '../../language/translate.directive';

import { PrivacyPageComponent } from './privacy-page.component';

describe('PrivacyPageComponent', () => {
  let component: PrivacyPageComponent;
  let fixture: ComponentFixture<PrivacyPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateDirective, TranslateService, TranslateStore, PrivacyPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
