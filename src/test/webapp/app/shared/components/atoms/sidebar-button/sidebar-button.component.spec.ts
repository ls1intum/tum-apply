import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { By } from '@angular/platform-browser';

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

  it('should display the icon and label when not collapsed', () => {
    const icon = fixture.debugElement.query(By.css('fa-icon'));
    const labelDiv = fixture.debugElement.query(By.css('.text'));

    expect(icon).toBeTruthy();
    expect(labelDiv.nativeElement.textContent.trim()).toBe('Test Label');
  });

  it('should hide the label when the sidebar is collapsed', () => {
    fixture.componentRef.setInput('isCollapsed', true);
    fixture.detectChanges();

    const labelDiv = fixture.debugElement.query(By.css('.text'));
    expect(labelDiv).toBeNull();
  });

  it('should call router.navigate on click', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const buttonDiv = fixture.debugElement.query(By.css('.sidebar-button'));

    buttonDiv.triggerEventHandler('click', null);

    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should log an error if navigation fails', async () => {
    const error = new Error('Test Navigation Error');
    const navigateSpy = vi.spyOn(router, 'navigate').mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const buttonDiv = fixture.debugElement.query(By.css('.sidebar-button'));
    buttonDiv.triggerEventHandler('click', null);

    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/']);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Navigation error:', error);
  });

  it('should have the "active" class when isActive is true', () => {
    fixture.componentRef.setInput('isActive', true);
    fixture.detectChanges();

    const buttonDiv = fixture.debugElement.query(By.css('.sidebar-button'));
    expect(buttonDiv.classes['active']).toBeTruthy();
  });

  it('should not have the "icon-only" class when not collapsed', () => {
    const buttonDiv = fixture.debugElement.query(By.css('.sidebar-button'));
    expect(buttonDiv.classes['icon-only']).toBeFalsy();
  });

  it('should have the "icon-only" class when collapsed and icon is present', () => {
    fixture.componentRef.setInput('isCollapsed', true);
    fixture.detectChanges();

    const buttonDiv = fixture.debugElement.query(By.css('.sidebar-button'));
    expect(buttonDiv.classes['icon-only']).toBeTruthy();
  });
});
