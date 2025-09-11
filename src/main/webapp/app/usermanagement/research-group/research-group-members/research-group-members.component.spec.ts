import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ResearchGroupResourceService } from '../../../generated/api/researchGroupResource.service';
import { ToastService } from '../../../service/toast-service';
import { AccountService } from '../../../core/auth/account.service';

import { ResearchGroupMembersComponent } from './research-group-members.component';

describe('ResearchGroupMembers', () => {
  let component: ResearchGroupMembersComponent;
  let fixture: ComponentFixture<ResearchGroupMembersComponent>;

  beforeEach(async () => {
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
      imports: [ResearchGroupMembersComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ResearchGroupResourceService, useValue: mockResearchGroupService },
        { provide: ToastService, useValue: mockToastService },
        { provide: AccountService, useValue: mockAccountService },
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
