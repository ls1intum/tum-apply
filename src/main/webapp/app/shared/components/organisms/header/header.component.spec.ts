import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { AccountService, User } from 'app/core/auth/account.service';
import { signal } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faMoon, faSun, faUser } from '@fortawesome/free-solid-svg-icons';

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
        {
          provide: AuthFacadeService,
          useValue: {
            isAuthenticated: false,
            logout: jest.fn(),
            loginWithTUM: jest.fn(),
            loginWithEmail: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faSun);
    library.addIcons(faMoon);
    library.addIcons(faUser);

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to home when logo is clicked', () => {
    const navigateSpy = jest.spyOn(component, 'navigateToHome');
    const logoElement = fixture.nativeElement.querySelector('.logo-section');
    logoElement.click();
    expect(navigateSpy).toHaveBeenCalledTimes(1);
  });

  it('should toggle language when language button is clicked', () => {
    const toggleLanguageSpy = jest.spyOn(component, 'toggleLanguage');
    const languageButton = fixture.nativeElement.querySelector('.language-button');
    languageButton.click();
    expect(toggleLanguageSpy).toHaveBeenCalledTimes(1);
  });

  /* it('should toggle color scheme when the first jhi-button is clicked', () => {
        const toggleColorSchemeSpy = jest.spyOn(component, 'toggleColorScheme');
        const colorSchemeButton = fixture.nativeElement.querySelector('jhi-button');
        colorSchemeButton.click();
        expect(toggleColorSchemeSpy).toHaveBeenCalledTimes(1);
      });*/

  it('should display user name if user is logged in', () => {
    component.user.set({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    });
    fixture.detectChanges();
    const userNameElement = fixture.nativeElement.querySelector('.font-medium');
    expect(userNameElement.textContent).toContain('Test User');
  });

  it('should call logout when logout button is clicked', () => {
    component.user.set({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    });
    fixture.detectChanges();
    const logoutSpy = jest.spyOn(component, 'logout');
    const logoutButton = fixture.nativeElement.querySelector('jhi-button');
    logoutButton.click();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});
