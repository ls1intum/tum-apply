import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ProfessorBenefitsSectionComponent } from 'app/shared/pages/professor-landing-page/professor-benefits-section/professor-benefits-section.component';
import { provideTranslateMock } from 'util/translate.mock';
import { createRouterMock, provideRouterMock, RouterMock } from 'util/router.mock';

describe('ProfessorBenefitsSectionComponent', () => {
  let fixture: ComponentFixture<ProfessorBenefitsSectionComponent>;
  let component: ProfessorBenefitsSectionComponent;
  let routerMock: RouterMock;

  beforeEach(async () => {
    routerMock = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [ProfessorBenefitsSectionComponent],
      providers: [provideTranslateMock(), provideRouterMock(routerMock)],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorBenefitsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Button Navigation', () => {
    it.each([
      ['first', 0],
      ['second', 1],
    ])('should navigate to job-overview when %s button is clicked', (_label, index) => {
      const buttonData = component.buttons();
      buttonData.buttons[index].onClick?.();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/job-overview']);
    });
  });
});
