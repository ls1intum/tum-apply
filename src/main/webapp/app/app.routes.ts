import { Routes } from '@angular/router';
import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';

import { errorRoute } from './layouts/error/error.route';
import { Authority } from './config/authority.constants';

const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/usermanagement/login/login.component').then(m => m.LoginComponent),
    canActivate: [UserRouteAccessService],
    data: { publicOnly: true },
    title: 'login',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/usermanagement/register/register.component').then(m => m.RegisterComponent),
    canActivate: [UserRouteAccessService],
    data: { publicOnly: true },
    title: 'register',
  },
  {
    path: 'job-creation',
    canActivate: [UserRouteAccessService],
    data: { authorities: [Authority.ADMIN, Authority.PROFESSOR] },
    loadComponent: () => import('./pages/job/jobCreationForm/job-creation-form.component').then(m => m.JobCreationFormComponent),
    title: 'home.title',
  },
  {
    path: '',
    loadComponent: () => import('./pages/misc/home/home.component'),
    title: 'home.title',
  },
  {
    path: 'application/create/:job_id',
    loadComponent: () => import('./pages/application/application-creation/application-creation-form/application-creation-form.component'),
  },
  {
    path: 'playground/button',
    canActivate: [UserRouteAccessService],
    data: { authorities: [Authority.ADMIN] },
    loadComponent: () => import('./pages/misc/button-play-ground/button-play-ground.component').then(c => c.ButtonPlayGroundComponent),
  },
  {
    path: 'playground/stepper',
    canActivate: [UserRouteAccessService],
    data: { authorities: [Authority.ADMIN] },
    loadComponent: () => import('./pages/misc/stepper-playground/stepper-playground.component').then(c => c.StepperPlaygroundComponent),
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
    loadComponent: () => import('./pages/badge-playground/badge-playground.component').then(m => m.BadgePlaygroundComponent),
  },
  {
    path: 'evaluation/overview',
    loadComponent: () =>
      import('./pages/evaluation/application-overview/application-overview.component').then(m => m.ApplicationOverviewComponent),
  },
  ...errorRoute,
];

export default routes;
