import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';

import { JobOverviewPageComponent } from 'app/job/job-overview/job-overview-page/job-overview-page.component';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { createRouterMock, provideRouterMock } from 'util/router.mock';

@Component({
  selector: 'jhi-job-card-list',
  template: '<p>Stub Job Card List</p>',
})
class StubJobCardListComponent {}

describe('JobOverviewPageComponent', () => {
  let fixture: ComponentFixture<JobOverviewPageComponent>;
  let nativeElement: HTMLElement;
  let routerMock: ReturnType<typeof createRouterMock>;

  beforeEach(async () => {
    routerMock = createRouterMock();
    const accountServiceMock = createAccountServiceMock();
    accountServiceMock.hasAnyAuthority = (roles: string[]) => roles.includes('PROFESSOR');

    await TestBed.configureTestingModule({
      imports: [JobOverviewPageComponent, StubJobCardListComponent],
      providers: [
        provideTranslateMock(),
        provideHttpClientTesting(),
        provideAccountServiceMock(accountServiceMock),
        provideRouterMock(routerMock),
      ],
    })
      .overrideComponent(JobOverviewPageComponent, {
        set: {
          imports: [StubJobCardListComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(JobOverviewPageComponent);
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should redirect professor user to /professor', () => {
    expect(routerMock.navigate).toHaveBeenCalledWith(['/professor']);
  });

  it('should render the page title with correct translation key', () => {
    const title = nativeElement.querySelector('h1.block');
    expect(title).not.toBeNull();
    expect(title?.getAttribute('jhiTranslate')).toBe('jobOverviewPage.title');
  });

  it('should render the stubbed job card list', () => {
    const jobCardList = nativeElement.querySelector('jhi-job-card-list');
    expect(jobCardList).not.toBeNull();
    expect(jobCardList?.textContent).toContain('Stub Job Card List');
  });
});
