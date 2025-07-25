import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';

import { SidebarButtonComponent } from './sidebar-button.component';

describe('SidebarButtonComponent', () => {
  let component: SidebarButtonComponent;
  let fixture: ComponentFixture<SidebarButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarButtonComponent, FontAwesomeModule],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faHome);

    fixture = TestBed.createComponent(SidebarButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the correct icon', () => {
    fixture.componentRef.setInput('icon', 'home');
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('fa-icon');
    expect(icon).toBeTruthy();
    expect(icon.classList.contains('icon')).toBe(true);
  });

  it('should render the correct text', () => {
    fixture.componentRef.setInput('label', 'Click Me');
    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector('.sidebar-button');
    expect(buttonElement.textContent).toContain('Click Me');
  });

  it('should apply the active class when isActive is true', () => {
    fixture.componentRef.setInput('isActive', 'true');
    fixture.detectChanges();

    const buttonElement: HTMLElement = fixture.nativeElement.querySelector('.sidebar-button');
    expect(buttonElement.classList).toContain('active');
  });

  it('should call navigate method when clicked', () => {
    const navigateSpy = jest.spyOn(component, 'navigate');
    const buttonElement: HTMLElement = fixture.nativeElement.querySelector('.sidebar-button');

    buttonElement.click();
    expect(navigateSpy).toHaveBeenCalledTimes(1);
  });
});
