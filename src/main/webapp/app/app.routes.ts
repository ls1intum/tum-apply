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
  {
    path: 'badge-playground',
    loadComponent: () => import('./pages/badge-playground/badge-playground.component').then(m => m.BadgePlaygroundComponent),
  },
  ...errorRoute,
];

export default routes;
