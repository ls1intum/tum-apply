import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

import { MessageComponent } from 'app/shared/components/atoms/message/message.component';
import { provideTranslateMock } from 'util/translate.mock';

type MessageForTest = {
  message: string;
  severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';
  shouldTranslate: boolean;
  styleClass: string;
  closable: boolean;
};

describe('MessageComponent', () => {
  function createMessageFixture(overrideInputs: Partial<MessageForTest>) {
    const fixture = TestBed.createComponent(MessageComponent);

    const defaults: Partial<MessageForTest> = {
      message: '',
      severity: 'info',
      shouldTranslate: true,
      styleClass: '',
      closable: false,
    };

    const inputs = { ...defaults, ...overrideInputs };

    Object.entries(inputs).forEach(([key, value]) => {
      fixture.componentRef.setInput(key as keyof MessageForTest, value);
    });

    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageComponent],
      providers: [provideTranslateMock()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = createMessageFixture({ message: 'Test message' });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should combine custom styleClass with rounded-sm', () => {
    const fixture = createMessageFixture({ styleClass: 'custom-class' });

    const messageElement = fixture.debugElement.query(By.css('p-message'));
    expect(messageElement.componentInstance.styleClass).toContain('custom-class');
    expect(messageElement.componentInstance.styleClass).toContain('rounded-sm');
  });
});
