import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MissingTranslationHandler,
  TranslateCompiler,
  TranslateLoader,
  TranslateModule,
  TranslateParser,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';

import { VoicesSectionComponent } from './voices-section.component';

describe('VoicesSectionComponent', () => {
  let component: VoicesSectionComponent;
  let fixture: ComponentFixture<VoicesSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoicesSectionComponent, TranslateModule.forRoot()],
      providers: [
        TranslateStore,
        TranslateLoader,
        TranslateCompiler,
        TranslateParser,
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
        TranslateService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VoicesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
