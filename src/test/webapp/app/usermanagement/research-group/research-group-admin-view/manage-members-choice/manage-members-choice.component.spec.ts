import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideDialogServiceMock, createDialogServiceMock } from 'src/test/webapp/util/dialog.service.mock';
import { provideDynamicDialogConfigMock, createDynamicDialogConfigMock } from 'src/test/webapp/util/dynamicdialogref.mock';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { ManageMembersChoiceComponent } from 'app/usermanagement/research-group/research-group-admin-view/manage-members-choice/manage-members-choice.component';
import { ResearchGroupRemoveMembersComponent } from 'app/usermanagement/research-group/research-group-admin-view/research-group-remove-members/research-group-remove-members.component';
import { ResearchGroupAddMembersComponent } from 'app/usermanagement/research-group/research-group-add-members/research-group-add-members.component';

describe('ManageMembersChoiceComponent', () => {
  let component: ManageMembersChoiceComponent;
  let fixture: ComponentFixture<ManageMembersChoiceComponent>;
  let mockDialogService: ReturnType<typeof createDialogServiceMock>;

  beforeEach(async () => {
    mockDialogService = createDialogServiceMock();

    await TestBed.configureTestingModule({
      imports: [ManageMembersChoiceComponent],
      providers: [
        provideDialogServiceMock(mockDialogService),
        provideDynamicDialogConfigMock(createDynamicDialogConfigMock({ researchGroupId: 'rg-123' })),
        provideTranslateMock(),
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
    it('should disable remove button when hasMembers is false', () => {
      component.hasMembers.set(false);
      fixture.detectChanges();
      expect(component.hasMembers()).toBe(false);
    });

    it('should disable add button when canAddMembers is false', () => {
      component.canAddMembers.set(false);
      fixture.detectChanges();
      expect(component.canAddMembers()).toBe(false);
    });
  });
});
