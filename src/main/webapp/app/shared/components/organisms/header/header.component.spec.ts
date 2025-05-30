import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to home when logo is clicked', () => {
    const navigateSpy = spyOn(component, 'navigateToHome');
    const logoElement = fixture.nativeElement.querySelector('.logo-section');
    logoElement.click();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('should toggle language when language button is clicked', () => {
    const toggleLanguageSpy = spyOn(component, 'toggleLanguage');
    const languageButton = fixture.nativeElement.querySelector('.language-button');
    languageButton.click();
    expect(toggleLanguageSpy).toHaveBeenCalled();
  });

  it('should toggle color scheme when button is clicked', () => {
    const toggleColorSchemeSpy = spyOn(component, 'toggleColorScheme');
    const colorSchemeButton = fixture.nativeElement.querySelector('jhi-button[icon]');
    colorSchemeButton.click();
    expect(toggleColorSchemeSpy).toHaveBeenCalled();
  });

  it('should display user name if user is logged in', () => {
    component.user.set({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      anonymous: false,
      bearer: 'token',
    });
    fixture.detectChanges();
    const userNameElement = fixture.nativeElement.querySelector('.font-medium');
    expect(userNameElement.textContent).toContain('Test User');
  });

  it('should call logout when logout button is clicked', () => {
    const logoutSpy = spyOn(component, 'logout');
    const logoutButton = fixture.nativeElement.querySelector('jhi-button[label="header.logout"]');
    logoutButton.click();
    expect(logoutSpy).toHaveBeenCalled();
  });
});
