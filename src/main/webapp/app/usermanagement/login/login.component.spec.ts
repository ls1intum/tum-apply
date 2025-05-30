import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faApple, faGoogle, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { UserResourceService } from 'app/generated/api/userResource.service';

import { MockKeycloakService } from '../../core/auth/keycloak.service.mock';
import { AccountService } from '../../core/auth/account.service';
import { KeycloakService } from '../../core/auth/keycloak.service';

import { LoginComponent } from './login.component';

jest.mock('app/core/auth/account.service');
jest.mock('app/generated/api/userResource.service');

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {},
        },
        {
          provide: AccountService,
          useValue: {
            hasAnyAuthority: jest.fn(),
            user: jest.fn(),
            loaded: jest.fn(),
          },
        },
        {
          provide: KeycloakService,
          useClass: MockKeycloakService,
        },
        {
          provide: UserResourceService,
          useValue: {},
        },
      ],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faMicrosoft);
    library.addIcons(faGoogle);
    library.addIcons(faApple);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a login-page-wrapper div', () => {
    const wrapperDiv = fixture.debugElement.query(By.css('.login-page-wrapper'));
    expect(wrapperDiv).toBeTruthy();
  });

  it('should include the auth-card component', () => {
    const authCardComponent = fixture.debugElement.query(By.css('jhi-auth-card'));
    expect(authCardComponent).toBeTruthy();
  });

  it('should pass login mode to auth-card component', () => {
    const authCardComponent = fixture.debugElement.query(By.css('jhi-auth-card'));
    expect(authCardComponent).toBeTruthy();
    expect(authCardComponent.attributes['ng-reflect-mode']).toBe('login');
  });

  it('should render the component within the login-page-wrapper', () => {
    const wrapperDiv = fixture.debugElement.query(By.css('.login-page-wrapper'));
    const authCardWithinWrapper = wrapperDiv.query(By.css('jhi-auth-card'));
    expect(authCardWithinWrapper).toBeTruthy();
  });
});
