import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  adminSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Keycloak',
      items: [
        'keycloak/overview',
        'keycloak/keycloak-realm-and-clients',
        'keycloak/keycloak-impersonation',
        'keycloak/production-setup',
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
    'production-deployment',
  ],
};

export default sidebars;
