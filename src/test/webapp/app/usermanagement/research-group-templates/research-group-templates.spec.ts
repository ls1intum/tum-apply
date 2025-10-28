import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { ResearchGroupTemplates } from 'app/usermanagement/research-group/research-group-templates/research-group-templates';
import { EmailTemplateResourceApiService } from 'app/generated/api/emailTemplateResourceApi.service';
import { EmailTemplateOverviewDTO } from 'app/generated/model/emailTemplateOverviewDTO';
import { createRouterMock, provideRouterMock } from '../../../util/router.mock';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from '../../../util/toast-service.mock';
import { createTranslateServiceMock, provideTranslateMock } from '../../../util/translate.mock';
import { provideFontAwesomeTesting } from '../../../util/fontawesome.testing';

class EmailTemplateResourceApiServiceMock {
  getTemplates = vi.fn();
  deleteTemplate = vi.fn();
}

describe('ResearchGroupTemplates', () => {
  let fixture: ComponentFixture<ResearchGroupTemplates>;
  let component: ResearchGroupTemplates;
  let api: EmailTemplateResourceApiServiceMock;
  let mockToast: ToastServiceMock;
  let mockRouter = createRouterMock();
  let mockTranslate = createTranslateServiceMock();

  beforeEach(async () => {
    mockToast = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupTemplates],
      providers: [
        { provide: EmailTemplateResourceApiService, useClass: EmailTemplateResourceApiServiceMock },
        provideRouterMock(mockRouter),
        provideToastServiceMock(mockToast),
        provideTranslateMock(mockTranslate),
        provideFontAwesomeTesting(),
      ],
    })
      .overrideComponent(ResearchGroupTemplates, {
        remove: { providers: [EmailTemplateResourceApiService] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResearchGroupTemplates);
    component = fixture.componentInstance;
    fixture.detectChanges();

    api = TestBed.inject(EmailTemplateResourceApiService) as unknown as EmailTemplateResourceApiServiceMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fixture?.destroy();
  });

  // ---------------- LOAD ----------------
  describe('loadPage()', () => {
    it('loads templates successfully', async () => {
      const templates: EmailTemplateOverviewDTO[] = [
        { templateName: 't1', emailType: EmailTemplateOverviewDTO.EmailTypeEnum.ApplicationSent, isDefault: false },
      ];
      api.getTemplates.mockReturnValueOnce(of({ content: templates, totalElements: 1 }));

      await component['loadPage']();

      expect(api.getTemplates).toHaveBeenCalledWith(10, 0);
      expect(component['total']()).toBe(1);
      expect(component['tableData']()).toHaveLength(1);
    });

    it('shows error toast if API fails', async () => {
      api.getTemplates.mockReturnValueOnce(throwError(() => new Error('fail')));

      await component['loadPage']();

      expect(mockToast.showError).toHaveBeenCalledWith({ detail: 'Failed to load templates' });
    });

    it('sets empty array and total=0 when API returns undefined values', async () => {
      api.getTemplates.mockReturnValueOnce(of({ content: undefined, totalElements: undefined }));

      await component['loadPage']();

      expect(component['total']()).toBe(0);
      expect(component['tableData']()).toEqual([]);
    });
  });

  // ---------------- DELETE ----------------
  describe('delete()', () => {
    it('deletes template successfully and shows toast', async () => {
      api.deleteTemplate.mockReturnValueOnce(of({}));
      api.getTemplates.mockReturnValue(of({ content: [], totalElements: 0 }));

      await component.delete('123');

      expect(api.deleteTemplate).toHaveBeenCalledWith('123');
      expect(mockToast.showSuccess).toHaveBeenCalledWith({ detail: 'Successfully deleted template' });
      expect(api.getTemplates).toHaveBeenCalled(); // reloads
    });

    it('shows error toast if deletion fails but still reloads', async () => {
      api.deleteTemplate.mockReturnValueOnce(throwError(() => new Error('fail')));
      api.getTemplates.mockReturnValue(of({ content: [], totalElements: 0 }));

      await component.delete('999');

      expect(mockToast.showError).toHaveBeenCalledWith({ detail: 'Failed to delete template' });
      expect(api.getTemplates).toHaveBeenCalled(); // reloads in finally
    });
  });

  // ---------------- NAVIGATION ----------------
  describe('navigation', () => {
    it('navigates to create page', () => {
      component['navigateToCreate']();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/research-group/template/new']);
    });

    it('navigates to edit page', () => {
      component['navigateToEdit']('xyz');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/research-group/template', 'xyz', 'edit']);
    });
  });

  // ---------------- TABLE DATA ----------------
  describe('tableData mapping', () => {
    it('uses translation keys for default template with name', () => {
      const t: EmailTemplateOverviewDTO = {
        templateName: 'welcome',
        emailType: EmailTemplateOverviewDTO.EmailTypeEnum.ApplicationSent,
        isDefault: true,
      };
      component['responseData'].set([t]);

      const row = component['tableData']()[0];
      expect(row.displayName).toContain('researchGroup.emailTemplates.default.APPLICATION_SENT-welcome');
      expect(row.createdBy).toContain('researchGroup.emailTemplates.systemDefault');
    });

    it('uses translation keys for default template without name', () => {
      const t: EmailTemplateOverviewDTO = {
        templateName: undefined,
        emailType: EmailTemplateOverviewDTO.EmailTypeEnum.ApplicationAccepted,
        isDefault: true,
      };
      component['responseData'].set([t]);

      const row = component['tableData']()[0];
      expect(row.displayName).toContain('researchGroup.emailTemplates.default.APPLICATION_ACCEPTED');
      expect(row.createdBy).toContain('researchGroup.emailTemplates.systemDefault');
    });

    it('builds createdBy string from first and last name for non-default', () => {
      const t: EmailTemplateOverviewDTO = {
        templateName: 'manual',
        emailType: EmailTemplateOverviewDTO.EmailTypeEnum.ApplicationSent,
        isDefault: false,
        firstName: 'Alice',
        lastName: 'Smith',
      };
      component['responseData'].set([t]);

      const row = component['tableData']()[0];
      expect(row.createdBy).toBe('Alice Smith');
    });
  });

  // ---------------- TABLE EVENTS ----------------
  describe('onTableEmit()', () => {
    it('handles undefined first/rows by using defaults', () => {
      api.getTemplates.mockReturnValue(of({ content: [], totalElements: 0 }));
      const spy = vi.spyOn(component as unknown as { loadPage: () => Promise<void> }, 'loadPage');
      component.onTableEmit({});

      expect(component['pageNumber']()).toBe(0);
      expect(spy).toHaveBeenCalled();
    });

    it('calculates correct page number from first/rows', () => {
      api.getTemplates.mockReturnValue(of({ content: [], totalElements: 0 }));
      const spy = vi.spyOn(component as unknown as { loadPage: () => Promise<void> }, 'loadPage');

      component.onTableEmit({ first: 20, rows: 10 });

      expect(component['pageNumber']()).toBe(2);
      expect(spy).toHaveBeenCalled();
    });
  });
});
