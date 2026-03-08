import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarComponent } from 'app/shared/components/organisms/sidebar/sidebar.component';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { provideTranslateMock } from '../../../../../util/translate.mock';
import { AccountServiceMock, createAccountServiceMock, provideAccountServiceMock } from '../../../../../util/account.service.mock';
import { createRouterMock, provideRouterMock, RouterMock } from '../../../../../util/router.mock';
import { provideFontAwesomeTesting } from '../../../../../util/fontawesome.testing';
import { User } from 'app/core/auth/account.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  let accountService: AccountServiceMock;
  let router: RouterMock;

  beforeEach(async () => {
    accountService = createAccountServiceMock();
    router = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideAccountServiceMock(accountService),
        provideRouterMock(router),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('isSidebarCollapsed', false);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggleSidebar should emit sidebarCollapsedChange with the opposite value', () => {
    const emitSpy = vi.spyOn(component.sidebarCollapsedChange, 'emit');
    fixture.componentRef.setInput('isSidebarCollapsed', false);
    fixture.detectChanges();

    component.toggleSidebar();

    expect(emitSpy).toHaveBeenCalledWith(true);
  });

  describe('categories getter', () => {
    it('should return undefined if user is not logged in', () => {
      accountService.user.set(undefined);
      fixture.detectChanges();
      expect(component.categories).toBeUndefined();
    });

    it('should return categories for APPLICANT role', () => {
      accountService.user.set({ authorities: [UserShortDTO.RolesEnum.Applicant] } as User);
      fixture.detectChanges();
      expect(component.categories).toHaveLength(2);
      expect(component.categories?.[0].title).toBe('sidebar.dashboard.dashboard');
      expect(component.categories?.[1].title).toBe('sidebar.applications.title');
    });

    it('should return categories for PROFESSOR role', () => {
      accountService.user.set({ authorities: [UserShortDTO.RolesEnum.Professor] } as User);
      fixture.detectChanges();
      expect(component.categories).toHaveLength(3);
    });
  });

  describe('isActive method', () => {
    it('should return true for exact match', () => {
      router.url = '/job-overview';
      expect(component.isActive('/job-overview')).toBe(true);
    });

    it('should return true for prefix match', () => {
      router.url = '/job/create/123';
      expect(component.isActive('/job/create')).toBe(true);
    });

    it('should return true for root path', () => {
      router.url = '/';
      expect(component.isActive('/')).toBe(true);
    });

    it('should return false for partial prefix match', () => {
      router.url = '/job-overview-something';
      expect(component.isActive('/job-overview')).toBe(false);
    });

    it('should return true for custom group main path', () => {
      router.url = '/application/overview';
      expect(component.isActive('/application/overview')).toBe(true);
    });

    it('should return true for custom group sub path', () => {
      router.url = '/application/detail/456';
      expect(component.isActive('/application/overview')).toBe(true);
    });

    it('should ignore query parameters when matching', () => {
      router.url = '/job-overview?param=value';
      expect(component.isActive('/job-overview')).toBe(true);
    });

    it('should return false for non-matching link', () => {
      router.url = '/some/other/path';
      expect(component.isActive('/job-overview')).toBe(false);
    });
  });
});
