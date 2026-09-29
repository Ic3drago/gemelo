'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Escanear() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleScan = () => {
    if (!file) return;
    setIsScanning(true);
    
    // Mock OCR scan
    setTimeout(() => {
      setIsScanning(false);
      setScannedData({
        store: 'Supermercado Hipermaxi',
        date: new Date().toISOString().split('T')[0],
        total: '345.50',
        items: [
          { name: 'Leche 1L', price: '7.50' },
          { name: 'Pan integral', price: '12.00' },
          { name: 'Manzanas (kg)', price: '15.50' }
        ]
      });
    }, 2000);
  };

  const handleSave = () => {
    // mock save
    router.push('/');
  };

  return (
    <div className="max-w-md mx-auto pb-20 pt-4">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-800">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Registrar Compra</h1>
      </div>

      {!scannedData ? (
        <div className="clean-card p-6 text-center">
          <p className="text-gray-600 mb-6">Sube o toma una foto de tu recibo para extraer los datos automáticamente.</p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6 relative hover:border-green-400 transition bg-gray-50">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {preview ? (
              <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded" />
            ) : (
              <div className="text-gray-400">
                <span className="text-4xl block mb-2">📷</span>
                <span className="font-medium text-sm">Tocar para tomar foto</span>
              </div>
            )}
          </div>

          <button 
            onClick={handleScan}
            disabled={!file || isScanning}
            className={`w-full p-3 rounded-xl font-medium text-white transition ${
              !file || isScanning ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isScanning ? 'Escaneando...' : 'Extraer Datos'}
          </button>
        </div>
      ) : (
        <div className="clean-card p-6 animate-fade-in">
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 text-sm flex items-center">
            <span className="mr-2">✨</span> Datos extraídos con éxito. Revisa y edita si es necesario.
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tienda</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={scannedData.store}
                onChange={e => setScannedData({...scannedData, store: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input 
                  type="date" 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  value={scannedData.date}
                  onChange={e => setScannedData({...scannedData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total (Bs)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-green-700"
                  value={scannedData.total}
                  onChange={e => setScannedData({...scannedData, total: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2 border-b pb-1">Items Identificados</h3>
            <ul className="text-sm space-y-2">
              {scannedData.items.map((item: any, i: number) => (
                <li key={i} className="flex justify-between text-gray-600">
                  <span>{item.name}</span>
                  <span>Bs {item.price}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => { setScannedData(null); setFile(null); setPreview(null); }}
              className="px-4 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              Reintentar
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 bg-green-600 text-white p-3 rounded-xl font-medium hover:bg-green-700 transition"
            >
              Guardar Compra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
