import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ColDef, GridReadyEvent, CellContextMenuEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);
import { MatMenuTrigger } from '@angular/material/menu';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface Trade {
  id: number;
  tradeType: string;
  tradeDate: string;
  amount: number;
  currency: string;
  counterparty: string;
}

export interface QueryTab {
  title: string;
  dataSource: Trade[];
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
    @Inject(MAT_DIALOG_DATA) public data: { columns: string[], numericColumns: string[], groupBy: string[], aggregateField: string }
  ) { }
}

@Component({
  standalone: false,
  selector: 'app-data-query',
  templateUrl: './data-query.component.html',
  styleUrl: './data-query.component.scss'
})
export class DataQueryComponent implements OnInit {
  displayedColumns: string[] = ['id', 'tradeType', 'tradeDate', 'amount', 'currency', 'counterparty'];
  colDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', filter: 'agNumberColumnFilter', maxWidth: 100, checkboxSelection: true, headerCheckboxSelection: true },
    { field: 'tradeType', headerName: 'Trade Type', filter: 'agTextColumnFilter' },
    { field: 'tradeDate', headerName: 'Trade Date', filter: 'agDateColumnFilter' },
    {
      field: 'amount',
      headerName: 'Amount',
      filter: 'agNumberColumnFilter',
      type: 'numericColumn',
      valueFormatter: params => params.value != null ? Number(params.value).toLocaleString() : ''
    },
    { field: 'currency', headerName: 'Currency', filter: 'agTextColumnFilter', maxWidth: 150 },
    { field: 'counterparty', headerName: 'Counterparty', filter: 'agTextColumnFilter' }
  ];
  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    sortable: true,
    filter: true,
    floatingFilter: true, // Shows individual column filter input row
    resizable: true
  };
  allData: Trade[] = [];
  queryTabs: QueryTab[] = [];
  selectedTabIndex = 0;
  tabCounter = 1;

  filters = {
    tradeType: '',
    currency: '',
    counterparty: '',
    startDate: this.getTodayString(),
    endDate: this.getTodayString()
  };

  parsedStartDate: Date | null = new Date();
  parsedEndDate: Date | null = new Date();

  @ViewChild('contextMenuTrigger') contextMenu!: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };

  constructor(private http: HttpClient, private dialog: MatDialog) { }

  getTodayString(): string {
    return this.formatDate(new Date());
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onStartDateChange(event: any) {
    this.parsedStartDate = event.value;
    this.filters.startDate = this.formatDate(event.value);
  }

  onEndDateChange(event: any) {
    this.parsedEndDate = event.value;
    this.filters.endDate = this.formatDate(event.value);
  }

  ngOnInit() {
    this.http.get<Trade[]>('/api/trades').subscribe(data => {
      this.allData = data || [];
    });
  }

  onSearch() {
    const filtered = this.allData.filter(trade => {
      const matchType = !this.filters.tradeType || (trade.tradeType && trade.tradeType.toLowerCase().includes(this.filters.tradeType.toLowerCase()));
      const matchCurrency = !this.filters.currency || (trade.currency && trade.currency.toLowerCase().includes(this.filters.currency.toLowerCase()));
      const matchCounterparty = !this.filters.counterparty || (trade.counterparty && trade.counterparty.toLowerCase().includes(this.filters.counterparty.toLowerCase()));

      let matchDate = true;
      if (trade.tradeDate) {
        if (this.filters.startDate && trade.tradeDate < this.filters.startDate) matchDate = false;
        if (this.filters.endDate && trade.tradeDate > this.filters.endDate) matchDate = false;
      } else if (this.filters.startDate || this.filters.endDate) {
        matchDate = false;
      }

      return matchType && matchCurrency && matchCounterparty && matchDate;
    });

    const criteria = [];
    if (this.filters.startDate || this.filters.endDate) {
      if (this.filters.startDate === this.filters.endDate) {
        criteria.push(`Date: ${this.filters.startDate}`);
      } else {
        criteria.push(`Date: ${this.filters.startDate || 'Any'} to ${this.filters.endDate || 'Any'}`);
      }
    }
    if (this.filters.tradeType) criteria.push(this.filters.tradeType);
    if (this.filters.currency) criteria.push(this.filters.currency);
    if (this.filters.counterparty) criteria.push(this.filters.counterparty);

    const title = criteria.length > 0 ? criteria.join(', ') : `Query ${this.tabCounter}`;
    this.tabCounter++;

    this.queryTabs.push({
      title: title,
      dataSource: filtered
    });
    this.selectedTabIndex = this.queryTabs.length - 1;
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
        numericColumns: ['amount', 'id'],
        groupBy: ['tradeType'],
        aggregateField: 'amount'
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
    const map = new Map<string, { sum: number, keys: any }>();
    currentData.forEach(trade => {
      const keysObj: any = {};
      groupBy.forEach(g => keysObj[g] = (trade as any)[g]);
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
    const aggregatedData: Trade[] = [];
    let idCounter = 1;
    map.forEach((value) => {
      const newTrade: any = { id: idCounter++, tradeType: '', tradeDate: '', amount: 0, currency: '', counterparty: '', ...value.keys };
      newTrade[aggregateField] = value.sum;
      aggregatedData.push(newTrade as Trade);
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
      valueFormatter: (params: any) => params.value != null ? Number(params.value).toLocaleString() : ''
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
    this.filters = {
      tradeType: '',
      currency: '',
      counterparty: '',
      startDate: this.getTodayString(),
      endDate: this.getTodayString()
    };
    this.parsedStartDate = new Date();
    this.parsedEndDate = new Date();
  }
}
