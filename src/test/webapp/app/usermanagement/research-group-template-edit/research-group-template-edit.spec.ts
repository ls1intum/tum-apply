import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { EmailTemplateResourceApiService } from 'app/generated/api/emailTemplateResourceApi.service';
import { EmailTemplateDTO } from 'app/generated/model/emailTemplateDTO';
import { createRouterMock, provideRouterMock } from '../../../util/router.mock';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from '../../../util/toast-service.mock';
import { createTranslateServiceMock, provideTranslateMock } from '../../../util/translate.mock';
import { provideFontAwesomeTesting } from '../../../util/fontawesome.testing';
import { ResearchGroupTemplateEdit } from 'app/usermanagement/research-group/research-group-template-edit/research-group-template-edit';

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

  const mockRouter = createRouterMock();
  const mockTranslate = createTranslateServiceMock();

  let paramMapSubject: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    mockToast = createToastServiceMock();
    paramMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [ResearchGroupTemplateEdit],
      providers: [
        { provide: EmailTemplateResourceApiService, useClass: EmailTemplateResourceApiServiceMock },
        provideRouterMock(mockRouter),
        provideToastServiceMock(mockToast),
        provideTranslateMock(mockTranslate),
        provideFontAwesomeTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
          },
        },
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
      const dto: EmailTemplateDTO = {
        templateName: 'T',
        english: null as unknown as { subject: string; body: string },
        german: null as unknown as { subject: string; body: string },
        isDefault: false,
      };
      api.getTemplate.mockReturnValueOnce(of(dto));

      await component['load']('id-1');

      expect(api.getTemplate).toHaveBeenCalledWith('id-1');
      expect(component.formModel().english).toEqual({ subject: '', body: '' });
      expect(component.savingState()).toBe('SAVED');
    });

    it('shows error toast if loading fails', async () => {
      api.getTemplate.mockReturnValueOnce(throwError(() => new Error('fail')));

      await component['load']('id-err');

      expect(mockToast.showError).toHaveBeenCalledWith({ detail: 'Failed to load template' });
    });
  });

  // ---------------- AUTOSAVE ----------------
  describe('performAutoSave()', () => {
    it('creates new template if id is missing', async () => {
      const dto: EmailTemplateDTO = {
        templateName: 'New',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: { subject: '', body: '' },
        german: { subject: '', body: '' },
      };
      component.formModel.set(dto);
      api.createTemplate.mockReturnValueOnce(of({ ...dto, emailTemplateId: 'new-1' }));

      await component['performAutoSave']();

      expect(api.createTemplate).toHaveBeenCalledWith(dto);
      expect(component.formModel().emailTemplateId).toBe('new-1');
      expect(component.savingState()).toBe('SAVED');
    });

    it('updates template if id exists', async () => {
      const dto: EmailTemplateDTO = {
        emailTemplateId: 'x1',
        templateName: 'Upd',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: { subject: '', body: '' },
        german: { subject: '', body: '' },
      };
      component.formModel.set(dto);
      api.updateTemplate.mockReturnValueOnce(of(dto));

      await component['performAutoSave']();

      expect(api.updateTemplate).toHaveBeenCalledWith(dto);
      expect(component.savingState()).toBe('SAVED');
    });

    it('handles conflict error (409) with specific toast', async () => {
      const dto: EmailTemplateDTO = {
        templateName: 'Dup',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: { subject: '', body: '' },
        german: { subject: '', body: '' },
      };
      component.formModel.set(dto);
      api.createTemplate.mockReturnValueOnce(throwError(() => ({ status: 409 })));

      await component['performAutoSave']();

      expect(mockToast.showError).toHaveBeenCalledWith({ detail: 'Template name already exists.' });
      expect(component.savingState()).toBe('UNSAVED');
    });

    it('handles generic error with autosave failed toast', async () => {
      const dto: EmailTemplateDTO = {
        templateName: 'Err',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: { subject: '', body: '' },
        german: { subject: '', body: '' },
      };
      component.formModel.set(dto);
      api.createTemplate.mockReturnValueOnce(throwError(() => new Error('fail')));

      await component['performAutoSave']();

      expect(mockToast.showError).toHaveBeenCalledWith({ detail: 'Autosave failed' });
    });

    it('does not save if non-default and missing name/type', async () => {
      component.formModel.set({
        templateName: '',
        emailType: undefined,
        isDefault: false,
        english: { subject: '', body: '' },
        german: { subject: '', body: '' },
      });
      await component['performAutoSave']();
      expect(component.savingState()).toBe('SAVED');
    });
  });

  // ---------------- NAVIGATION ----------------
  describe('navigation', () => {
    it('navigates back to template list', () => {
      component['navigateBack']();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/research-group/templates']);
    });
  });

  // ---------------- FORM UPDATES ----------------
  describe('form updates', () => {
    it('updates template name', () => {
      component.setTemplateName('Hello');
      expect(component.formModel().templateName).toBe('Hello');
    });

    it('updates english subject', () => {
      component.updateEnglishSubject('Subj');
      expect(component.formModel().english!.subject).toBe('Subj');
    });

    it('updates english body', () => {
      component.updateEnglishBody('Body EN');
      expect(component.formModel().english!.body).toBe('Body EN');
    });

    it('updates german subject', () => {
      component.updateGermanSubject('Subj DE');
      expect(component.formModel().german!.subject).toBe('Subj DE');
    });

    it('updates german body', () => {
      component.updateGermanBody('Body DE');
      expect(component.formModel().german!.body).toBe('Body DE');
    });

    it('updates email type via setSelectedEmailType', () => {
      component.setSelectedEmailType({ name: 'x', value: 'APPLICATION_REJECTED' });
      expect(component.formModel().emailType).toBe('APPLICATION_REJECTED');
    });

    it('english/german computed fall back to empty when null', () => {
      component.formModel.set({
        templateName: 'X',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: undefined,
        german: undefined,
      });
      expect(component.english()).toEqual({ subject: '', body: '' });
      expect(component.german()).toEqual({ subject: '', body: '' });
    });
  });

  // ---------------- DISPLAY NAME ----------------
  describe('templateDisplayName', () => {
    it('returns translated key for default with name', () => {
      component.formModel.update(prev => ({
        ...prev,
        isDefault: true,
        templateName: 'welcome',
        emailType: 'APPLICATION_ACCEPTED',
      }));
      expect(component.templateDisplayName()).toContain('researchGroup.emailTemplates.default.APPLICATION_ACCEPTED-welcome');
    });

    it('returns translated key for default without name', () => {
      component.formModel.update(prev => ({
        ...prev,
        isDefault: true,
        templateName: undefined,
        emailType: 'APPLICATION_SENT',
      }));
      expect(component.templateDisplayName()).toContain('researchGroup.emailTemplates.default.APPLICATION_SENT');
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
    it('replaces mention labels with translations', () => {
      const html = `<p><span class="mention" data-id="APPLICANT_FIRST_NAME" data-value="Old"><span contenteditable="false">$Old</span></span></p>`;
      const dto: EmailTemplateDTO = {
        templateName: 'T',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: { subject: '', body: html },
        german: { subject: '', body: html },
      };

      const translated = component['translateMentionsInTemplate'](dto);

      expect(translated.english!.body).toContain('researchGroup.emailTemplates.variables.APPLICANT_FIRST_NAME');
    });

    it('skips mentions without id', () => {
      const html = `<p><span class="mention"></span></p>`;
      const dto: EmailTemplateDTO = {
        templateName: 'T',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: { subject: '', body: html },
        german: { subject: '', body: html },
      };
      const translated = component['translateMentionsInTemplate'](dto);
      expect(translated.english!.body).toContain('<span class="mention"></span>');
    });

    it('handles undefined english/german safely', () => {
      const dto: EmailTemplateDTO = {
        templateName: 'T',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: undefined,
        german: undefined,
      };
      const translated = component['translateMentionsInTemplate'](dto);
      expect(translated.english!.body).toBe('');
      expect(translated.german!.body).toBe('');
    });
  });

  // ---------------- EFFECTS ----------------
  describe('effects', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('early returns when non-default and missing name/type', () => {
      component.formModel.set({
        templateName: '',
        emailType: undefined,
        isDefault: false,
        english: { subject: '', body: '' },
        german: { subject: '', body: '' },
      });

      fixture.detectChanges();

      expect(component.savingState()).toBe('UNSAVED');
      expect(component['autoSaveTimer']).toBeUndefined();
    });

    it('sets SAVING and schedules autosave when valid form', () => {
      component.formModel.set({
        templateName: 'Valid',
        emailType: 'APPLICATION_ACCEPTED',
        isDefault: false,
        english: { subject: '', body: '' },
        german: { subject: '', body: '' },
      });

      fixture.detectChanges();

      expect(component.savingState()).toBe('SAVING');
      expect(component['autoSaveTimer']).toBeDefined();
    });

    it('calls performAutoSave after 3s', () => {
      const spy = vi.spyOn(component as unknown as Record<string, any>, 'performAutoSave').mockResolvedValue(undefined);

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

    it('does not call load when templateId is null', () => {
      const spy = vi.spyOn(component as unknown as Record<string, any>, 'load');
      paramMapSubject.next(convertToParamMap({}));
      fixture.detectChanges();
      expect(spy).not.toHaveBeenCalled();
    });

    it('calls load when templateId is provided', () => {
      const spy = vi.spyOn(component as unknown as Record<string, any>, 'load').mockResolvedValue(undefined);
      paramMapSubject.next(convertToParamMap({ templateId: '123' }));
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledWith('123');
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
      const spy = vi.spyOn(component as unknown as Record<string, any>, 'performAutoSave').mockResolvedValue(undefined);
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
