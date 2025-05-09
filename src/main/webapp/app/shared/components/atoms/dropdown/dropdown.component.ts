import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

export interface Item {
  name: string;
  value: string;
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

  @Input() placeholder: string = 'Select an option...';
  @Input() label: string = 'Dropdown';
  @Input() items: any[] = [];
  @Input() displayField: string = 'name';
  @Input() valueField: string = 'value';
  @Input() selected: any;
  @Output() selectedChange = new EventEmitter<any>();

  allItems: any[] = [];
  isOpen = false;

  ngOnInit(): void {
    this.allItems = [...this.items];
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectItem(item: any): void {
    this.selected = item;
    this.selectedChange.emit(item);
    this.isOpen = false;
  }

  getDisplayValue(item: any): string {
    return item ? item[this.displayField] : this.placeholder;
  }
}

// PrimeNG Dropdown Component

// import { Component } from '@angular/core';
// import { DropdownModule } from 'primeng/dropdown';
// import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
// import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';

// interface DropdownItem {
//   name: string;
//   value: any;
// }

// @Component({
//   selector: 'jhi-dropdown',
//   standalone: true,
//   imports: [FormsModule, CommonModule, FontAwesomeModule, DropdownModule],
//   templateUrl: './dropdown.component.html',
//   styleUrls: ['./dropdown.component.scss'],
// })
// export class DropdownComponent {
//   readonly faChevronDown = faChevronDown;
//   readonly faChevronUp = faChevronUp;

//   placeholderText = 'Select a Location...';

//   // Logic for displaying the dropdown chevronup and chevrondown icons
//   isOpen = false;

//   onShow() {
//     this.isOpen = true;
//   }

//   onHide() {
//     this.isOpen = false;
//   }

//   options: DropdownItem[] = [
//     { name: 'Garching Campus', value: 'GARCHING' },
//     { name: 'Garching Hochbrueck Campus', value: 'GARCHING_HOCHBRUECK' },
//     { name: 'Heilbronn Campus', value: 'HEILBRONN' },
//     { name: 'Munich Campus', value: 'MUNICH' },
//     { name: 'Straubing Campus', value: 'STRAUBING' },
//     { name: 'Weihenstephan Campus', value: 'WEIHENSTEPHAN' },
//     { name: 'Singapore Campus', value: 'SINGAPORE' }
//   ];

//   value: any;
// }
