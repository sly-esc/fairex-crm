'use client';

import { useState } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function InventoryPage() {
  const { _hasHydrated } = useAppStore();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvRowErrors, setCsvRowErrors] = useState<{ row: number; error: string }[]>([]);
  const [csvSuccess, setCsvSuccess] = useState<{ importedCount: number } | null>(null);

  const handleInventoryUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    setCsvError(null);
    setCsvRowErrors([]);
    setCsvSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      // NOTE: company_id is deliberately NOT sent here. The backend extracts it from the session.

      const res = await fetch('/api/inventory/import-csv', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success && json.data?.valid) {
        setCsvSuccess({ importedCount: json.data.importedCount ?? json.data.validRows ?? 0 });
        setCsvFile(null);
      } else if (json.data?.errors?.length > 0) {
        setCsvRowErrors(json.data.errors);
        setCsvError('El CSV tiene errores de validación. Corrígelos y vuelve a intentar.');
      } else {
        setCsvError(json.error || 'Error al procesar el archivo CSV.');
      }
    } catch (err: any) {
      setCsvError(err.message || 'Error de red al subir el archivo.');
    }
    setCsvLoading(false);
  };

  if (!_hasHydrated) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Inventario</h1>
        <p className="text-zinc-400 mt-2 text-lg">
          Sube tu archivo CSV para actualizar el catálogo de productos, precios y stock en tiempo real.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-1">Actualizar Inventario CSV</h3>
            <p className="text-sm text-zinc-400 mb-3">
              Máx 5 MB / 2,000 filas por subida. Los productos se actualizarán según su identificador único.
            </p>
            <div className="bg-zinc-800/60 border border-white/10 rounded-lg p-4 text-xs text-zinc-400 space-y-1">
              <p className="text-zinc-300 font-medium mb-2">📌 Columnas requeridas</p>
              <p><span className="text-indigo-300 font-mono">Identificador único</span> — puede llamarse: <span className="font-mono">sku</span>, <span className="font-mono">código</span>, <span className="font-mono">VIN</span>, <span className="font-mono">lote</span>, <span className="font-mono">stock_number</span>, <span className="font-mono">clave</span>, <span className="font-mono">id_producto</span></p>
              <p><span className="text-indigo-300 font-mono">Nombre</span> — puede llamarse: <span className="font-mono">nombre</span>, <span className="font-mono">name</span>, <span className="font-mono">título</span>, <span className="font-mono">modelo</span>, <span className="font-mono">producto</span></p>
              <p className="text-zinc-500 pt-1">Columnas opcionales: precio, costo, stock, stock_minimo, unidad, categoria, imagen_url</p>
              <p className="text-zinc-500">Separadores soportados: coma (<span className="font-mono">,</span>) o punto y coma (<span className="font-mono">;</span>)</p>
            </div>
          </div>

          {csvSuccess ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-emerald-400 font-medium">{csvSuccess.importedCount} producto(s) importados correctamente.</p>
              <button
                onClick={() => { setCsvSuccess(null); setCsvError(null); setCsvRowErrors([]); }}
                className="text-sm text-zinc-400 hover:text-white underline transition-colors"
              >
                Subir otro archivo
              </button>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div className="relative border-2 border-dashed border-white/20 rounded-xl p-10 bg-black/20 hover:bg-black/30 transition-colors flex flex-col items-center justify-center group">
                <input
                  type="file"
                  accept=".csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setCsvFile(f);
                    setCsvError(null);
                    setCsvRowErrors([]);
                    setCsvSuccess(null);
                  }}
                />
                <UploadCloud className="w-10 h-10 text-zinc-500 mb-3 group-hover:text-indigo-400 transition-colors" />
                {csvFile ? (
                  <>
                    <p className="text-white font-medium text-sm">{csvFile.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">{(csvFile.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <p className="text-zinc-400 text-sm">Haz clic o arrastra un archivo CSV aquí</p>
                )}
              </div>

              {/* Validation errors */}
              {csvError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
                  <p className="font-medium mb-2">{csvError}</p>
                  {csvRowErrors.length > 0 && (
                    <ul className="max-h-48 overflow-y-auto list-disc pl-5 space-y-1 text-xs">
                      {csvRowErrors.map((e, i) => (
                        <li key={i}>Fila {e.row}: {e.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleInventoryUpload}
                disabled={csvLoading || !csvFile}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {csvLoading ? 'Validando y actualizando...' : 'Validar y actualizar inventario'}
                {!csvLoading && <UploadCloud className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
