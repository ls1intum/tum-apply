import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tumApplySidebar: [
    {
      type: 'category',
      label: 'Applicants',
      collapsed: false,
      link: {
        type: 'generated-index',
        description: 'All information for applicants: from account creation and login to submitting and managing your applications.',
      },
      items: [
        'applicants/account-creation',
        'applicants/login',
        'applicants/browse-jobs',
        'applicants/applying',
        'applicants/application-dashboard',
      ],
    },
    {
      type: 'category',
      label: 'Professors',
      collapsed: false,
      link: {
        type: 'generated-index',
        description: 'All information for professors: from first login and research group setup to managing applications and email templates.',
      },
      items: [
        'professors/account-creation',
        'professors/login',
        'professors/research-groups',
        'professors/create-job',
        'professors/manage-jobs',
        'professors/application-review',
      ],
    },
  ],
};

export default sidebars;
