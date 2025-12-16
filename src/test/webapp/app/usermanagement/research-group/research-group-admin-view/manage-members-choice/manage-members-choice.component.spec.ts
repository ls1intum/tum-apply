import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideDialogServiceMock, createDialogServiceMock } from 'src/test/webapp/util/dialog.service.mock';
import {
  createResearchGroupResourceApiServiceMock,
  provideResearchGroupResourceApiServiceMock,
} from 'src/test/webapp/util/research-group-resource-api.service.mock';
import { provideDynamicDialogConfigMock, createDynamicDialogConfigMock } from 'src/test/webapp/util/dynamicdialogref.mock';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { ManageMembersChoiceComponent } from 'app/usermanagement/research-group/research-group-admin-view/manage-members-choice/manage-members-choice.component';
import { ResearchGroupRemoveMembersComponent } from 'app/usermanagement/research-group/research-group-admin-view/research-group-remove-members/research-group-remove-members.component';
import { ResearchGroupAddMembersComponent } from 'app/usermanagement/research-group/research-group-add-members/research-group-add-members.component';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

describe('ManageMembersChoiceComponent', () => {
  let component: ManageMembersChoiceComponent;
  let fixture: ComponentFixture<ManageMembersChoiceComponent>;
  let mockDialogService: ReturnType<typeof createDialogServiceMock>;
  let mockResearchGroupService: ReturnType<typeof createResearchGroupResourceApiServiceMock>;

  beforeEach(async () => {
    mockDialogService = createDialogServiceMock();
    mockResearchGroupService = createResearchGroupResourceApiServiceMock();
    mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of({ content: [], totalElements: 0 }));

    await TestBed.configureTestingModule({
      imports: [ManageMembersChoiceComponent],
      providers: [
        provideDialogServiceMock(mockDialogService),
        provideDynamicDialogConfigMock(createDynamicDialogConfigMock({ researchGroupId: 'rg-123' })),
        provideTranslateMock(),
        provideResearchGroupResourceApiServiceMock(mockResearchGroupService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageMembersChoiceComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Properties', () => {
    it('should compute researchGroupId from dialog config', () => {
      expect(component.researchGroupId()).toBe('rg-123');
    });
  });

  describe('Dialog Operations', () => {
    it('should open remove members dialog with proper config', () => {
      component.openRemoveMembersDialog();
      expect(mockDialogService.open).toHaveBeenCalledWith(
        ResearchGroupRemoveMembersComponent,
        expect.objectContaining({ data: { researchGroupId: 'rg-123' } }),
      );
    });

    it('should open add members dialog with proper config', () => {
      component.openAddMembersDialog();
      expect(mockDialogService.open).toHaveBeenCalledWith(
        ResearchGroupAddMembersComponent,
        expect.objectContaining({ data: { researchGroupId: 'rg-123' } }),
      );
    });
  });

  describe('Button States', () => {
    it('should disable remove button when research group has no members', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of({ content: [], totalElements: 0 }));
      // re-create component to trigger constructor and loadHasMembers
      fixture = TestBed.createComponent(ManageMembersChoiceComponent);
      component = fixture.componentInstance;
      // allow async load
      await Promise.resolve();
      expect(component.hasMembers()).toBe(false);
    });

    it('should enable remove button when research group has members', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of({ content: [{ userId: 'u-1' }], totalElements: 1 }));
      // re-create component to trigger constructor and loadHasMembers
      fixture = TestBed.createComponent(ManageMembersChoiceComponent);
      component = fixture.componentInstance;
      // allow async load
      await Promise.resolve();
      expect(component.hasMembers()).toBe(true);
    });

    it('should disable add button when canAddMembers is false', () => {
      component.canAddMembers.set(false);
      fixture.detectChanges();
      expect(component.canAddMembers()).toBe(false);
    });

    it('should set hasMembers false when no researchGroupId provided', async () => {
      const dynConfig = TestBed.inject(DynamicDialogConfig) as DynamicDialogConfig;
      dynConfig.data = undefined;
      fixture = TestBed.createComponent(ManageMembersChoiceComponent);
      component = fixture.componentInstance;
      await Promise.resolve();
      expect(component.hasMembers()).toBe(false);
      dynConfig.data = createDynamicDialogConfigMock({ researchGroupId: 'rg-123' }).data;
    });

    it('should set hasMembers false when totalElements is undefined', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of({ content: [{ userId: 'u-1' }] } as any));
      // re-create component to trigger constructor and loadHasMembers
      fixture = TestBed.createComponent(ManageMembersChoiceComponent);
      component = fixture.componentInstance;
      await Promise.resolve();
      expect(component.hasMembers()).toBe(false);
    });

    it('should set hasMembers false when API throws during loadHasMembers', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(throwError(() => new Error('API Error')));
      fixture = TestBed.createComponent(ManageMembersChoiceComponent);
      component = fixture.componentInstance;
      await Promise.resolve();
      expect(component.hasMembers()).toBe(false);
    });
  });
});
