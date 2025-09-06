import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ResearchGroupResourceService } from '../../../generated/api/researchGroupResource.service';
import { ToastService } from '../../../service/toast-service';
import { AccountService } from '../../../core/auth/account.service';

import { ResearchGroupMembersComponent } from './research-group-members.component';

// Mock the services at the module level
jest.mock('../../../generated/api/researchGroupResource.service');
jest.mock('../../../service/toast-service');
jest.mock('../../../core/auth/account.service');

describe('ResearchGroupMembers', () => {
  let component: ResearchGroupMembersComponent;
  let fixture: ComponentFixture<ResearchGroupMembersComponent>;

  beforeEach(async () => {
    // Mock the service methods
    const mockResearchGroupService = {
      getResearchGroupMembers: jest.fn().mockReturnValue(of([])),
    };
    const mockToastService = {
      showError: jest.fn(),
      showInfo: jest.fn(),
    };
    const mockAccountService = {
      userId: 'test-user-id',
    };

    await TestBed.configureTestingModule({
      imports: [ResearchGroupMembersComponent, TranslateModule.forRoot(), FontAwesomeModule],
      providers: [
        { provide: ResearchGroupResourceService, useValue: mockResearchGroupService },
        { provide: ToastService, useValue: mockToastService },
        { provide: AccountService, useValue: mockAccountService },
      ],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIconPacks(fas);

    fixture = TestBed.createComponent(ResearchGroupMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
