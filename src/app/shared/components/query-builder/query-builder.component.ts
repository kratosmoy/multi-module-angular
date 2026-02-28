import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface QueryCondition {
  field: string;
  operator: string;
  value: any;
}

@Component({
  selector: 'app-query-builder',
  templateUrl: './query-builder.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class QueryBuilderComponent implements OnInit {
  @Input() availableFields: { name: string; label: string; type: string }[] = [];
  @Output() querySubmit = new EventEmitter<QueryCondition[]>();

  queryForm!: FormGroup;
  operators = ['=', '!=', '>', '<', 'LIKE', 'IN'];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.queryForm = this.fb.group({
      conditions: this.fb.array([])
    });
    this.addCondition();
  }

  get conditions() {
    return this.queryForm.get('conditions') as FormArray;
  }

  addCondition() {
    const conditionGroup = this.fb.group({
      field: ['', Validators.required],
      operator: ['=', Validators.required],
      value: ['', Validators.required]
    });
    this.conditions.push(conditionGroup);
  }

  removeCondition(index: number) {
    this.conditions.removeAt(index);
    if (this.conditions.length === 0) {
      this.addCondition();
    }
  }

  onSubmit() {
    if (this.queryForm.valid) {
      this.querySubmit.emit(this.queryForm.value.conditions);
    } else {
      Object.keys(this.queryForm.controls).forEach(key => {
        this.queryForm.get(key)?.markAsTouched();
      });
    }
  }
}
