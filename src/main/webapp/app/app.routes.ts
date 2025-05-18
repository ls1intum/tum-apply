import { Routes } from '@angular/router';
import { Authority } from 'app/config/authority.constants';
import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';

import { errorRoute } from './layouts/error/error.route';

const routes: Routes = [
  {
    path: 'job-creation',
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
    path: 'application/create/:job_id',
    loadComponent: () => import('./pages/application/application-creation/application-creation-form/application-creation-form.component'),
  },
  {
    path: 'playground/button',
    loadComponent: () => import('./pages/misc/button-play-ground/button-play-ground.component').then(c => c.ButtonPlayGroundComponent),
  },
  {
    path: 'playground/stepper',
    loadComponent: () => import('./pages/misc/stepper-playground/stepper-playground.component').then(c => c.StepperPlaygroundComponent),
  },
  {
    path: 'admin',
    data: {
      authorities: [Authority.ADMIN],
    },
    canActivate: [UserRouteAccessService],
    loadChildren: () => import('./admin/admin.routes'),
  },
  {
    path: '',
    loadChildren: () => import(`./entities/entity.routes`),
  },
  ...errorRoute,
];

export default routes;
