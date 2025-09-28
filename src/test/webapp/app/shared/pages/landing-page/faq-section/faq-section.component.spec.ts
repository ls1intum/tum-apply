import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

import { FaqSectionComponent } from 'app/shared/pages/landing-page/faq-section/faq-section.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

describe('FaqSectionComponent', () => {
  let fixture: ComponentFixture<FaqSectionComponent>;
  let component: FaqSectionComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqSectionComponent, FontAwesomeModule],
      providers: [provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(FaqSectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the headline and subheadline translation keys', () => {
    const headline = nativeElement.querySelector('h2.title');
    const subheadline = nativeElement.querySelector('p.subtitle');
    expect(headline?.getAttribute('jhiTranslate')).toBe('landingPage.faq.headline');
    expect(subheadline?.getAttribute('jhiTranslate')).toBe('landingPage.faq.subheadline');
  });

  it('should render external link with correct href and icon', () => {
    const link = nativeElement.querySelector('.sub-subtitle-link') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.href).toContain('https://ls1intum.github.io/tum-apply');

    const icon = link.querySelector('fa-icon');
    expect(icon).toBeTruthy();
    expect(icon?.classList).toContain('external-icon');
  });

  it('should render all FAQ tabs based on the tabs array', () => {
    const panels = fixture.debugElement.queryAll(By.css('p-accordion-panel'));
    expect(panels.length).toBe(component.tabs.length);
  });
});
