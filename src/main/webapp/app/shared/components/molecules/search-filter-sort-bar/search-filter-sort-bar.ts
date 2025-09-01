import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-search-filter-sort-bar',
  imports: [FormsModule, InputTextModule, IconFieldModule, InputIconModule, FontAwesomeModule],
  templateUrl: './search-filter-sort-bar.html',
  styleUrl: './search-filter-sort-bar.scss',
})
export class SearchFilterSortBar {
  searchText = input<string | undefined>(undefined);
  inputText = '';

  onSearch(): void {}
}
