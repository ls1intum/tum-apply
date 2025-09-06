import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faApple, faGoogle, faMicrosoft } from '@fortawesome/free-brands-svg-icons';

import { AuthCardComponent } from './auth-card.component';

describe('AuthCardComponent', () => {
  let component: AuthCardComponent;
  let fixture: ComponentFixture<AuthCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCardComponent],
      providers: [provideHttpClient(), MessageService, importProvidersFrom(TranslateModule.forRoot())],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faMicrosoft);
    library.addIcons(faGoogle);
    library.addIcons(faApple);

    fixture = TestBed.createComponent(AuthCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
