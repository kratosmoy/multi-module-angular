import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent } from 'ag-grid-community';

@Component({
  selector: 'app-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  standalone: true,
  imports: [AgGridAngular]
})
export class DynamicTableComponent {
  @Input() rowData: any[] = [];
  @Input() columnDefs: ColDef[] = [];
  @Input() isLoading = false;

  @Output() rowClicked = new EventEmitter<any>();

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100
  };

  onGridReady(params: GridReadyEvent) {
    // Optionally resize columns to fit when grid is ready
    if (this.columnDefs.length > 0) {
      params.api.sizeColumnsToFit();
    }
  }

  onRowClicked(event: any) {
    this.rowClicked.emit(event.data);
  }
}
