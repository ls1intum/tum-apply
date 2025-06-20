import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApplicationDetailDTO } from 'app/generated';

@Component({
  selector: 'jhi-application-detail-card',
  imports: [FontAwesomeModule, NgTemplateOutlet],
  templateUrl: './application-detail-card.component.html',
  styleUrl: './application-detail-card.component.scss',
})
export class ApplicationDetailCardComponent {
  show_rating = input<boolean>(false);
  application = input<ApplicationDetailDTO>({
    applicationId: 'app-123456',
    applicant: {
      user: {
        userId: 'user-789',
        email: 'alice.smith@example.com',
        avatar: 'https://example.com/avatar.jpg',
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        nationality: 'German',
        birthday: '1998-04-12',
        phoneNumber: '+49 151 23456789',
        website: 'https://alicesmith.dev',
        linkedinUrl: 'https://linkedin.com/in/alicesmith',
      },
      bachelorDegreeName: 'Computer Science',
      bachelorGradingScale: 'ONE_TO_FOUR',
      bachelorGrade: '1.3',
      bachelorUniversity: 'Technical University of Berlin',
      masterDegreeName: 'Artificial Intelligence',
      masterGradingScale: 'ONE_TO_FOUR',
      masterGrade: '1.1',
      masterUniversity: 'Technical University of Munich',
    },
    applicationState: 'SENT',
    desiredDate: '2025-10-01',
    projects:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    specialSkills:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    motivation:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    // customFields: new Set<CustomFieldAnswerDTO>(),
  } as ApplicationDetailDTO);
}
