import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

import { FaqSectionComponent } from 'app/shared/pages/landing-page/faq-section/faq-section.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('FaqSectionComponent', () => {
  let fixture: ComponentFixture<FaqSectionComponent>;
  let component: FaqSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqSectionComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(FaqSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render all FAQ tabs based on the tabs array', () => {
    const panels = fixture.debugElement.queryAll(By.css('p-accordion-panel'));
    expect(panels.length).toBe(component.tabs.length);
  });
});
