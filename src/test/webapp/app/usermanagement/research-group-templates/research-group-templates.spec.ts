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

  function mockGetTemplates(content: EmailTemplateOverviewDTO[] = [], total = 0) {
    api.getTemplates.mockReturnValue(of({ content, totalElements: total }));
  }

  function mockDeleteTemplate(success = true) {
    api.deleteTemplate.mockReturnValue(success ? of({}) : throwError(() => new Error('fail')));
  }

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
      mockGetTemplates(templates, 1);

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
      mockDeleteTemplate(true);
      mockGetTemplates();

      await component.delete('123');

      expect(api.deleteTemplate).toHaveBeenCalledWith('123');
      expect(mockToast.showSuccess).toHaveBeenCalledWith({ detail: 'Successfully deleted template' });
      expect(api.getTemplates).toHaveBeenCalled();
    });

    it('shows error toast if deletion fails but still reloads', async () => {
      mockDeleteTemplate(false);
      mockGetTemplates();

      await component.delete('999');

      expect(mockToast.showError).toHaveBeenCalledWith({ detail: 'Failed to delete template' });
      expect(api.getTemplates).toHaveBeenCalled();
    });
  });

  // ---------------- NAVIGATION ----------------
  describe.each([
    { action: 'navigateToCreate', args: [], expected: ['/research-group/template/new'] },
    { action: 'navigateToEdit', args: ['xyz'], expected: ['/research-group/template', 'xyz', 'edit'] },
  ])('navigation', ({ action, args, expected }) => {
    it(`${action} navigates correctly`, () => {
      (component as any)[action](...args);
      expect(mockRouter.navigate).toHaveBeenCalledWith(expected);
    });
  });

  // ---------------- TABLE DATA ----------------
  describe('tableData mapping', () => {
    it.each([
      {
        desc: 'default template with name',
        templateDto: { templateName: 'welcome', emailType: EmailTemplateOverviewDTO.EmailTypeEnum.ApplicationSent, isDefault: true },
        expectedDisplay: 'researchGroup.emailTemplates.default.APPLICATION_SENT-welcome',
        expectedCreatedBy: 'researchGroup.emailTemplates.systemDefault',
      },
      {
        desc: 'default template without name',
        templateDto: { templateName: undefined, emailType: EmailTemplateOverviewDTO.EmailTypeEnum.ApplicationAccepted, isDefault: true },
        expectedDisplay: 'researchGroup.emailTemplates.default.APPLICATION_ACCEPTED',
        expectedCreatedBy: 'researchGroup.emailTemplates.systemDefault',
      },
      {
        desc: 'non-default template with first/last name',
        templateDto: {
          templateName: 'manual',
          emailType: EmailTemplateOverviewDTO.EmailTypeEnum.ApplicationSent,
          isDefault: false,
          firstName: 'Alice',
          lastName: 'Smith',
        },
        expectedDisplay: undefined, // not asserting display name here
        expectedCreatedBy: 'Alice Smith',
      },
    ])('builds row for $desc', ({ templateDto, expectedDisplay, expectedCreatedBy }) => {
      component['responseData'].set([templateDto as EmailTemplateOverviewDTO]);
      const row = component['tableData']()[0];
      if (expectedDisplay) {
        expect(row.displayName).toContain(expectedDisplay);
      }
      expect(row.createdBy).toContain(expectedCreatedBy);
    });
  });

  // ---------------- TABLE EVENTS ----------------
  describe('onTableEmit()', () => {
    it('handles undefined first/rows by using defaults', () => {
      mockGetTemplates();
      const spy = vi.spyOn(component as any, 'loadPage');
      component.onTableEmit({});

      expect(component['pageNumber']()).toBe(0);
      expect(spy).toHaveBeenCalled();
    });

    it('calculates correct page number from first/rows', () => {
      mockGetTemplates();
      const spy = vi.spyOn(component as any, 'loadPage');
      component.onTableEmit({ first: 20, rows: 10 });

      expect(component['pageNumber']()).toBe(2);
      expect(spy).toHaveBeenCalled();
    });
  });
});
