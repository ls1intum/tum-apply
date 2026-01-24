import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BackButtonComponent } from 'app/shared/components/atoms/back-button/back-button.component';
import { createLocationMock, LocationMock, provideLocationMock } from 'util/location.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

describe('BackButtonComponent', () => {
  let component: BackButtonComponent;
  let fixture: ComponentFixture<BackButtonComponent>;
  let location: LocationMock;

  beforeEach(async () => {
    location = createLocationMock();

    await TestBed.configureTestingModule({
      imports: [BackButtonComponent],
      providers: [provideLocationMock(location), provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(BackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render back button', () => {
    const buttonElement = fixture.nativeElement.querySelector('jhi-button');
    expect(buttonElement).toBeTruthy();
  });

  it('should call location.back when button is clicked', () => {
    const backSpy = vi.spyOn(location, 'back');

    component.handleBack();

    expect(backSpy).toHaveBeenCalledOnce();
  });
});
