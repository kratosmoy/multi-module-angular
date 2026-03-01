import { Component, OnInit, ViewChild, Inject, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ColDef, GridReadyEvent, CellContextMenuEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);
import { MatMenuTrigger } from '@angular/material/menu';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DataQueryConfig } from '../../core/config/data-query.config';
import { QueryCondition } from '../../shared/components/query-builder/query-builder.component';

export interface QueryTab {
  title: string;
  dataSource: any[];
  colDefs?: ColDef[];
}

@Component({
  standalone: false,
  selector: 'app-aggregation-dialog',
  template: `
    <h2 mat-dialog-title>Aggregate Data</h2>
    <mat-dialog-content style="display: flex; flex-direction: column; gap: 16px; padding-top: 16px;">
      <mat-form-field appearance="outline">
        <mat-label>Group By Fields</mat-label>
        <mat-select [(ngModel)]="data.groupBy" multiple>
          <mat-option *ngFor="let col of data.columns" [value]="col">{{ col }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Aggregate Field</mat-label>
        <mat-select [(ngModel)]="data.aggregateField">
          <mat-option *ngFor="let col of data.numericColumns" [value]="col">{{ col }}</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="data">Aggregate</button>
    </mat-dialog-actions>
  `
})
export class AggregationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AggregationDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { columns: string[]; numericColumns: string[]; groupBy: string[]; aggregateField: string }
  ) {}
}

@Component({
  standalone: false,
  selector: 'app-data-query',
  templateUrl: './data-query.component.html',
  styleUrl: './data-query.component.scss'
})
export class DataQueryComponent implements OnInit {
  @Input() config!: DataQueryConfig;

