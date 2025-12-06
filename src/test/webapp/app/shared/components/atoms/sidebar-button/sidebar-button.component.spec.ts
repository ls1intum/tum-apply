import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarButtonComponent } from 'app/shared/components/atoms/sidebar-button/sidebar-button.component';
import { provideFontAwesomeTesting } from '../../../../../util/fontawesome.testing';
import { TooltipModule } from 'primeng/tooltip';
import { createRouterMock, provideRouterMock, RouterMock } from '../../../../../util/router.mock';

describe('SidebarButtonComponent', () => {
  let component: SidebarButtonComponent;
  let fixture: ComponentFixture<SidebarButtonComponent>;
  let router: RouterMock;

  beforeEach(async () => {
    router = createRouterMock();

    TestBed.configureTestingModule({
      imports: [SidebarButtonComponent, TooltipModule],
      providers: [provideFontAwesomeTesting(), provideRouterMock(router)],
    });

    fixture = TestBed.createComponent(SidebarButtonComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('icon', 'user');
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.componentRef.setInput('link', '/');
    fixture.componentRef.setInput('isCollapsed', false);
    fixture.componentRef.setInput('isActive', false);

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('navigation', () => {
    it('should call router.navigate on click', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      const buttonDiv = fixture.debugElement.query(de => de.nativeElement?.matches?.('.sidebar-button'));

      buttonDiv.triggerEventHandler('click', null);

      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should log an error if navigation fails', async () => {
      const error = new Error('Test Navigation Error');
      const navigateSpy = vi.spyOn(router, 'navigate').mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const buttonDiv = fixture.debugElement.query(de => de.nativeElement?.matches?.('.sidebar-button'));
      buttonDiv.triggerEventHandler('click', null);

      await fixture.whenStable();

      expect(navigateSpy).toHaveBeenCalledWith(['/']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Navigation error:', error);
    });
  });
});
