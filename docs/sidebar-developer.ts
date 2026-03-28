import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  developerSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'setup/dev-environment',
        'setup/spring-ai',
      ],
    },
    {
      type: 'category',
      label: 'Development Guides',
      items: [
        'general/general-documentation',
        'general/client-best-practices',
        'general/branch-guidelines',
        'general/pr-guidelines',
        'general/writing-documentation',
        'general/liquibase-guidelines',
        'general/openapi',
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
      label: 'Infrastructure & CI/CD',
      items: [
        'deployment/environment-variables',
        'deployment/testserver',
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
            'auth/keycloak/development-setup',
            'auth/keycloak/test-users',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
