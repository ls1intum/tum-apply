import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  professorsSidebar: [
    {
      type: 'category',
      label: 'Professors / Employees',
      collapsed: false,
      link: {
        type: 'generated-index',
        description:
          'All information for professors and employees: from first login and research group setup to managing applications and email templates.',
      },
      items: [
        'account-creation',
        'login',
        'research-groups',
        'create-job',
        'manage-jobs',
        'application-review',
        'interview',
      ],
    },
  ],
};

export default sidebars;
