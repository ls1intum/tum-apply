import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CredentialsGroupComponent } from './credentials-group.component';

describe('CredentialsGroupComponent', () => {
  let component: CredentialsGroupComponent;
  let fixture: ComponentFixture<CredentialsGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CredentialsGroupComponent, TranslateModule.forRoot()],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CredentialsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
