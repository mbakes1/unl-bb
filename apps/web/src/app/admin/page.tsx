// apps/web/src/app/admin/page.tsx
'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [message, setMessage] = useState('');

  const startBackfill = async () => {
    setIsBackfilling(true);
    setMessage('Starting backfill...');
    
    try {
      const response = await fetch('/api/admin/ingest-historical-page', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
      } else {
        setMessage(`Error: ${response.statusText}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsBackfilling(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-2">Historical Data Backfill</h2>
        <p className="mb-4">Click the button below to start the historical data backfill process.</p>
        <button
          onClick={startBackfill}
          disabled={isBackfilling}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isBackfilling ? 'Backfilling...' : 'Start Backfill'}
        </button>
        {message && (
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}