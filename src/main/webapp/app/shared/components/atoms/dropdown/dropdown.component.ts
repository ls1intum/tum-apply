import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'jhi-dropdown',
  standalone: true,
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  imports: [DropdownModule, FontAwesomeModule, FormsModule, CommonModule],
  encapsulation: ViewEncapsulation.None,
})
export class DropdownComponent {
  @Input() items: any[] = [];
  @Input() selected: any;
  @Input() label: string = '';
  @Input() placeholder: string = 'Select...';
  @Input() disabled = false;
  @Input() labelField = 'name';
  @Input() valueField = 'value';
  @Input() iconField?: string; // For singular icons
  @Input() prefixIcon?: string; // For placeholder
  @Input() labelPosition: 'top' | 'left' = 'top';
  @Input() width: string = '50%';

  @Output() selectedChange = new EventEmitter<any>();

  isOpen = false;
  protected readonly faChevronUp = faChevronUp;
  protected readonly faChevronDown = faChevronDown;

  onSelectionChange(value: any): void {
    this.selected = value;
    this.selectedChange.emit(value);
  }
}
