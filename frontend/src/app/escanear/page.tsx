'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine, ImagePlus, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/design-system/Button';
import { Card } from '@/design-system/Card';
import { Skeleton } from '@/design-system/Skeleton';

type Step = 'capture' | 'processing' | 'review';

interface ScannedItem { name: string; price: string }
interface ScannedData {
  store: string;
  date: string;
  total: string;
  items: ScannedItem[];
}

function toIsoDate(value: string | null): string {
  if (!value) return '';
  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return '';
  const [, day, month, rawYear] = match;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export default function EscanearPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('capture');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [saving, setSaving] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setScanError(null);
  };

  const handleCameraInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleGalleryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleScan = async () => {
    if (!file) return;
    setStep('processing');

    try {
      const formData = new FormData();
      formData.append('invoice', file);
      const result = await api.scanInvoice(formData) as any;
      const invoice = result?.data;
      if (!result?.success || !invoice || !invoice.total) {
        setScanError('No se pudo leer el total de esta factura. Prueba con una imagen mas nitida.');
        setStep('capture');
        return;
      }

      setScannedData({
        store: '',
        date: toIsoDate(invoice.date),
        total: String(invoice.total).replace(',', '.'),
        items: Array.isArray(invoice.items)
          ? invoice.items.map((item: any) => ({ name: item.name, price: String(item.price).replace(',', '.') }))
          : [],
      });
      setScanError(null);
      setStep('review');
    } catch {
      setScanError('No se pudo procesar la imagen. Intenta nuevamente.');
      setStep('capture');
    }
  };

  const handleSave = async () => {
    if (!scannedData) return;
    setSaving(true);
    try {
      const result = await api.saveInvoice({
        householdId: 'hogar_001',
        ...scannedData,
        total: Number(scannedData.total),
      });
      if (!result) {
        setScanError('No se pudo guardar la factura. Revisa los datos e intenta otra vez.');
        setSaving(false);
        return;
      }
      router.push('/');
    } catch {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('capture');
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setScannedData(null);
    setScanError(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">Escanear factura</h1>
          <p className="text-xs text-stone-400">Extrae datos automaticamente con OCR</p>
        </div>
      </div>

      {/* ── Step: Capture ── */}
      {step === 'capture' && (
        <Card variant="flat" padding={false} className="overflow-hidden">
          {scanError && <p role="alert" className="p-4 text-sm text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-300">{scanError}</p>}
          {/* Camera preview / dropzone */}
          <div className="relative bg-stone-100 dark:bg-stone-800 aspect-[3/4] flex items-center justify-center">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Vista previa" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-stone-400">
                {/* Guide frame overlay */}
                <svg width="180" height="240" viewBox="0 0 180 240" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="178" height="238" rx="8" stroke="currentColor" strokeWidth="2" strokeDasharray="10 6" />
                  {/* Corner accents */}
                  <path d="M1 30V8a7 7 0 0 1 7-7h22" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
                  <path d="M179 30V8a7 7 0 0 0-7-7h-22" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
                  <path d="M1 210v22a7 7 0 0 0 7 7h22" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
                  <path d="M179 210v22a7 7 0 0 1-7 7h-22" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <p className="text-sm font-medium">Enfoca tu factura aqui</p>
              </div>
            )}
          </div>

          <div className="p-4 space-y-3">
            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handleCameraInput}
              aria-label="Tomar foto"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleGalleryInput}
              aria-label="Elegir de galeria"
            />

            <Button
              variant="primary"
              size="md"
              fullWidth
              icon={<ScanLine className="h-4 w-4" />}
              onClick={() => cameraInputRef.current?.click()}
            >
              Tomar foto
            </Button>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              icon={<ImagePlus className="h-4 w-4" />}
              onClick={() => galleryInputRef.current?.click()}
            >
              Elegir de galeria
            </Button>

            {file && (
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleScan}
              >
                Extraer datos
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ── Step: Processing ── */}
      {step === 'processing' && (
        <Card variant="flat" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center">
              <ScanLine className="h-5 w-5 text-sky-500 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">Procesando OCR...</p>
              <p className="text-xs text-stone-400">Extrayendo datos de la imagen</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      )}

      {/* ── Step: Review ── */}
      {step === 'review' && scannedData && (
        <Card variant="flat" className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 p-3 bg-forest-50 dark:bg-forest-950 rounded-xl border border-forest-100 dark:border-forest-900">
            <CheckCircle2 className="h-4 w-4 text-forest-600 shrink-0" />
            <p className="text-sm text-forest-700 dark:text-forest-300 font-medium">
              Datos extraidos. Revisa y edita si es necesario.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="store" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Tienda
              </label>
              <input
                id="store"
                type="text"
                className="input-base"
                placeholder="No identificada"
                value={scannedData.store}
                onChange={(e) => setScannedData({ ...scannedData, store: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Fecha
                </label>
                <input
                  id="date"
                  type="date"
                  className="input-base"
                  value={scannedData.date}
                  onChange={(e) => setScannedData({ ...scannedData, date: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="total" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Total (Bs)
                </label>
                <input
                  id="total"
                  type="number"
                  inputMode="decimal"
                  className="input-base font-bold"
                  value={scannedData.total}
                  onChange={(e) => setScannedData({ ...scannedData, total: e.target.value })}
                />
              </div>
            </div>
          </div>

          {scannedData.items.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Items identificados ({scannedData.items.length})
              </h3>
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {scannedData.items.map((item, i) => (
                  <li key={i} className="flex justify-between py-2 text-sm">
                    <span className="text-stone-600 dark:text-stone-400">{item.name}</span>
                    <span className="text-stone-800 dark:text-stone-200 font-medium nums">
                      Bs {item.price}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={reset}
            >
              Reintentar
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              loading={saving}
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={handleSave}
            >
              Guardar compra
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
