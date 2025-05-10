import { AfterViewInit, ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import { StatusBadgeComponent } from '../../../shared/components/atoms/status-badge/status-badge.component';

@Component({
  selector: 'jhi-application-overview',
  imports: [CommonModule, ButtonComponent, DynamicTableComponent, StatusBadgeComponent],
  templateUrl: './application-overview.component.html',
  styleUrl: './application-overview.component.scss',
})
export class ApplicationOverviewComponent implements AfterViewInit {
  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  applications = [
    {
      id: 1,
      applicantName: 'Alice Müller',
      email: 'alice@example.com',
      position: 'AI Research Assistant',
      status: 'ACCEPTED',
    },
    {
      id: 2,
      applicantName: 'Bob Meier',
      email: 'bob@example.com',
      position: 'Data Science PhD',
      status: 'REJECTED',
    },
    {
      id: 3,
      applicantName: 'Carla Schmidt',
      email: 'carla@example.com',
      position: 'Cybersecurity Researcher',
      status: 'SENT',
    },
  ];

  columns: any[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.columns = [
      { field: 'applicantName', header: 'Name' },
      { field: 'email', header: 'Email' },
      { field: 'position', header: 'Position' },
      { field: 'status', header: 'Status' },
      { field: 'actions', header: 'Actions', template: this.actionTemplate },
    ];
  }
}
