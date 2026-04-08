import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  adminSidebar: [
    {
      type: 'category',
      label: 'Admins',
      collapsed: false,
      link: {
        type: 'generated-index',
        description:
          'All information for admins: Keycloak management, privacy & data retention, and production infrastructure.',
      },
      items: [
        {
          type: 'category',
          label: 'Keycloak',
          items: [
            'keycloak/overview',
            'keycloak/realm-and-clients',
            'keycloak/impersonation',
            'keycloak/production-setup',
          ],
        },
        {
          type: 'category',
          label: 'Privacy & Data',
          items: [
            'privacy-and-data/data-export',
            'privacy-and-data/data-retention',
          ],
        },
        'production-infrastructure',
      ],
    },
  ],
};

export default sidebars;
