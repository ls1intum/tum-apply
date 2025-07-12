import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CredentialsGroupComponent } from './credentials-group.component';

describe('CredentialsGroupComponent', () => {
  let component: CredentialsGroupComponent;
  let fixture: ComponentFixture<CredentialsGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CredentialsGroupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CredentialsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
