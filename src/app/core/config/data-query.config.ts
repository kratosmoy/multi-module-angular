import { ColDef } from 'ag-grid-community';

export interface FilterField {
  name: string;
  label: string;
  type: string;
}

export interface DataQueryConfig {
  id: string;
  name: string;
  description: string;
  bgStyle: string;
  logo: string;

  apiEndpoint: string;
  metricEndpoint: string;
  colDefs: ColDef[];
  filterFields: FilterField[];
  numericColumns: string[];
  groupByFields: string[];
}

export const BuiltinModules: Record<string, DataQueryConfig> = {
  xms: {
    id: 'xms',
    name: 'XMS Module (Trades)',
    description: 'Query and view XMS Trades data.',
    bgStyle: 'linear-gradient(135deg, #1b539c 0%, #089fd1 100%)',
    logo: 'XMS',
    apiEndpoint: '/api/trades',
    metricEndpoint: '/api/trades/metric',
    filterFields: [
      { name: 'tradeType', label: 'Trade Type', type: 'string' },
      { name: 'currency', label: 'Currency', type: 'string' },
      { name: 'counterparty', label: 'Counterparty', type: 'string' }
    ],
    numericColumns: ['amount', 'id'],
    groupByFields: ['tradeType', 'currency', 'counterparty'],
    colDefs: [
      {
        field: 'id',
        headerName: 'ID',
        filter: 'agNumberColumnFilter',
        maxWidth: 100,
        checkboxSelection: true,
        headerCheckboxSelection: true
      },
      { field: 'tradeType', headerName: 'Trade Type', filter: 'agTextColumnFilter' },
      { field: 'tradeDate', headerName: 'Trade Date', filter: 'agDateColumnFilter' },
      {
        field: 'amount',
        headerName: 'Amount',
        filter: 'agNumberColumnFilter',
        type: 'numericColumn',
        valueFormatter: params => (params.value != null ? Number(params.value).toLocaleString() : '')
      },
      { field: 'currency', headerName: 'Currency', filter: 'agTextColumnFilter', maxWidth: 150 },
      { field: 'counterparty', headerName: 'Counterparty', filter: 'agTextColumnFilter' }
    ]
  },
  libra: {
    id: 'libra',
    name: 'Libra Module (Assets)',
    description: 'Query and view CryptoAssets data.',
    bgStyle: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
    logo: 'LIB',
    apiEndpoint: '/api/cryptoassets',
    metricEndpoint: '/api/cryptoassets/metric',
    filterFields: [{ name: 'symbol', label: 'Symbol', type: 'string' }],
    numericColumns: ['marketCap', 'id'],
    groupByFields: ['symbol'],
    colDefs: [
      {
        field: 'id',
        headerName: 'ID',
        filter: 'agNumberColumnFilter',
        maxWidth: 100,
        checkboxSelection: true,
        headerCheckboxSelection: true
      },
      { field: 'symbol', headerName: 'Symbol', filter: 'agTextColumnFilter' },
      {
        field: 'marketCap',
        headerName: 'Market Cap',
        filter: 'agNumberColumnFilter',
        type: 'numericColumn',
        valueFormatter: params => (params.value != null ? Number(params.value).toLocaleString() : '')
      },
      { field: 'listingDate', headerName: 'Listing Date', filter: 'agDateColumnFilter' }
    ]
  }
};
