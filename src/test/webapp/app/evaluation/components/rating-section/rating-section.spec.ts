import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { RatingSection } from 'app/shared/components/molecules/rating-section/rating-section';
import { RatingResourceApiService } from 'app/generated/api/ratingResourceApi.service';
import { RatingOverviewDTO } from 'app/generated/model/ratingOverviewDTO';
import { createToastServiceMock, provideToastServiceMock } from '../../../../util/toast-service.mock';
import { provideAccountServiceMock } from '../../../../util/account.service.mock';

describe('RatingSection', () => {
  let fixture: ComponentFixture<RatingSection>;
  let component: RatingSection;

  let mockRatingApi: {
    getRatings: ReturnType<typeof vi.fn>;
    updateRating: ReturnType<typeof vi.fn>;
  };
  let mockToast = createToastServiceMock();

  beforeEach(async () => {
    mockRatingApi = {
      getRatings: vi.fn(),
      updateRating: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RatingSection],
      providers: [
        { provide: RatingResourceApiService, useValue: mockRatingApi },
        provideToastServiceMock(mockToast),
        provideAccountServiceMock(),
      ],
    })
      .overrideComponent(RatingSection, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(RatingSection);
    component = fixture.componentInstance;
  });

  // ---------------- INIT ----------------
  describe('Initialization & Creation', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should not call loadRatings when applicationId is undefined', async () => {
      fixture.componentRef.setInput('applicationId', undefined);
      fixture.detectChanges();
      await Promise.resolve();
      expect(mockRatingApi.getRatings).not.toHaveBeenCalled();
    });
  });

  // ---------------- LOADING RATINGS ----------------
  describe('Loading Ratings', () => {
    it('should load ratings when applicationId is set', async () => {
      const response: RatingOverviewDTO = {
        currentUserRating: 4,
        otherRatings: [1, 2, 3],
      } as RatingOverviewDTO;
      mockRatingApi.getRatings.mockReturnValueOnce(of(response));

      fixture.componentRef.setInput('applicationId', 'app-1');
      fixture.detectChanges();
      await Promise.resolve();

      expect(mockRatingApi.getRatings).toHaveBeenCalledWith('app-1');
      expect(component.ratings()).toEqual(response);
      expect(component['serverCurrent']()).toBe(4);
      expect(component.myRating()).toBe(4);
      expect(component.otherRatings()).toEqual([1, 2, 3]);
    });

    it('should reload ratings when applicationId changes', async () => {
      const response1: RatingOverviewDTO = { currentUserRating: 3, otherRatings: [1, 2] } as RatingOverviewDTO;
      const response2: RatingOverviewDTO = { currentUserRating: 5, otherRatings: [4] } as RatingOverviewDTO;

      mockRatingApi.getRatings.mockReturnValueOnce(of(response1));
      fixture.componentRef.setInput('applicationId', 'app-8');
      fixture.detectChanges();
      await Promise.resolve();

      expect(component.myRating()).toBe(3);
      expect(component.otherRatings()).toEqual([1, 2]);

      mockRatingApi.getRatings.mockReturnValueOnce(of(response2));
      fixture.componentRef.setInput('applicationId', 'app-9');
      fixture.detectChanges();
      await Promise.resolve();

      expect(component.myRating()).toBe(5);
      expect(component.otherRatings()).toEqual([4]);
      expect(mockRatingApi.getRatings).toHaveBeenCalledTimes(2);
    });

    it('should set myRating and serverCurrent to undefined when currentUserRating is missing', async () => {
      const response = {
        currentUserRating: undefined,
        otherRatings: [1, 2],
      } as RatingOverviewDTO;

      mockRatingApi.getRatings.mockReturnValueOnce(of(response));

      fixture.componentRef.setInput('applicationId', 'app-6');
      fixture.detectChanges();

      await new Promise(r => setTimeout(r, 0));

      expect(component.ratings()).toEqual(response);
      expect(component['serverCurrent']()).toBeUndefined();
      expect(component.myRating()).toBeUndefined();
    });
  });

  // ---------------- ERROR HANDLING (LOADING) ----------------
  describe('Error Handling (Loading)', () => {
    it('should show toast and set isInitializing false on loadRatings error', async () => {
      mockRatingApi.getRatings.mockReturnValueOnce(throwError(() => new Error('fail')));

      fixture.componentRef.setInput('applicationId', 'app-2');
      fixture.detectChanges();
      await Promise.resolve();

      expect(mockToast.showError).toHaveBeenCalledWith({
        summary: 'Error',
        detail: 'Failed to load ratings',
      });
      expect(component['isInitializing']()).toBe(false);
    });
  });

  // ---------------- UPSERT RATINGS ----------------
  describe('Upserting Ratings', () => {
    it('should skip upsert when appId undefined', async () => {
      fixture.componentRef.setInput('applicationId', undefined);
      fixture.detectChanges();

      component.myRating.set(3);
      await Promise.resolve();
      expect(mockRatingApi.updateRating).not.toHaveBeenCalled();
    });

    it('should skip upsert when initializing', async () => {
      fixture.componentRef.setInput('applicationId', 'app-3');
      fixture.detectChanges();

      component['isInitializing'].set(true);
      component.myRating.set(5);
      await Promise.resolve();
      expect(mockRatingApi.updateRating).not.toHaveBeenCalled();
    });

    it('should upsert rating on change and refresh ratings on success', async () => {
      fixture.componentRef.setInput('applicationId', 'app-4');
      fixture.detectChanges();

      const refreshed: RatingOverviewDTO = { currentUserRating: 5, otherRatings: [3, 4] } as RatingOverviewDTO;
      mockRatingApi.updateRating.mockReturnValueOnce(of(void 0));
      mockRatingApi.getRatings.mockReturnValueOnce(of(refreshed));

      component['isInitializing'].set(false);
      component['serverCurrent'].set(1);

      component.myRating.set(5);
      fixture.detectChanges();

      await new Promise(r => setTimeout(r, 0));

      expect(mockRatingApi.updateRating).toHaveBeenCalledWith('app-4', 5);
      expect(component['serverCurrent']()).toBe(5);
      expect(component.ratings()).toEqual(refreshed);
    });

    it('should not upsert when myRating equals serverCurrent', async () => {
      fixture.componentRef.setInput('applicationId', 'app-7');
      fixture.detectChanges();

      component['isInitializing'].set(false);
      component['serverCurrent'].set(3);

      component.myRating.set(3);
      fixture.detectChanges();

      await new Promise(r => setTimeout(r, 0));

      expect(mockRatingApi.updateRating).not.toHaveBeenCalled();
    });
  });

  // ---------------- ERROR HANDLING (UPSERT) ----------------
  describe('Error Handling (Upsert)', () => {
    it('should show toast and revert myRating on upsert error', async () => {
      fixture.componentRef.setInput('applicationId', 'app-5');

      mockRatingApi.getRatings.mockReturnValue(of({ currentUserRating: 3, otherRatings: [] } as RatingOverviewDTO));
      mockRatingApi.updateRating.mockReturnValueOnce(throwError(() => new Error('fail')));

      fixture.detectChanges();

      component['isInitializing'].set(false);
      component['serverCurrent'].set(3);

      component.myRating.set(4);
      fixture.detectChanges();

      await new Promise(r => setTimeout(r, 0));

      expect(mockToast.showError).toHaveBeenCalledWith({
        summary: 'Error',
        detail: 'Failed to save rating',
      });
      expect(component.myRating()).toBe(3);
    });
  });

  // ---------------- EDGE CASES & DERIVED VALUES ----------------
  describe('Edge Cases & Derived Values', () => {
    it('should return [] for otherRatings when ratings is undefined', () => {
      expect(component.ratings()).toBeUndefined();
      expect(component.otherRatings()).toEqual([]);
    });

    it('should return [] for otherRatings when ratings has no otherRatings property', () => {
      component.ratings.set({ currentUserRating: 2 } as RatingOverviewDTO);
      expect(component.otherRatings()).toEqual([]);
    });
  });
});
