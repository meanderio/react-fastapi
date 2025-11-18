import{ useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import api from './api'
import type { ColumnConfig } from '@components/dataframe/types'
import DataFrameTable from '@components/dataframe/DataFrameTable'
import PurchaseForm from '@components/PurchaseForm'

interface Purchase {
  location: string;
  amount: number;
  purchaser_id: number;
}

function App() {
  // const [count, setCount] = useState(0)
  const [purchase, setPurchase] = useState<Purchase>()
  
  const fetchPurchase = async () => {
    const response = await api.get('/api/purchases/1');
    console.log(response.data);
    setPurchase(response.data);
  };

  const data = [

    {
      date: "2025-11-15",
      store: "A",
      category: "Food",
      price: 12.5,
      conversion_rate: 0.0834,
      in_stock: true,
    },
    {
      date: "2025-11-16",
      store: "B",
      category: "Clothing",
      price: 44.99,
      conversion_rate: 0.125,
      in_stock: false,
    }, 
    {
      date: "2025-11-15",
      store: "C",
      category: "Tech",
      price: 52.42,
      conversion_rate: 0.14,
      in_stock: true,
    },
    {
      date: "2025-11-15",
      store: "D",
      category: "Tech",
      price: 120.25,
      conversion_rate: 0.125,
      in_stock: false,
    },
    {
      date: "2025-11-17",
      store: "C",
      category: "Food",
      price: 22.42,
      conversion_rate: 0.14,
      in_stock: true,
    },
    {
      date: "2025-11-16",
      store: "B",
      category: "Food",
      price: 12.25,
      conversion_rate: 0.125,
      in_stock: true,
    },
    {
      date: "2025-11-15",
      store: "A",
      category: "Food",
      price: 12.5,
      conversion_rate: 0.0834,
      in_stock: true,
    },
    {
      date: "2025-11-16",
      store: "B",
      category: "Clothing",
      price: 44.99,
      conversion_rate: 0.125,
      in_stock: false,
    }, 
    {
      date: "2025-11-15",
      store: "C",
      category: "Tech",
      price: 52.42,
      conversion_rate: 0.14,
      in_stock: true,
    },
    {
      date: "2025-11-15",
      store: "D",
      category: "Tech",
      price: 120.25,
      conversion_rate: 0.125,
      in_stock: false,
    },
    {
      date: "2025-11-17",
      store: "C",
      category: "Food",
      price: 22.42,
      conversion_rate: 0.14,
      in_stock: true,
    },
    {
      date: "2025-11-16",
      store: "B",
      category: "Food",
      price: 12.25,
      conversion_rate: 0.125,
      in_stock: true,
    },
  ];

  const columns: ColumnConfig[] = [
    {
      key: "date",
      label: "Date",
      type: "date",
      filter: "range", // date range filter
    },
    {
      key: "store",
      label: "Store",
      filter: "text",
    },
    {
      key: "category",
      label: "Category",
      filter: "text",
    },
    {
      key: "price",
      label: "Price ($)",
      type: "currency",
      align: "right",
      filter: "range", // numeric range filter
    },
    {
      key: "conversion_rate",
      label: "Conv. Rate",
      type: "percent",
      align: "right",
      filter: "range",
    },
    {
      key: "in_stock",
      label: "In Stock",
      type: "boolean",
      filter: "text", // e.g. filter by "True" / "False"
    },
  ];
  return (
    <>
      <div className="flex justify-center">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Purchases</h1>

        <PurchaseForm
          onSuccess={(purchase) => {
            console.log("Created purchase:", purchase);
            // e.g. refresh a table, invalidate SWR, etc.
          }}
        />
      </div>
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          DataFrame View
        </h1>
        <DataFrameTable
          data={data}
          columns={columns}
          caption="Sales Data"
          showRowIndex
          locale="en-US"
          currency="USD"
          percentDigits={1}
        />
      </div>
      <div className="card">
        <button className="bg-indigo-500 hover:bg-indigo-700 rounded-lg text-white py-2 px-2" onClick={() => fetchPurchase()}> Get Purchase
        </button>
        <div className="py-2">
          { purchase 
            ? (
              <div>
                <p>purchase location: {purchase.location}</p>
                <p>purchase amount: {purchase.amount}</p>
              </div>
            )
            : (<p> no purchase loaded </p>)
          }
        </div>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App;
