import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faApple, faGoogle, faMicrosoft } from '@fortawesome/free-brands-svg-icons';

import { AuthIdpButtons } from './auth-idp-buttons';

describe('AuthIdpButtons', () => {
  let component: AuthIdpButtons;
  let fixture: ComponentFixture<AuthIdpButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthIdpButtons],
      providers: [provideHttpClient()],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faMicrosoft);
    library.addIcons(faGoogle);
    library.addIcons(faApple);

    fixture = TestBed.createComponent(AuthIdpButtons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
