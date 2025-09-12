import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';

import { AccountService } from '../../../core/auth/account.service';
import { ResearchGroupResourceService } from '../../../generated/api/researchGroupResource.service';
import { UserShortDTO } from '../../../generated/model/userShortDTO';
import { ToastService } from '../../../service/toast-service';

import { ResearchGroupMembersComponent } from './research-group-members.component';

const mockMembers: UserShortDTO[] = [
  {
    userId: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@tum.de',
    roles: ['PROFESSOR'],
  },
];

class MockResearchGroupResourceService {
  getResearchGroupMembers = jest.fn().mockReturnValue(
    of({
      content: mockMembers,
      totalElements: 1,
    }),
  );

  removeMemberFromResearchGroup = jest.fn().mockReturnValue(of({}));
}

class MockToastService {
  showSuccess = jest.fn();
  showError = jest.fn();
}

class MockAccountService {
  userId = 'current-user';
}

class MockTranslateService {
  instant = jest.fn().mockReturnValue('Translated text');
  get = jest.fn().mockReturnValue(of('Translated text'));
}

describe('ResearchGroupMembersComponent', () => {
  let component: ResearchGroupMembersComponent;
  let fixture: ComponentFixture<ResearchGroupMembersComponent>;
  let mockResearchGroupService: MockResearchGroupResourceService;
  let mockToastService: MockToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResearchGroupMembersComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ResearchGroupResourceService, useClass: MockResearchGroupResourceService },
        { provide: ToastService, useClass: MockToastService },
        { provide: AccountService, useClass: MockAccountService },
        { provide: TranslateService, useClass: MockTranslateService },
        MessageService,
      ],
    }).compileComponents();

    mockResearchGroupService = TestBed.inject(ResearchGroupResourceService) as unknown as MockResearchGroupResourceService;
    mockToastService = TestBed.inject(ToastService) as unknown as MockToastService;

    fixture = TestBed.createComponent(ResearchGroupMembersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.members()).toEqual([]);
    expect(component.pageNumber()).toBe(0);
    expect(component.pageSize()).toBe(10);
    expect(component.total()).toBe(0);
  });

  it('should set pagination on table emit', () => {
    const event: TableLazyLoadEvent = { first: 10, rows: 5 };

    component.loadOnTableEmit(event);

    expect(component.pageNumber()).toBe(2);
  });

  it('should load members successfully', async () => {
    await component.loadMembers();

    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(10, 0);
    expect(component.members()).toEqual(mockMembers);
    expect(component.total()).toBe(1);
  });

  it('should remove member successfully', async () => {
    const member = mockMembers[0];

    await component.removeMember(member);

    expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledWith('user1');
    expect(mockToastService.showSuccess).toHaveBeenCalled();
  });

  it('should handle member removal error', async () => {
    const member = mockMembers[0];
    mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(throwError(() => new Error('Remove failed')));

    await component.removeMember(member);

    expect(mockToastService.showError).toHaveBeenCalled();
  });
});