  displayedColumns: string[] = [];
  colDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    sortable: true,
    filter: true,
    floatingFilter: true, // Shows individual column filter input row
    resizable: true
  };
  allData: any[] = [];
  queryTabs: QueryTab[] = [];
  selectedTabIndex = 0;
  tabCounter = 1;

  @ViewChild('contextMenuTrigger') contextMenu!: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };

  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    if (!this.config) {
      console.warn('DataQueryComponent initialized without config');
      return;
    }

    this.colDefs = this.config.colDefs;
    this.displayedColumns = this.config.colDefs.map(c => c.field).filter(f => !!f) as string[];

    // Only load initial empty or base dataset if necessary. For now, pull all data:
    this.http.get<any[]>(this.config.apiEndpoint).subscribe(data => {
      this.allData = data || [];
      // create initial tab
      this.queryTabs.push({
        title: 'All Data',
        dataSource: this.allData
      });
    });
  }

  onQuerySubmit(conditions: QueryCondition[]) {
    const criteria = conditions.map(c => `${c.field} ${c.operator} ${c.value}`);
    const title = criteria.length > 0 ? criteria.join(', ') : `Query ${this.tabCounter}`;
    this.tabCounter++;

    // Create a loading tab first
    this.queryTabs.push({
      title: title + ' (Loading...)',
      dataSource: [],
      colDefs: this.colDefs
    });
    const newTabIndex = this.queryTabs.length - 1;
    this.selectedTabIndex = newTabIndex;

    // Send dynamic query payload to backend. We assume a POST to /query is supported by the EntityRegistry.
    // If we only have basic GET, this might need adapting. For now let's POST the conditions.
    const queryPayload = { conditions };

    this.http.post<any[]>(`${this.config.apiEndpoint}/query`, queryPayload).subscribe({
      next: data => {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        // if the request resolves synchronously (e.g., from cache or interceptor)
        setTimeout(() => {
          this.queryTabs[newTabIndex].title = title;
          this.queryTabs[newTabIndex].dataSource = data || [];
          if (this.gridApis[newTabIndex]) {
            this.gridApis[newTabIndex].setGridOption('rowData', data || []);
          }
        });
      },
      error: err => {
        console.warn('Backend query failed, falling back to local filtering for demonstration.', err);
        // Fallback: Local filtering
        const filtered = this.allData.filter(row => {
          for (const cond of conditions) {
            const val = row[cond.field];
            if (cond.operator === '=' && val != cond.value) return false;
            if (cond.operator === '!=' && val == cond.value) return false;
            if (cond.operator === '>' && val <= cond.value) return false;
            if (cond.operator === '<' && val >= cond.value) return false;
            if (cond.operator === 'LIKE' && String(val).toLowerCase().indexOf(String(cond.value).toLowerCase()) === -1)
              return false;
            if (cond.operator === 'IN') {
              const list = String(cond.value)
                .split(',')
                .map(s => s.trim());
              if (!list.includes(String(val))) return false;
            }
          }
          return true;
        });

        // Use setTimeout to prevent NG0100 error when the error resolves synchronously
        setTimeout(() => {
          this.queryTabs[newTabIndex].title = title + ' (Local)';
          this.queryTabs[newTabIndex].dataSource = filtered;
          if (this.gridApis[newTabIndex]) {
            this.gridApis[newTabIndex].setGridOption('rowData', filtered);
          }
        });
      }
    });
  }

  onContextMenu(event: CellContextMenuEvent) {
    if (event.event) {
      event.event.preventDefault();
      this.contextMenuPosition.x = (event.event as MouseEvent).clientX + 'px';
      this.contextMenuPosition.y = (event.event as MouseEvent).clientY + 'px';
      setTimeout(() => {
        this.contextMenu.openMenu();
      }, 0);
    }
  }

  openAggregateDialog() {
    const dialogRef = this.dialog.open(AggregationDialogComponent, {
      width: '400px',
      data: {
        columns: this.displayedColumns,
        numericColumns: this.config.numericColumns || [],
        groupBy: this.config.groupByFields || [],
        aggregateField: this.config.numericColumns?.[0] || ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.aggregateData(result.groupBy, result.aggregateField);
      }
    });
  }

  aggregateData(groupBy: string[], aggregateField: string) {
    if (this.queryTabs.length === 0 || !groupBy || groupBy.length === 0) return;

    // Get the current visible data
    let currentData = this.queryTabs[this.selectedTabIndex].dataSource;
    const api = this.gridApis[this.selectedTabIndex];
    let titlePrefix = 'Agg';

    if (api) {
      const selectedNodes = api.getSelectedNodes();
      if (selectedNodes && selectedNodes.length > 0) {
        currentData = selectedNodes.map((node: any) => node.data);
        titlePrefix = 'Sel. Agg';
      } else {
        const rowData: any[] = [];
        api.forEachNodeAfterFilter((node: any) => rowData.push(node.data));
        currentData = rowData.length > 0 ? rowData : currentData;
      }
    }

    // Perform grouping and aggregation
    const map = new Map<string, { sum: number; keys: any }>();
    currentData.forEach(trade => {
      const keysObj: any = {};
      groupBy.forEach(g => (keysObj[g] = (trade as any)[g]));
      const keyString = JSON.stringify(keysObj);
      const val = Number((trade as any)[aggregateField]) || 0;

      const existing = map.get(keyString);
      if (existing) {
        existing.sum += val;
      } else {
        map.set(keyString, { sum: val, keys: keysObj });
      }
    });

    // Create a new data source based on aggregated results
    const aggregatedData: any[] = [];
    let idCounter = 1;
    map.forEach(value => {
      const newEntity: any = {
        id: idCounter++,
        ...value.keys
      };
      newEntity[aggregateField] = value.sum;
      aggregatedData.push(newEntity);
    });

    const aggColDefs: ColDef[] = groupBy.map(g => ({
      field: g,
      headerName: this.colDefs.find(c => c.field === g)?.headerName || g,
      filter: 'agTextColumnFilter',
      maxWidth: 350
    }));

    aggColDefs.push({
      field: aggregateField,
      headerName: `Sum of ${this.colDefs.find(c => c.field === aggregateField)?.headerName || aggregateField}`,
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',
      maxWidth: 350,
      valueFormatter: (params: any) => (params.value != null ? Number(params.value).toLocaleString() : '')
    });

    this.tabCounter++;
    this.queryTabs.push({
      title: `${titlePrefix}: sum(${aggregateField}) by ${groupBy.join(', ')}`,
      dataSource: aggregatedData,
      colDefs: aggColDefs
    });
    this.selectedTabIndex = this.queryTabs.length - 1;
  }

  gridApis: any[] = [];
  onGridReady(params: GridReadyEvent, tabIndex: number) {
    this.gridApis[tabIndex] = params.api;
  }

  applyTabFilter(event: Event, tabIndex: number) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.gridApis[tabIndex]) {
      this.gridApis[tabIndex].setGridOption('quickFilterText', filterValue);
    }
  }

  closeTab(index: number, event: Event) {
    event.stopPropagation();
    this.queryTabs.splice(index, 1);

    if (this.selectedTabIndex === index) {
      this.selectedTabIndex = Math.max(0, index - 1);
    } else if (this.selectedTabIndex > index) {
      this.selectedTabIndex--;
    }
  }

  onReset() {
    // If you need specific reset behavior for forms, implement it here or via ViewChild queryBuilder
  }
}
