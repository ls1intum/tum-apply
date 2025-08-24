import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faApple, faGoogle, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';

import { AuthFacadeService } from '../../../../core/auth/auth-facade.service';
import { EmailLoginResourceService } from '../../../../generated/api/emailLoginResource.service';

import { AuthCardComponent } from './auth-card.component';

jest.mock('app/core/auth/account.service');

describe('AuthCardComponent', () => {
  let component: AuthCardComponent;
  let fixture: ComponentFixture<AuthCardComponent>;
  const messageSource = new Subject<any>();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCardComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {},
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
        {
          provide: DynamicDialogConfig,
          useValue: {},
        },
        {
          provide: MessageService,
          useValue: {
            messageObserver: messageSource.asObservable(),
            clearObserver: messageSource.asObservable(),
          },
        },
        {
          provide: EmailLoginResourceService,
          useValue: {
            login: jest.fn(),
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

  it('should show correct Google label in login mode', () => {
    fixture.detectChanges();
    const btnData = component.idpButtons().buttons[1];
    expect(btnData.label).toBe('Google');
  });

  it('should show correct Google label in register mode', () => {
    component.mode.set('register');
    fixture.detectChanges();
    const btnData = component.idpButtons().buttons[1];
    expect(btnData.label).toBe('Google');
  });
});
