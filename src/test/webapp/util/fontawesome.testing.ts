import { ENVIRONMENT_INITIALIZER, inject, type Provider } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fontAwesomeIcons } from 'app/config/font-awesome-icons';

export function provideFontAwesomeTesting(): Provider {
  return {
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useValue: () => {
      inject(FaIconLibrary).addIcons(...fontAwesomeIcons);
    },
  };
}
