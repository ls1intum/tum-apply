import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationDetailDTO, ApplicationResourceService } from 'app/generated';
import { ApplicationDetailCardComponent } from 'app/shared/components/organisms/application-detail-card/application-detail-card.component';

@Component({
  selector: 'jhi-application-detail-for-applicant',
  imports: [ApplicationDetailCardComponent],
  templateUrl: './application-detail-for-applicant.component.html',
  styleUrl: './application-detail-for-applicant.component.scss',
})
export default class ApplicationDetailForApplicantComponent {
  applicationId = signal<string>('');
  application = signal<ApplicationDetailDTO | undefined>(undefined);

  private applicationService = inject(ApplicationResourceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    const applicationId = this.route.snapshot.paramMap.get('application_id');
    if (applicationId === null) {
      alert('Error: this is no valid jobId');
    } else {
      this.applicationId.set(applicationId);
    }
    const application = {
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
    } as ApplicationDetailDTO;
    //await firstValueFrom(this.applicationService.getApplicationForDetailPage(this.applicationId()));
    this.application.set(application);
  }
}
