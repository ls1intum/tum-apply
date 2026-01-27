import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { convertToParamMap, ParamMap } from '@angular/router';

import { EmailTemplateResourceApiService } from 'app/generated/api/emailTemplateResourceApi.service';
import { EmailTemplateDTO } from 'app/generated/model/emailTemplateDTO';
import { createRouterMock, provideRouterMock } from 'util/router.mock';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { ResearchGroupTemplateEdit } from 'app/usermanagement/research-group/research-group-template-edit/research-group-template-edit';
import { createActivatedRouteMock, provideActivatedRouteMock } from 'util/activated-route.mock';
import { createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { UserShortDTO } from 'app/generated/model/userShortDTO';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = ResizeObserverMock;
}

class EmailTemplateResourceApiServiceMock {
  createTemplate = vi.fn();
  updateTemplate = vi.fn();
  getTemplate = vi.fn();
}

describe('ResearchGroupTemplateEdit', () => {
  let fixture: ComponentFixture<ResearchGroupTemplateEdit>;
  let component: ResearchGroupTemplateEdit;
  let api: EmailTemplateResourceApiServiceMock;
  let mockToast: ToastServiceMock;
  let paramMapSubject: BehaviorSubject<ParamMap>;
  let mockActivatedRoute: ReturnType<typeof createActivatedRouteMock>;
  let mockAccountService: ReturnType<typeof createAccountServiceMock>;

  const mockRouter = createRouterMock();
  const mockTranslate = createTranslateServiceMock();

  // --- helpers ---
  function mockGetTemplate(dto: EmailTemplateDTO | Error) {
    api.getTemplate.mockReturnValue(dto instanceof Error ? throwError(() => dto) : of(dto));
  }

  function mockCreateTemplate(dto: EmailTemplateDTO | Error | { status: number }) {
    if (dto instanceof Error || (dto && typeof dto === 'object' && 'status' in dto)) {
      api.createTemplate.mockReturnValue(throwError(() => dto));
    } else {
      api.createTemplate.mockReturnValue(of(dto));
    }
  }

  function mockUpdateTemplate(dto: EmailTemplateDTO | Error) {
    api.updateTemplate.mockReturnValue(dto instanceof Error ? throwError(() => dto) : of(dto));
  }

  beforeEach(async () => {
    mockToast = createToastServiceMock();
    mockActivatedRoute = createActivatedRouteMock();
    mockAccountService = createAccountServiceMock();
    mockAccountService.user.set({ id: 'current-user', name: 'Current User', email: 'test@test.com', authorities: [] });

    await TestBed.configureTestingModule({
      imports: [ResearchGroupTemplateEdit],
      providers: [
        { provide: EmailTemplateResourceApiService, useClass: EmailTemplateResourceApiServiceMock },
        provideRouterMock(mockRouter),
        provideToastServiceMock(mockToast),
        provideTranslateMock(mockTranslate),
        provideFontAwesomeTesting(),
        provideActivatedRouteMock(mockActivatedRoute),
        provideAccountServiceMock(mockAccountService),
      ],
    })
      .overrideComponent(ResearchGroupTemplateEdit, {
        remove: { providers: [EmailTemplateResourceApiService] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResearchGroupTemplateEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();

    api = TestBed.inject(EmailTemplateResourceApiService) as unknown as EmailTemplateResourceApiServiceMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fixture?.destroy();
  });

  // ---------------- LOAD ----------------
  describe('load()', () => {
    it('loads and sanitizes template successfully', async () => {
      mockGetTemplate({
        templateName: 'T',
        english: undefined,
        german: undefined,
        isDefault: false,
      } as EmailTemplateDTO);

      await component['load']('id-1');

      expect(api.getTemplate).toHaveBeenCalledWith('id-1');
      expect(component.formModel().english).toEqual({ subject: '', body: '' });
      expect(component.savingState()).toBe('SAVED');
    });

    it('shows error toast if loading fails', async () => {
      mockGetTemplate(new Error('fail'));
      await component['load']('id-err');
      expect(mockToast.showError).toHaveBeenCalledWith({ detail: 'Failed to load template' });
    });
  });

  // ---------------- AUTOSAVE ----------------
  describe('performAutoSave()', () => {
    const baseDto: EmailTemplateDTO = {
      templateName: 'X',
      emailType: 'APPLICATION_ACCEPTED',
      isDefault: false,
      english: { subject: '', body: '' },
      german: { subject: '', body: '' },
    };

    it('creates new template if id is missing', async () => {
      component.formModel.set(baseDto);
      mockCreateTemplate({ ...baseDto, emailTemplateId: 'new-1' });

      await component['performAutoSave']();

      expect(api.createTemplate).toHaveBeenCalled();
      expect(component.formModel().emailTemplateId).toBe('new-1');
      expect(component.savingState()).toBe('SAVED');
    });

    it('updates template if id exists', async () => {
      const dto = { ...baseDto, emailTemplateId: 'x1' };
      component.formModel.set(dto);
      mockUpdateTemplate(dto);

      await component['performAutoSave']();
      expect(api.updateTemplate).toHaveBeenCalledWith(dto);
    });

    it.each([
      { err: { status: 409 }, expectedToast: 'Template name already exists.' },
      { err: new Error('fail'), expectedToast: 'Autosave failed' },
    ])('handles error: $expectedToast', async ({ err, expectedToast }) => {
      component.formModel.set(baseDto);
      mockCreateTemplate(err as Error);

      await component['performAutoSave']();

      expect(mockToast.showError).toHaveBeenCalledWith({ detail: expectedToast });
    });

    it('does not save if non-default and missing name/type', async () => {
      component.formModel.set({ ...baseDto, templateName: '', emailType: undefined });
      await component['performAutoSave']();
      expect(component.savingState()).toBe('SAVED');
    });

    it('does not autosave for employees', () => {
      mockAccountService.user.update(u => (u ? { ...u, authorities: [UserShortDTO.RolesEnum.Employee] } : u));
      component.formModel.set({
        templateName: 'Valid',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: { subject: '', body: '' },
        german: { subject: '', body: '' },
      });
      fixture.detectChanges();
      expect(component.savingState()).toBe('UNSAVED');
      expect(component['autoSaveTimer']).toBeUndefined();
    });
  });

  // ---------------- FORM UPDATES ----------------
  describe('form updates', () => {
    const getters: Record<string, (m: EmailTemplateDTO) => unknown> = {
      templateName: m => m.templateName,
      'english.subject': m => m.english?.subject,
      'english.body': m => m.english?.body,
      'german.subject': m => m.german?.subject,
      'german.body': m => m.german?.body,
    };

    it.each([
      { action: 'setTemplateName', value: 'Hello', path: 'templateName' },
      { action: 'updateEnglishSubject', value: 'Subj', path: 'english.subject' },
      { action: 'updateEnglishBody', value: 'Body EN', path: 'english.body' },
      { action: 'updateGermanSubject', value: 'Subj DE', path: 'german.subject' },
      { action: 'updateGermanBody', value: 'Body DE', path: 'german.body' },
    ])('$action updates form model', ({ action, value, path }) => {
      (component as unknown as Record<string, (val: string) => void>)[action](value);
      const actual = getters[path](component.formModel());
      expect(actual).toBe(value);
    });

    it('updates email type via setSelectedEmailType', () => {
      component.setSelectedEmailType({
        name: 'x',
        value: EmailTemplateDTO.EmailTypeEnum.ApplicationRejected,
      });
      expect(component.formModel().emailType).toBe(EmailTemplateDTO.EmailTypeEnum.ApplicationRejected);
    });

    it.each([
      { field: 'english', getter: () => component.english() },
      { field: 'german', getter: () => component.german() },
    ])('$field computed falls back to empty when null', ({ getter }) => {
      component.formModel.set({
        templateName: 'X',
        emailType: EmailTemplateDTO.EmailTypeEnum.ApplicationAccepted,
        isDefault: false,
        english: undefined,
        german: undefined,
      });
      expect(getter()).toEqual({ subject: '', body: '' });
    });
  });

  // ---------------- DISPLAY NAME ----------------
  describe.each([
    {
      name: 'with name',
      templateName: 'welcome',
      emailType: EmailTemplateDTO.EmailTypeEnum.ApplicationAccepted,
      expected: 'researchGroup.emailTemplates.default.APPLICATION_ACCEPTED-welcome',
    },
    {
      name: 'without name',
      templateName: undefined,
      emailType: EmailTemplateDTO.EmailTypeEnum.ApplicationSent,
      expected: 'researchGroup.emailTemplates.default.APPLICATION_SENT',
    },
  ])('templateDisplayName', ({ name, templateName, emailType, expected }) => {
    it(`returns translated key for default ${name}`, () => {
      component.formModel.update(prev => ({ ...prev, isDefault: true, templateName, emailType }));
      expect(component.templateDisplayName()).toContain(expected);
    });
  });

  // ---------------- SELECT OPTIONS ----------------
  describe('selectOptions / preselectedEmailType', () => {
    it('provides options for default template', () => {
      component.formModel.update(prev => ({ ...prev, isDefault: true }));
      expect(component.selectOptions().length).toBeGreaterThan(1);
    });

    it('returns preselected option matching current emailType', () => {
      component.formModel.update(prev => ({ ...prev, emailType: 'APPLICATION_ACCEPTED' }));
      expect(component.preselectedEmailType()!.value).toBe('APPLICATION_ACCEPTED');
    });
  });

  // ---------------- TRANSLATION ----------------
  describe('translateMentionsInTemplate()', () => {
    it.each([
      {
        name: 'replaces mention labels with translations',
        html: `<span class="mention" data-id="APPLICANT_FIRST_NAME"><span>$Old</span></span>`,
        expectedContent: 'researchGroup.emailTemplates.variables.APPLICANT_FIRST_NAME',
      },
      {
        name: 'updates inner span when contenteditable="false" is present',
        html: `<span class="mention" data-id="APPLICANT_FIRST_NAME"><span contenteditable="false">$Old</span></span>`,
        expectedContent: 'ql-mention-denotation-char',
      },
      {
        name: 'skips mentions without id',
        html: `<span class="mention"></span>`,
        expectedContent: '<span class="mention"></span>',
      },
    ])('$name', ({ html, expectedContent }) => {
      const dto: EmailTemplateDTO = {
        templateName: 'T',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: { subject: '', body: html },
        german: { subject: '', body: html },
      };
      const translated = component['translateMentionsInTemplate'](dto);
      expect(translated.english!.body).toContain(expectedContent);
    });

    it.each([
      { field: 'english', getter: (dto: EmailTemplateDTO) => dto.english!.body },
      { field: 'german', getter: (dto: EmailTemplateDTO) => dto.german!.body },
    ])('handles undefined $field safely', ({ getter }) => {
      const dto: EmailTemplateDTO = {
        templateName: 'T',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: undefined,
        german: undefined,
      };
      const translated = component['translateMentionsInTemplate'](dto);
      expect(getter(translated)).toBe('');
    });
  });

  // ---------------- EFFECTS ----------------
  describe('effects', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it.each([
      {
        name: 'early returns when non-default and missing name/type',
        formModel: {
          templateName: '',
          emailType: undefined,
          isDefault: false,
          english: { subject: '', body: '' },
          german: { subject: '', body: '' },
        },
        expectedState: 'UNSAVED',
        expectTimer: false,
      },
      {
        name: 'sets SAVING and schedules autosave when valid form',
        formModel: {
          templateName: 'Valid',
          emailType: 'APPLICATION_ACCEPTED' as const,
          isDefault: false,
          english: { subject: '', body: '' },
          german: { subject: '', body: '' },
        },
        expectedState: 'SAVING',
        expectTimer: true,
      },
    ])('$name', ({ formModel, expectedState, expectTimer }) => {
      component.formModel.set(formModel);
      fixture.detectChanges();
      expect(component.savingState()).toBe(expectedState);
      if (expectTimer) {
        expect(component['autoSaveTimer']).toBeDefined();
      } else {
        expect(component['autoSaveTimer']).toBeUndefined();
      }
    });

    it('calls performAutoSave after 3s', () => {
      const spy = vi.spyOn(component as unknown as { performAutoSave: () => Promise<void> }, 'performAutoSave');
      component.formModel.set({
        templateName: 'AutoSave',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: { subject: '', body: '' },
        german: { subject: '', body: '' },
      });
      fixture.detectChanges();
      vi.advanceTimersByTime(3000);
      expect(spy).toHaveBeenCalled();
    });

    it.each([
      { name: 'does not call load when templateId is null', paramMap: {}, expectLoad: false },
      { name: 'calls load when templateId is provided', paramMap: { templateId: '123' }, expectLoad: true },
    ])('$name', ({ paramMap, expectLoad }) => {
      const spy = vi.spyOn(component as unknown as { load: (id: string) => Promise<void> }, 'load').mockResolvedValue(undefined);
      mockActivatedRoute.paramMapSubject.next(convertToParamMap(paramMap));
      fixture.detectChanges();
      if (expectLoad) {
        expect(spy).toHaveBeenCalledWith('123');
      } else {
        expect(spy).not.toHaveBeenCalled();
      }
    });
  });

  // ---------------- MENTION SOURCE ----------------
  describe('mention source', () => {
    it('returns all items when no search term', () => {
      const renderList = vi.fn();
      component.modules.mention.source('', renderList);
      expect(renderList).toHaveBeenCalled();
    });

    it('filters items by search term', () => {
      const renderList = vi.fn();
      component.modules.mention.source('name', renderList);
      const [matches] = renderList.mock.calls[0];
      expect(matches.every((m: { value: string }) => m.value.toLowerCase().includes('name'))).toBe(true);
    });
  });

  // ---------------- BEFORE UNLOAD ----------------
  describe('beforeUnloadHandler', () => {
    it('calls performAutoSave if unsaved changes exist', async () => {
      const spy = vi.spyOn(component as unknown as { performAutoSave: () => Promise<void> }, 'performAutoSave');
      component.lastSavedSnapshot.set({ ...component.formModel() });
      component.formModel.update(prev => ({ ...prev, templateName: 'Changed' }));
      component.beforeUnloadHandler();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ---------------- UTILS ----------------
  describe('clearAutoSaveTimer', () => {
    it('clears existing autosave timer', () => {
      component['autoSaveTimer'] = setTimeout(() => {}, 1000) as unknown as number;
      component['clearAutoSaveTimer']();
      expect(component['autoSaveTimer']).toBeUndefined();
    });
  });
});
