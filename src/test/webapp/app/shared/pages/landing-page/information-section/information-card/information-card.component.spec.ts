import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { InformationCardComponent } from 'app/shared/pages/landing-page/information-section/information-card/information-card/information-card.component';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';

describe('InformationCardComponent', () => {
  let fixture: ComponentFixture<InformationCardComponent>;
  let component: InformationCardComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformationCardComponent],
      providers: [provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(InformationCardComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
  });

  it('should render image, text and link correctly', () => {
    fixture.componentRef.setInput('imageSrc', '/test-image.png');
    fixture.componentRef.setInput('text', 'Example text');
    fixture.componentRef.setInput('link', 'https://example.com');
    fixture.detectChanges();

    const anchor = nativeElement.querySelector('a.card');
    const img = nativeElement.querySelector('img.image');
    const text = nativeElement.querySelector('.text');
    const icon = nativeElement.querySelector('fa-icon');

    expect(anchor?.getAttribute('href')).toBe('https://example.com');
    expect(img?.getAttribute('src')).toBe('/test-image.png');
    expect(text?.textContent?.trim()).toContain('Example text');
    expect(icon).not.toBeNull();
  });
});
