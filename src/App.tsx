import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import api from './api'

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

  //useEffect(() => {
  //  fetchPurchase();
  //}, []);

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
      <h1>Vite + React</h1>
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
