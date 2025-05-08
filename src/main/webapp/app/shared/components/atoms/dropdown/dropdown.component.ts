import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

export interface City {
  name: string;
  code: string;
}

@Component({
  selector: 'jhi-dropdown',
  standalone: true,
  imports: [ReactiveFormsModule, DropdownModule, FormsModule, CommonModule, FontAwesomeModule],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
})
export class DropdownComponent implements OnInit {
  readonly faChevronDown = faChevronDown;
  @ViewChild('filterInput') filterInput!: ElementRef;

  // Input properties
  @Input() items: any[] = [];
  @Input() placeholder: string = 'Input';
  @Input() label: string = 'Label';
  @Input() displayField: string = 'name';
  @Input() valueField: string = 'code';
  @Input() showFilter: boolean = true;
  @Input() filterPlaceholder: string = 'Search...';

  // Output events
  @Output() selected = new EventEmitter<City>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  // Component properties
  filteredItems: any[] = [];
  selectedItem: any;
  isOpen = false;
  filterValue = '';

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // If no items provided, use default cities
    if (!this.items || this.items.length === 0) {
      this.items = [
        { name: 'New York', code: 'NY' },
        { name: 'Rome', code: 'RM' },
        { name: 'London', code: 'LDN' },
        { name: 'Istanbul', code: 'IST' },
        { name: 'Paris', code: 'PRS' },
      ];
    }

    this.filteredItems = [...this.items];
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      // Focus the filter input when dropdown opens
      setTimeout(() => {
        if (this.filterInput && this.showFilter) {
          this.filterInput.nativeElement.focus();
        }
      });
      this.opened.emit();
    } else {
      // Reset filter when dropdown closes
      this.resetFilter();
      this.closed.emit();
    }
  }

  selectItem(item: any) {
    this.selectedItem = item;
    this.isOpen = false;
    this.resetFilter();
    this.selected.emit(item);
  }

  filterItems(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterValue = query;

    this.filteredItems = this.items.filter(item =>
      String((item as any)[this.displayField])
        .toLowerCase()
        .includes(query),
    );
  }

  resetFilter() {
    this.filterValue = '';
    this.filteredItems = [...this.items];
  }

  // Method to get display value based on displayField
  getDisplayValue(item: any): string {
    return item ? item[this.displayField] : this.placeholder;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target) && this.isOpen) {
      this.isOpen = false;
      this.resetFilter();
      this.closed.emit();
    }
  }
}
