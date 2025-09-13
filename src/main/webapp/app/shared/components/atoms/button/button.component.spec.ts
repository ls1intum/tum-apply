import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';

import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent, FontAwesomeModule],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faHome);

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the label when provided', () => {
    fixture.componentRef.setInput('label', 'Click Me');
    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.textContent).toContain('Click Me');
  });

  it('should disable the button when disabled is true', () => {
    fixture.componentRef.setInput('label', 'Disabled Button');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.disabled).toBe(true);
  });

  it('should render the icon when icon is provided', () => {
    fixture.componentRef.setInput('icon', 'home');
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('fa-icon');
    expect(icon).toBeTruthy();
  });

  it('should display favorite badge when numberOfFavorites is set', () => {
    fixture.componentRef.setInput('numberOfFavorites', 7);
    fixture.detectChanges();

    const badge: HTMLElement | null = fixture.nativeElement.querySelector('.button-overlay');
    expect(badge).not.toBeNull();
    expect(badge!.textContent.trim()).toBe('7');
  });

  it('should render a rounded button when label is undefined', () => {
    fixture.componentRef.setInput('label', undefined);
    fixture.detectChanges();

    const pButton = fixture.debugElement.query(By.css('p-button'));
    expect(pButton.componentInstance.rounded).toBe(true);
  });
});
