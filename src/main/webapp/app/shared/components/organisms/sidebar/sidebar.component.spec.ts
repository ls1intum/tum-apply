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
import { AccountService } from 'app/core/auth/account.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';

import { SidebarComponent } from './sidebar.component';

jest.mock('app/core/auth/account.service');

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent, TranslateModule.forRoot()],
      providers: [
        TranslateStore,
        TranslateLoader,
        TranslateCompiler,
        TranslateParser,
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
        TranslateService,
        provideAnimations(),
        {
          provide: AccountService,
          useValue: {
            hasAnyAuthority: jest.fn(),
            user: jest.fn(),
            loaded: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faGear);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return the correct categories for a role', () => {
    Object.defineProperty(component, 'categories', {
      get: () => [{ title: 'Admin Category', buttons: [] }],
    });
    fixture.detectChanges();

    const categories = component.categories ?? [];
    expect(categories).toBeDefined();
    expect(categories.some(category => category.title === 'Admin Category')).toBeTruthy();
  });

  it('should correctly determine active links using isActive method', () => {
    jest.spyOn(component, 'isActive').mockImplementation((route: string) => route === '/test-route');

    const testRoute = '/test-route';
    fixture.detectChanges();

    expect(component.isActive(testRoute)).toBeTruthy();
    expect(component.isActive('/other-route')).toBeFalsy();
  });
});
