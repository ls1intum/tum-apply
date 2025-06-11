import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { of } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { ApplicationEvaluationOverviewDTO, ApplicationEvaluationResourceService } from '../../../../generated';

import { ApplicationCarouselComponent } from './application-carousel.component';

@Component({
  selector: 'jhi-application-card',
  standalone: true,
  template: '<ng-content />',
})
class StubApplicationCardComponent {
  @Input() application!: ApplicationEvaluationOverviewDTO | null;
  @Input() disabled = false;
  @Input() placeholder = false;
}

@Component({
  selector: 'jhi-button',
  standalone: true,
  template: '<ng-content />',
})
class StubButtonComponent {
  @Input() disabled = false;
}

class MockBreakpointObserver {
  observe = jest.fn().mockReturnValue(
    of({
      breakpoints: {
        [Breakpoints.Handset]: false,
        '(min-width: 1920px)': false,
      },
    }),
  );
}

const makeMockApps = (n = 10): ApplicationEvaluationOverviewDTO[] =>
  Array.from({ length: n }).map((_, i) => ({
    id: `id-${i}`,
    title: `Application ${i}`,
  })) as ApplicationEvaluationOverviewDTO[];

describe('ApplicationCarouselComponent', () => {
  let fixture: ComponentFixture<ApplicationCarouselComponent>;
  let component: ApplicationCarouselComponent;
  const allApps = makeMockApps(10);
  let library: FaIconLibrary;

  let mockService: jest.Mocked<ApplicationEvaluationResourceService>;

  beforeEach(async () => {
    mockService = {
      getApplications: jest.fn((offset: number, limit: number) =>
        of({
          totalRecords: allApps.length,
          applications: allApps.slice(offset, offset + limit),
        }),
      ),
    } as unknown as jest.Mocked<ApplicationEvaluationResourceService>;

    await TestBed.configureTestingModule({
      imports: [
        ApplicationCarouselComponent,
        StubApplicationCardComponent,
        StubButtonComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader },
        }),
      ],
      providers: [
        { provide: BreakpointObserver, useClass: MockBreakpointObserver },
        { provide: ApplicationEvaluationResourceService, useValue: mockService },
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCarouselComponent);
    component = fixture.componentInstance;

    library = TestBed.inject(FaIconLibrary);
    library.addIcons(faChevronRight, faChevronLeft);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the first page on init', fakeAsync(() => {
    tick();
    flush();
    fixture.detectChanges();
    expect(mockService.getApplications).toHaveBeenCalledWith(0, component.half + 1, component.sortBy(), component.sortDirection());
    flush();
  }));

  it('next() advances indices and never exceeds totalCount', fakeAsync(() => {
    tick();
    flush();

    const initialCurrent = component.currentIndex();
    const initialWindow = component.windowIndex();
    component.totalCount.set(5);
    component.next();
    tick();
    tick(0);

    expect(component.currentIndex()).toBe(initialCurrent + 1);
    expect(component.windowIndex()).toBe(initialWindow + 1);

    while (component.currentIndex() < component.totalCount() - 1) {
      component.next();
    }

    const lastIndex = component.totalCount() - 1;
    expect(component.currentIndex()).toBe(lastIndex);

    component.next();
    expect(component.currentIndex()).toBe(lastIndex);
    flush();
  }));

  it('prev() decrements indices and never goes below 0', fakeAsync(() => {
    tick();
    tick(0);

    component.next();
    tick();
    tick(0);

    component.prev();
    tick();
    tick(0);

    expect(component.currentIndex()).toBe(0);
    expect(component.windowIndex()).toBe(0);

    component.prev();
    expect(component.currentIndex()).toBe(0);
    flush();
  }));

  it('prev() moves indices backward when starting from the end and never goes below 0', fakeAsync(() => {
    tick();
    flush();

    component.totalCount.set(5);
    const last = component.totalCount() - 1;
    component.currentIndex.set(last);
    component.windowIndex.set(last);

    component.prev();
    tick();
    flush();
    expect(component.currentIndex()).toBe(last - 1);
    expect(component.windowIndex()).toBe(last - 1);

    while (component.currentIndex() > 0) {
      component.prev();
    }
    expect(component.currentIndex()).toBe(0);
    expect(component.windowIndex()).toBe(0);

    component.prev();
    expect(component.currentIndex()).toBe(0);
    expect(component.windowIndex()).toBe(0);
  }));

  it('responds to keyboard arrow keys', fakeAsync(() => {
    tick();
    tick(0);

    component.totalCount.set(7);

    const eventRight = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    document.dispatchEvent(eventRight);
    expect(component.currentIndex()).toBe(1);

    const eventLeft = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    document.dispatchEvent(eventLeft);
    tick();
    expect(component.currentIndex()).toBe(0);
    flush();
  }));

  it('visibleApps always has cardsVisible() slots, padded with nulls', fakeAsync(() => {
    tick();
    tick(0);

    const arr = component.visibleApps();
    expect(arr.length).toBe(component.cardsVisible());

    expect(arr[0]).toBeNull();
    flush();
  }));
});
