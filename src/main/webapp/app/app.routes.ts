import { Routes } from '@angular/router';
import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';

import { errorRoute } from './layouts/error/error.route';
import { UserShortDTO } from './generated/model/userShortDTO';

const routes: Routes = [
  // ======================================================================================
  // Home
  // ======================================================================================
  {
    path: '',
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    loadComponent: () => import('./shared/pages/landing-page/landing-page.component').then(m => m.LandingPageComponent),
    title: 'landingPage.title',
  },
  {
    path: '',
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    loadChildren: () => import(`./entities/entity.routes`),
  },

  // ======================================================================================
  // Playground
  // ======================================================================================
  {
    path: 'playground/badge',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin] },
    loadComponent: () => import('./playground/badge-playground/badge-playground.component').then(m => m.BadgePlaygroundComponent),
  },
  {
    path: 'playground/button',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin] },
    loadComponent: () => import('./playground/button-play-ground/button-play-ground.component').then(c => c.ButtonPlayGroundComponent),
  },
  {
    path: 'playground/stepper',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin] },
    loadComponent: () => import('./playground/stepper-playground/stepper-playground.component').then(c => c.StepperPlaygroundComponent),
  },

  // ======================================================================================
  // User Management
  // ======================================================================================
  {
    path: 'login',
    loadComponent: () => import('./usermanagement/login/login.component').then(m => m.LoginComponent),
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    title: 'login',
  },
  {
    path: 'register',
    loadComponent: () => import('./usermanagement/register/register.component').then(m => m.RegisterComponent),
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    title: 'register',
  },
  {
    path: 'admin',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin] },
    loadChildren: () => import('./admin/admin.routes'),
  },

  // ======================================================================================
  // Job
  // ======================================================================================
  {
    path: 'job-creation',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Professor] },
    loadComponent: () => import('./job/jobCreationForm/job-creation-form.component').then(m => m.JobCreationFormComponent),
  },
  {
    path: 'job-overview',
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    loadComponent: () => import('./job/job-overview/job-overview-page/job-overview-page.component').then(m => m.JobOverviewPageComponent),
  },
  {
    path: 'my-positions',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Professor] },
    loadComponent: () => import('./job/my-positions/my-positions-page/my-positions-page.component').then(m => m.MyPositionsPageComponent),
  },

  // ======================================================================================
  // Application
  // ======================================================================================
  {
    path: 'application/create/:job_id',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Applicant] },
    loadComponent: () => import('./application/application-creation/application-creation-form/application-creation-form.component'),
  },
  {
    path: 'application/edit/:application_id',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Applicant] },
    loadComponent: () => import('./application/application-creation/application-creation-form/application-creation-form.component'),
  },
  {
    path: 'application/overview',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Applicant] },
    loadComponent: () => import('./application/application-overview-for-applicant/application-overview-for-applicant.component'),
  },
  {
    path: 'application/detail/:application_id',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Applicant] },
    loadComponent: () => import('./application/application-detail-for-applicant/application-detail-for-applicant.component'),
  },

  // ======================================================================================
  // Evaluation
  // ======================================================================================
  {
    path: 'evaluation/overview',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Professor] },
    loadComponent: () =>
      import('./evaluation/application-overview/application-overview.component').then(m => m.ApplicationOverviewComponent),
  },
  {
    path: 'evaluation/application',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Professor] },
    loadComponent: () => import('./evaluation/application-detail/application-detail.component').then(m => m.ApplicationDetailComponent),
  },

  // ======================================================================================
  // Error Handling
  // ======================================================================================
  ...errorRoute,
];

export default routes;
