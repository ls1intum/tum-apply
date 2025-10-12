import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MessageService } from 'primeng/api';
import { ToastComponent } from 'app/shared/toast/toast.component';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [MessageService],
    });

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render p-toast element', () => {
    const compiled = fixture.nativeElement;
    const toastElement = compiled.querySelector('p-toast');

    expect(toastElement).toBeTruthy();
  });
});
