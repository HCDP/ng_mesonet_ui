import { Component, Input, Output, EventEmitter } from '@angular/core';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import { CommonModule } from '@angular/common';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatExpansionModule} from '@angular/material/expansion';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-multi-selector',
  standalone: true,
  imports: [MatInputModule, MatIconModule, MatButtonModule, CommonModule, MatCheckboxModule, MatExpansionModule, ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './multi-selector.component.html',
  styleUrl: './multi-selector.component.scss'
})
export class MultiSelectorComponent {
  @Input() type: string = "";
  @Input() set values(values: any[]) {
    this.setValues(values);
  }
  @Input() getLabel: (value: any) => string = (value: any) => "";
  @Input() match: (searchValue: string, dataValue: any) => boolean = (searchValue: string, dataValue: any) => false;
  @Input() loading: boolean = false;

  @Output() selected: EventEmitter<any[]> = new EventEmitter<any>();

  selectedValues: Set<GroupSelector> = new Set<GroupSelector>();
  allValues: GroupSelector[] = [];
  filteredValues: GroupSelector[] = [];

  public searchControl = new FormControl<string>("");

  massSelectData = {
    debounce: false,
    control: new FormControl<boolean>(false)
  };

  constructor() {
    this.massSelectData.control.valueChanges.subscribe((selected: boolean | null) => {
      if(!this.massSelectData.debounce) {
        this.massSelectData.debounce = true;
        selected ? this.selectAll() : this.clearSelected();
        this.sendValues();
      }
      this.massSelectData.debounce = false;
    });

    this.searchControl.valueChanges.subscribe((value: string | null) => {
      this.filteredValues = value ? this.allValues.filter((selector: GroupSelector) => {
        let station = selector.value;
        return this.match(value, station);
      }) : this.allValues;
    });
  }

  setValues(values: any[]) {
    this.allValues = values.map((value: any) => {
      let control = <FormControl<boolean>>(new FormControl<boolean>(false));
      let selector = {
        value: value,
        control: control
      };
      //need to unsubscribe ref change?
      control.valueChanges.subscribe((selected: boolean) => {
        if(selected) {
          this.selectedValues.add(selector);
        }
        else {
          this.selectedValues.delete(selector);
        }
        if(!this.massSelectData.debounce) {
          this.massSelectData.debounce = true;
          this.massSelectData.control.setValue(this.selectedValues.size == this.allValues.length);
          this.sendValues();
        }
      });
      return selector;
    });
    this.filteredValues = this.allValues;
  }

  clearSelected() {
    for(let selector of this.selectedValues) {
      selector.control.setValue(false);
    }
  }
  selectAll() {
    for(let selector of this.allValues) {
      selector.control.setValue(true);
    }
  }

  sendValues() {
    let values = Array.from(this.selectedValues).map((selector: GroupSelector) => {
      return selector.value;
    });
    this.selected.next(values);
  }

  test() {
    console.log(document.activeElement);
  }
}

interface GroupSelector {
  value: any,
  control: FormControl<boolean>
}