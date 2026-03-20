import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  developerSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Introduction',
      items: [
        'intro/features',
        'intro/personas',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'setup/dev-environment',
        'setup/database-setup',
        'setup/environment-variables',
        'setup/spring-ai',
        'setup/openapi',
      ],
    },
    {
      type: 'category',
      label: 'Authentication & Authorization',
      items: [
        'auth/authentication-flow',
        'auth/authorization',
        {
          type: 'category',
          label: 'Keycloak',
          items: [
            'auth/keycloak/keycloak-overview',
            'auth/keycloak/keycloak-realm-and-clients',
            'auth/keycloak/keycloak-impersonation',
            'auth/keycloak/development-setup',
            'auth/keycloak/production-setup',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Modules',
      items: [
        'modules/application',
        'modules/job',
        'modules/evaluation',
        'modules/notification',
        'modules/user-management',
      ],
    },
    {
      type: 'category',
      label: 'Development Guides',
      items: [
        'general/general-documentation',
        'general/client-best-practices',
        'theming/color-theming',
        'errors/error-handling',
      ],
    },
    {
      type: 'category',
      label: 'Testing',
      items: [
        'testing/testing-guide',
        'testing/bruno',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/build-production',
        'deployment/docker',
        'deployment/environment-config',
      ],
    },
    {
      type: 'category',
      label: 'Privacy & Data',
      items: [
        'privacy/data-export',
        'privacy/data-retention',
      ],
    },
  ],
};

export default sidebars;
