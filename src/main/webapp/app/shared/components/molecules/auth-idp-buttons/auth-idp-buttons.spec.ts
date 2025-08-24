import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthIdpButtons } from './auth-idp-buttons';

describe('AuthIdpButtons', () => {
  let component: AuthIdpButtons;
  let fixture: ComponentFixture<AuthIdpButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthIdpButtons],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthIdpButtons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
