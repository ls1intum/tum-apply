import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { AccountService, User } from 'app/core/auth/account.service';
import { signal } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

import { HeaderComponent } from './header.component';

jest.mock('app/core/auth/account.service');

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, TranslateModule.forRoot()],
      providers: [
        TranslateService,
        TranslateStore,
        {
          provide: AccountService,
          useValue: {
            user: signal<User | undefined>(undefined),
            loaded: signal(true),
          },
        },
      ],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faSun);
    library.addIcons(faMoon);

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
