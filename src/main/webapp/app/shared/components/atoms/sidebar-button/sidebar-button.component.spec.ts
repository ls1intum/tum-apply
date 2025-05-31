import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarButtonComponent } from './sidebar-button.component';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../button/button.component';

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
    expect(icon.getAttribute('ng-reflect-icon')).toContain('home');
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
});
