import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MissingTranslationHandler,
  TranslateCompiler,
  TranslateLoader,
  TranslateModule,
  TranslateParser,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

import { UserShortDTO } from '../../generated';
import { AccountService, User } from '../../core/auth/account.service';

import { SettingsComponent } from './settings.component';

jest.mock('../../core/auth/account.service');

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;
  let accountServiceMock: jest.Mocked<AccountService>;

  const mockUser = (roles: UserShortDTO.RolesEnum[]): User => ({
    id: 'some-id',
    email: 'test@example.com',
    name: 'Test User',
    bearer: 'some toke',
    authorities: roles,
  });

  beforeEach(async () => {
    accountServiceMock = {
      user: jest.fn(),
    } as unknown as jest.Mocked<AccountService>;

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, TranslateModule.forRoot()],
      providers: [
        TranslateStore,
        TranslateLoader,
        TranslateCompiler,
        TranslateParser,
        TranslateService,
        provideAnimations(),
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
        {
          provide: AccountService,
          useValue: accountServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faBell);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set role to "PROFESSOR" when authority is professor', () => {
    accountServiceMock.user.mockReturnValue(mockUser([UserShortDTO.RolesEnum.Professor]));

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.role).toBe('PROFESSOR');
  });

  it('should set role to "APPLICANT" when authority is applicant', () => {
    accountServiceMock.user.mockReturnValue(mockUser([UserShortDTO.RolesEnum.Applicant]));

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.role).toBe('APPLICANT');
  });

  it('should set role to undefined if no authorities are present', () => {
    accountServiceMock.user.mockReturnValue(mockUser([]));

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.role).toBeUndefined();
  });

  it('should set role to undefined if user is null', () => {
    accountServiceMock.user.mockReturnValue(undefined);

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.role).toBeUndefined();
  });
});
