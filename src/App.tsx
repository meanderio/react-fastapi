import{ useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import api from './api'
import DataFrameTable from './DataFrameTable'

interface Purchase {
  location: string;
  amount: number;
  purchaser_id: number;
}

function App() {
  const [count, setCount] = useState(0)
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
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          DataFrame View
        </h1>
        <DataFrameTable
          data={data}
          caption="Sales Data"
          showRowIndex
          locale="en-US"
          currency="USD"
          percentDigits={1}
          columnTypes={{
            // Example: force a specific type if you don't like inference
            price: "currency",
            conversion_rate: "percent",
          }}
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
