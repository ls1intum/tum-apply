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
import { Router } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { AccountService } from 'app/core/auth/account.service';

import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  const accountServiceMock = {
    hasAnyAuthority: jest.fn(),
    user: jest.fn(),
    loaded: jest.fn(),
  };

  const routerMock: Partial<Router> = {
    url: '/',
    navigate: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AccountService, useValue: accountServiceMock },
        { provide: Router, useValue: routerMock },
        TranslateStore,
        TranslateLoader,
        TranslateCompiler,
        TranslateParser,
        TranslateService,
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isSidebarCollapsed', false);
    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faGear);
  });

  it('should create', () => {
    accountServiceMock.user.mockReturnValue({ authorities: [] });
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should return categories for ADMIN role', () => {
    accountServiceMock.user.mockReturnValue({ authorities: ['ADMIN'] });
    fixture.detectChanges();
    const categories = component.categories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.some(c => c.title === 'sidebar.dashboard.dashboard')).toBe(true);
  });

  it('isActive should detect active links based on Router.url', () => {
    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'url', { get: () => '/test-route' });
    fixture.detectChanges();
    expect(component.isActive('/test-route')).toBe(true);
    expect(component.isActive('/other-route')).toBe(false);
    expect(component.isActive('/')).toBe(false);
    Object.defineProperty(router, 'url', { get: () => '/' });
    fixture.detectChanges();
    expect(component.isActive('/')).toBe(true);
    expect(component.isActive('/test-route')).toBe(false);
  });
});
