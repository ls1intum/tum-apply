import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  developerSidebar: [
    {
      type: 'category',
      label: 'Developers',
      collapsed: false,
      link: {
        type: 'generated-index',
        description:
          'All information for developers: from setting up your local environment to coding guidelines, testing, and deployment.',
      },
      items: [
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
          label: 'General Guidelines',
          items: [
            'general/branch-guidelines',
            'general/pr-guidelines',
            'general/openapi',
            'general/writing-documentation',
          ],
        },
        {
          type: 'category',
          label: 'Server Guidelines',
          items: [
            'general/server-guidelines',
            'testing/server-testing',
            'general/database-guidelines',
            'general/liquibase-guidelines',
            'errors/error-handling',
          ],
        },
        {
          type: 'category',
          label: 'Client Guidelines',
          items: [
            'general/angular-guidelines',
            'general/client-styling-guidelines',
            'testing/client-testing',
            'general/language-guidelines',
            'theming/color-theming',
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
    },
  ],
};

export default sidebars;
