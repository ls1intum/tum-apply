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
            'getting-started/dev-environment',
            'getting-started/spring-ai',
          ],
        },
        {
          type: 'category',
          label: 'General Guidelines',
          items: [
            'general-guidelines/branch-guidelines',
            'general-guidelines/pr-guidelines',
            'general-guidelines/openapi',
            'general-guidelines/writing-documentation',
          ],
        },
        {
          type: 'category',
          label: 'Server Guidelines',
          items: [
            'server-guidelines/server-guidelines',
            'server-guidelines/server-testing',
            'server-guidelines/api-testing',
            'server-guidelines/database-guidelines',
            'server-guidelines/liquibase-guidelines',
            'server-guidelines/error-handling',
          ],
        },
        {
          type: 'category',
          label: 'Client Guidelines',
          items: [
            'client-guidelines/angular-guidelines',
            'client-guidelines/client-styling-guidelines',
            'client-guidelines/client-testing',
            'client-guidelines/language-guidelines',
            'client-guidelines/color-theming',
          ],
        },
        {
          type: 'category',
          label: 'Infrastructure & CI/CD',
          items: [
            'infrastructure-and-cicd/environment-variables',
            'infrastructure-and-cicd/testserver',
          ],
        },
        {
          type: 'category',
          label: 'Authentication & Authorization',
          items: [
            'authentication-and-authorization/authentication-flow',
            'authentication-and-authorization/authorization',
            {
              type: 'category',
              label: 'Keycloak',
              items: [
                'authentication-and-authorization/keycloak/keycloak-overview',
                'authentication-and-authorization/keycloak/development-setup',
                'authentication-and-authorization/keycloak/test-users',
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default sidebars;
