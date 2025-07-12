import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faApple, faGoogle, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { TranslateService, TranslateStore } from '@ngx-translate/core';
import { AccountService, User } from 'app/core/auth/account.service';

import { AuthCardComponent } from './auth-card.component';

jest.mock('app/core/auth/account.service');

describe('AuthCardComponent', () => {
  let component: AuthCardComponent;
  let fixture: ComponentFixture<AuthCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCardComponent],
      providers: [
        TranslateService,
        TranslateStore,
        {
          provide: ActivatedRoute,
          useValue: {},
        },
        {
          provide: AccountService,
          useValue: {
            user: signal<User | undefined>(undefined),
            loaded: signal(true),
            signIn: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faMicrosoft);
    library.addIcons(faGoogle);
    library.addIcons(faApple);

    fixture = TestBed.createComponent(AuthCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show correct Microsoft label in login mode', () => {
    Object.defineProperty(component, 'mode', { get: () => () => 'login' });
    fixture.detectChanges();
    const btnData = component.identityProvider().buttons[0];
    expect(btnData.label).toBe('Sign in with Microsoft');
  });

  it('should show correct Microsoft label in register mode', () => {
    Object.defineProperty(component, 'mode', { get: () => () => 'register' });
    fixture.detectChanges();
    const btnData = component.identityProvider().buttons[0];
    expect(btnData.label).toBe('Register with Microsoft');
  });

  it('should call authTabService.setSelectedTab when onTabChange is called', () => {
    const authTabServiceSpy = jest.spyOn(component.authTabService, 'setSelectedTab');
    component.onTabChange(1);
    expect(authTabServiceSpy).toHaveBeenCalledTimes(1);
    expect(authTabServiceSpy).toHaveBeenCalledWith(1);
  });

  it('should call AccountService.signIn when onTUMSSOLogin is called', () => {
    const signInSpy = jest.spyOn(fixture.debugElement.injector.get(AccountService), 'signIn');
    component.onTUMSSOLogin();
    expect(signInSpy).toHaveBeenCalledTimes(1);
  });
});
