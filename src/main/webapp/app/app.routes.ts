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
    title: 'global.routes.landingPage.applicant',
  },
  {
    path: 'professor',
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    loadComponent: () =>
      import('./shared/pages/professor-landing-page/professor-landing-page.component').then(m => m.ProfessorLandingPageComponent),
    title: 'global.routes.landingPage.professor',
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
  {
    path: 'playground/editor',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin] },
    loadComponent: () => import('./playground/editor-playground/editor-playground.component').then(m => m.EditorPlaygroundComponent),
  },
  {
    path: 'playground/docviewer',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin] },
    loadComponent: () =>
      import('./playground/document-viewer-playground/document-viewer-playground.component').then(c => c.DocumentViewerPlaygroundComponent),
  },
  {
    path: 'playground/rating',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin] },
    loadComponent: () => import('./playground/rating-playground/rating-playground').then(c => c.RatingPlayground),
  },
  {
    path: 'playground/comment',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin] },
    loadComponent: () => import('./playground/comment-playground/comment-playground').then(c => c.CommentPlayground),
  },

  // ======================================================================================
  // User Management
  // ======================================================================================
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
    path: 'job/detail/:job_id',
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    loadComponent: () => import('./job/job-detail/job-detail.component').then(m => m.JobDetailComponent),
    title: 'global.routes.job.detail',
  },
  {
    path: 'job/create',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Professor] },
    loadComponent: () => import('./job/job-creation-form/job-creation-form.component').then(m => m.JobCreationFormComponent),
    title: 'global.routes.job.creation',
  },
  {
    path: 'job/edit/:job_id',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Professor] },
    loadComponent: () => import('./job/job-creation-form/job-creation-form.component').then(m => m.JobCreationFormComponent),
    title: 'global.routes.job.edit',
  },
  {
    path: 'job-overview',
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    loadComponent: () => import('./job/job-overview/job-overview-page/job-overview-page.component').then(m => m.JobOverviewPageComponent),
    title: 'global.routes.job.overview',
  },
  {
    path: 'my-positions',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Professor] },
    loadComponent: () => import('./job/my-positions/my-positions-page/my-positions-page.component').then(m => m.MyPositionsPageComponent),
    title: 'global.routes.job.myPositions',
  },

  // ======================================================================================
  // Application
  // ======================================================================================
  // New unified application form route
  {
    path: 'application/form',
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    loadComponent: () => import('./application/application-creation/application-creation-form/application-creation-form.component'),
    title: 'global.routes.application.creation',
  },

  // TODO temporary - Keep the old routes for backward compatibility
  {
    path: 'application/create/:job_id',
    redirectTo(route) {
      const jobId = route.params.job_id;
      return `/application/form?job=${jobId}`;
    },
    title: 'global.routes.application.creation',
  },
  {
    path: 'application/edit/:application_id',
    redirectTo(route) {
      const applicationId = route.params.application_id;
      return `/application/form?application=${applicationId}`;
    },
  },
  {
    path: 'application/overview',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Applicant] },
    loadComponent: () => import('./application/application-overview-for-applicant/application-overview-for-applicant.component'),
    title: 'global.routes.application.overview',
  },
  {
    path: 'application/detail/:application_id',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Applicant] },
    loadComponent: () => import('./application/application-detail-for-applicant/application-detail-for-applicant.component'),
    title: 'global.routes.application.detail',
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
    title: 'global.routes.evaluation.overview',
  },
  {
    path: 'evaluation/application',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Professor] },
    loadComponent: () => import('./evaluation/application-detail/application-detail.component').then(m => m.ApplicationDetailComponent),
    title: 'global.routes.evaluation.detail',
  },

  // ======================================================================================
  // Footer
  // ======================================================================================
  {
    path: 'imprint',
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    loadComponent: () => import('./shared/pages/imprint-page/imprint-page.component').then(m => m.ImprintPageComponent),
    title: 'global.routes.footer.imprint',
  },
  {
    path: 'privacy',
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    loadComponent: () => import('./shared/pages/privacy-page/privacy-page.component').then(m => m.PrivacyPageComponent),
    title: 'global.routes.footer.privacy',
  },

  // ======================================================================================
  // Settings Page
  // ======================================================================================
  {
    path: 'settings',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin, UserShortDTO.RolesEnum.Professor, UserShortDTO.RolesEnum.Applicant] },
    loadComponent: () => import('./shared/settings/settings.component').then(m => m.SettingsComponent),
    title: 'global.routes.settings',
  },

  // ======================================================================================
  // Research Group
  // ======================================================================================
  {
    path: 'research-group/admin-view',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Admin] },
    loadComponent: () =>
      import('./usermanagement/research-group/research-group-admin-view/research-group-admin-view.component').then(
        m => m.ResearchGroupAdminView,
      ),
    title: 'global.routes.researchGroup.adminView',
  },
  {
    path: 'research-group/templates',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Professor] },
    loadComponent: () =>
      import('./usermanagement/research-group/research-group-templates/research-group-templates').then(m => m.ResearchGroupTemplates),
    title: 'global.routes.researchGroup.templates',
  },
  {
    path: 'research-group/template/new',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Professor] },
    loadComponent: () =>
      import('./usermanagement/research-group/research-group-template-edit/research-group-template-edit').then(
        m => m.ResearchGroupTemplateEdit,
      ),
    title: 'global.routes.researchGroup.templateCreation',
  },
  {
    path: 'research-group/template/:templateId/edit',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Professor] },
    loadComponent: () =>
      import('./usermanagement/research-group/research-group-template-edit/research-group-template-edit').then(
        m => m.ResearchGroupTemplateEdit,
      ),
    title: 'global.routes.researchGroup.templateEdit',
  },
  {
    path: 'research-group/members',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Professor, UserShortDTO.RolesEnum.Admin] },
    loadComponent: () =>
      import('./usermanagement/research-group/research-group-members/research-group-members.component').then(
        m => m.ResearchGroupMembersComponent,
      ),
    title: 'researchGroup.memberPage',
  },
  {
    path: 'research-group/info',
    canActivate: [UserRouteAccessService],
    data: { authorities: [UserShortDTO.RolesEnum.Professor] },
    loadComponent: () =>
      import('./usermanagement/research-group/research-group-info/research-group-info.component').then(m => m.ResearchGroupInfoComponent),
    title: 'global.routes.researchGroup.info',
  },

  // ======================================================================================
  // About Us
  // ======================================================================================
  {
    path: 'about-us',
    canActivate: [UserRouteAccessService],
    data: { authorities: [] },
    loadComponent: () => import('./shared/pages/about-us-page/about-us-page.component').then(m => m.AboutUsPageComponent),
    title: 'global.routes.about-us',
  },

  // ======================================================================================
  // Error Handling
  // ======================================================================================
  ...errorRoute,
];

export default routes;
