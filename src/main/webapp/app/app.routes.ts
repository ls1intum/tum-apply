import { Routes } from '@angular/router';
import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';

import { errorRoute } from './layouts/error/error.route';
import { Authority } from './config/authority.constants';

const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/usermanagement/login/login.component').then(m => m.LoginComponent),
    title: 'login',
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
    path: '',
    loadComponent: () => import('./layouts/navbar/navbar.component'),
    outlet: 'navbar',
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
  ...errorRoute,
];

export default routes;
