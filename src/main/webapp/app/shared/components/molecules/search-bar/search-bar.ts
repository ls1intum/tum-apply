import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'jhi-search-bar',
  imports: [FormsModule, InputTextModule, IconFieldModule, InputIconModule, FontAwesomeModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar {
  searchText = input<string | undefined>(undefined);

  searchOutput = output<string>();

  inputText = '';

  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  onSearch(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.searchOutput.emit(this.inputText);
    }, 300);
  }
}
