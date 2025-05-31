import { Routes } from '@angular/router';
import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';

import { errorRoute } from './layouts/error/error.route';
import { Authority } from './config/authority.constants';

const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./usermanagement/login/login.component').then(m => m.LoginComponent),
    canActivate: [UserRouteAccessService],
    data: { publicOnly: true },
    title: 'login',
  },
  {
    path: 'register',
    loadComponent: () => import('./usermanagement/register/register.component').then(m => m.RegisterComponent),
    canActivate: [UserRouteAccessService],
    data: { publicOnly: true },
    title: 'register',
  },
  {
    path: 'job-creation',
    canActivate: [UserRouteAccessService],
    data: { authorities: [Authority.ADMIN, Authority.PROFESSOR] },
    loadComponent: () => import('./job/jobCreationForm/job-creation-form.component').then(m => m.JobCreationFormComponent),
    title: 'home.title',
  },
  {
    path: '',
    loadComponent: () => import('./home/home.component'),
    title: 'home.title',
  },
  {
    path: '',
    loadComponent: () => import('./layouts/navbar/navbar.component'),
    outlet: 'navbar',
  },
  {
    path: 'application/create/:job_id',
    loadComponent: () => import('./application/application-creation/application-creation-form/application-creation-form.component'),
  },
  {
    path: 'application/edit/:application_id',
    loadComponent: () => import('./application/application-creation/application-creation-form/application-creation-form.component'),
  },
  {
    path: 'playground/button',
    canActivate: [UserRouteAccessService],
    data: { authorities: [Authority.ADMIN] },
    loadComponent: () => import('./playground/button-play-ground/button-play-ground.component').then(c => c.ButtonPlayGroundComponent),
  },
  {
    path: 'playground/stepper',
    canActivate: [UserRouteAccessService],
    data: { authorities: [Authority.ADMIN] },
    loadComponent: () => import('./playground/stepper-playground/stepper-playground.component').then(c => c.StepperPlaygroundComponent),
  },
  {
    path: 'admin',
    canActivate: [UserRouteAccessService],
    data: { authorities: [Authority.ADMIN] },
    loadChildren: () => import('./admin/admin.routes'),
  },
  {
    path: '',
    loadChildren: () => import(`./entities/entity.routes`),
  },
  {
    path: 'badge-playground',
    loadComponent: () => import('./playground/badge-playground/badge-playground.component').then(m => m.BadgePlaygroundComponent),
  },
  {
    path: 'evaluation/overview',
    loadComponent: () =>
      import('./evaluation/application-overview/application-overview.component').then(m => m.ApplicationOverviewComponent),
  },
  {
    path: 'application/overview',
    loadComponent: () => import('./pages/application/application-overview-for-applicant/application-overview-for-applicant.component'),
  },
  ...errorRoute,
];

export default routes;
