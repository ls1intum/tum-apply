import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ProfessorInformationSectionComponent } from 'app/shared/pages/professor-landing-page/professor-information-section/professor-information-section.component';
import { provideTranslateMock } from 'util/translate.mock';

describe('ProfessorInformationSectionComponent', () => {
  let fixture: ComponentFixture<ProfessorInformationSectionComponent>;
  let component: ProfessorInformationSectionComponent;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessorInformationSectionComponent],
      providers: [provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorInformationSectionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Translation and Image Configuration', () => {
    it('should have correct translation key', () => {
      expect(component.translationKey).toBe('professorLandingPage.informationSection.tiles');
    });

    it('should have correct image source path', () => {
      expect(component.imageSrc).toBe('/content/images/landing-page/information-section/professor/');
    });
  });

  describe('Information Cards Configuration', () => {
    it('should have exactly six information cards', () => {
      expect(component.cards).toHaveLength(6);
    });

    it('should configure research card correctly', () => {
      const researchCard = component.cards[0];
      expect(researchCard.imageSrc).toBe('/content/images/landing-page/information-section/professor/research.webp');
      expect(researchCard.text).toBe('professorLandingPage.informationSection.tiles.1');
      expect(researchCard.link).toBe('https://www.tum.de/en/research');
    });

    it('should configure development card correctly', () => {
      const developmentCard = component.cards[1];
      expect(developmentCard.imageSrc).toBe('/content/images/landing-page/information-section/professor/development.webp');
      expect(developmentCard.text).toBe('professorLandingPage.informationSection.tiles.2');
      expect(developmentCard.link).toBe('https://www.tum.de/en/lifelong-learning/all-employees');
    });

    it('should configure networks card correctly', () => {
      const networksCard = component.cards[2];
      expect(networksCard.imageSrc).toBe('/content/images/landing-page/information-section/professor/networks.webp');
      expect(networksCard.text).toBe('professorLandingPage.informationSection.tiles.3');
      expect(networksCard.link).toBe('https://web.tum.de/en/inw/home/');
    });

    it('should configure services card correctly', () => {
      const servicesCard = component.cards[3];
      expect(servicesCard.imageSrc).toBe('/content/images/landing-page/information-section/professor/services.webp');
      expect(servicesCard.text).toBe('professorLandingPage.informationSection.tiles.4');
      expect(servicesCard.link).toBe('https://www.tum.de/en/research/support-for-researchers');
    });

    it('should configure transfer card correctly', () => {
      const transferCard = component.cards[4];
      expect(transferCard.imageSrc).toBe('/content/images/landing-page/information-section/professor/transfer.webp');
      expect(transferCard.text).toBe('professorLandingPage.informationSection.tiles.5');
      expect(transferCard.link).toBe('https://www.tum.de/en/innovation/patents-and-licenses');
    });

    it('should configure partnerships card correctly', () => {
      const partnershipsCard = component.cards[5];
      expect(partnershipsCard.imageSrc).toBe('/content/images/landing-page/information-section/professor/partnerships.webp');
      expect(partnershipsCard.text).toBe('professorLandingPage.informationSection.tiles.6');
      expect(partnershipsCard.link).toBe('https://www.international.tum.de/en/global/partnerships-initiatives/');
    });
  });

  describe('Cards Data Integrity', () => {
    it('should have all required properties for each card', () => {
      component.cards.forEach(card => {
        expect(card.imageSrc).toBeTruthy();
        expect(card.text).toBeTruthy();
        expect(card.link).toBeTruthy();
        expect(card.link).toContain('http');
      });
    });

    it('should have unique image sources for each card', () => {
      const imageSources = component.cards.map(card => card.imageSrc);
      const uniqueImageSources = new Set(imageSources);
      expect(uniqueImageSources).toHaveLength(imageSources.length);
    });

    it('should have unique links for each card', () => {
      const links = component.cards.map(card => card.link);
      const uniqueLinks = new Set(links);
      expect(uniqueLinks).toHaveLength(links.length);
    });
  });

  describe('Template Rendering', () => {
    it('should render the section title', () => {
      const title = nativeElement.querySelector('h2');
      expect(title).not.toBeNull();
    });

    it('should render one information card per entry in the cards array', () => {
      const cards = nativeElement.querySelectorAll('jhi-information-card');
      expect(cards).toHaveLength(component.cards.length);
    });

    it('should render exactly six information cards', () => {
      const cards = nativeElement.querySelectorAll('jhi-information-card');
      expect(cards).toHaveLength(6);
    });
  });
});
