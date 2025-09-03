import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-search-filter-sort-bar',
  imports: [FormsModule, InputTextModule, IconFieldModule, InputIconModule, FontAwesomeModule, TranslateModule, TranslateDirective],
  templateUrl: './search-filter-sort-bar.html',
  styleUrl: './search-filter-sort-bar.scss',
})
export class SearchFilterSortBar {
  // total number of records found
  totalRecords = input<number>(0);
  searchText = input<string | undefined>(undefined);

  // translation keys used for the total number of records found
  // those fields should already be translated within the parent component
  singleEntity = input.required<string>();
  multipleEntities = input.required<string>();

  searchOutput = output<string>();

  // text entered in the search input field
  inputText = '';

  onSearch(): void {
    this.searchOutput.emit(this.inputText);
  }
}
