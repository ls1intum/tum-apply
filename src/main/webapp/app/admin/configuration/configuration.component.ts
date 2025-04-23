import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import SharedModule from 'app/shared/shared.module';
import { SortByDirective, SortDirective, SortService, sortStateSignal } from 'app/shared/sort';

import { ConfigurationService } from './configuration.service';
import { Bean, PropertySource } from './configuration.model';

@Component({
  selector: 'jhi-configuration',
  templateUrl: './configuration.component.html',
  imports: [SharedModule, FormsModule, SortDirective, SortByDirective],
})
export default class ConfigurationComponent implements OnInit {
  allBeans = signal<Bean[] | undefined>(undefined);
  beansFilter = signal<string>('');
  propertySources = signal<PropertySource[]>([]);
  sortState = sortStateSignal({ predicate: 'prefix', order: 'asc' });
  private readonly sortService = inject(SortService);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  beans = computed(() => {
    let data = this.allBeans() ?? [];
    const beansFilter = this.beansFilter();
    if (beansFilter) {
      data = data.filter(bean => bean.prefix.toLowerCase().includes(beansFilter.toLowerCase()));
    }

    const { order, predicate } = this.sortState();
    if (predicate != null && order) {
      data = data.sort(this.sortService.startSort({ predicate, order }));
    }
    return data;
  });
  private readonly configurationService = inject(ConfigurationService);

  ngOnInit(): void {
    this.configurationService.getBeans().subscribe(beans => {
      this.allBeans.set(beans);
    });

    this.configurationService.getPropertySources().subscribe(propertySources => this.propertySources.set(propertySources));
  }
}
