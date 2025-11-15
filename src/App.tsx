import { useState, useEffect } from 'react'
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
    const response = await api.get('/api/purchases/2');
    console.log(response.data);
    setPurchase(response.data);
  };

  const data = [
    { date: "2025-11-15", store: "A", category: "Food", price: 12.5 },
    { date: "2025-11-15", store: "B", category: "Clothing", price: 44.99 },
    { date: "2025-11-16", store: "A", category: "Electronics", price: null },
    { date: "2025-11-15", store: "A", category: "Food", price: 12.5 },
    { date: "2025-11-15", store: "B", category: "Clothing", price: 44.99 },
    { date: "2025-11-16", store: "A", category: "Electronics", price: null },
    { date: "2025-11-15", store: "A", category: "Food", price: 12.5 },
    { date: "2025-11-15", store: "B", category: "Clothing", price: 44.99 },
    { date: "2025-11-16", store: "A", category: "Electronics", price: null },
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
        showRowIndex={true}
        rowsPerPageOptions={[5, 10, 25]}
        defaultRowsPerPage={5}
      />
    </div>
      <div className="card">
        <button className="bg-indigo-500 hover:bg-indigo-700 hover:ring-2 hover:ring-red-500 rounded-lg text-white py-2 px-2 ease-in-out hover:shadow-xl hover:shadow-red-500" onClick={() => fetchPurchase()}> Get Purchase
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
