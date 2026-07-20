import 'server-only';
import Papa from 'papaparse';
import { ImportResult, ProductInsert } from '@/types/superadmin';

// Aliases for the unique identifier field → maps to internal key 'sku'
export const SKU_ALIASES = [
  'sku', 'código', 'codigo', 'clave', 'id_producto', 'producto_id',
  'vin', 'lote', 'stock_number', 'numero_lote', 'número_lote',
  'numero_de_lote', 'número_de_lote'
];

// Aliases for the display name field → maps to internal key 'name'
export const NAME_ALIASES = [
  'nombre', 'name', 'producto', 'titulo', 'título', 'descripcion',
  'descripción', 'modelo'
];

// Helper to normalize headers
export function normalizeHeader(header: string): string {
  const lower = header.toLowerCase().trim();
  if (SKU_ALIASES.includes(lower)) return 'sku';
  if (NAME_ALIASES.includes(lower)) return 'name';
  if (['descripcion_larga', 'description', 'detalle'].includes(lower)) return 'description';
  if (['precio', 'price', 'precio_venta'].includes(lower)) return 'price';
  if (['costo', 'precio_costo', 'cost_price', 'precio_de_costo'].includes(lower)) return 'cost_price';
  if (['stock_minimo', 'min_stock', 'stock_mínimo'].includes(lower)) return 'min_stock';
  if (['unidad', 'unit', 'unidad_de_medida'].includes(lower)) return 'unit';
  if (['categoria', 'categoría', 'category'].includes(lower)) return 'category';
  if (['imagen_url', 'image_url', 'imagen', 'foto'].includes(lower)) return 'image_url';
  return lower;
}

// Helper to parse numbers properly, handling "$1,200.50"
export function parseNumeric(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

export interface ParseCsvResult {
  success: boolean;
  result: ImportResult & { importedCount?: number };
  parsedProducts: ProductInsert[];
  errorResponse?: { error: string; status: number };
}

export async function parseCsvData(file: File, company_id: number): Promise<ParseCsvResult> {
  const text = await file.text();
  const firstLine = text.split(/\r?\n/)[0] || '';
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  const parseResult = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    delimiter,
    transformHeader: normalizeHeader
  });

  // Only abort on truly critical PapaParse errors
  const criticalParseErrors = parseResult.errors.filter(
    (e: any) => e.type === 'Delimiter' || e.type === 'FieldMismatch'
  );
  if (criticalParseErrors.length > 0) {
    const detail = criticalParseErrors.map((e: any) => `${e.type} (fila ${e.row ?? '?'}): ${e.message}`).join('; ');
    return {
      success: false,
      result: { valid: false, totalRows: 0, validRows: 0, errors: [] },
      parsedProducts: [],
      errorResponse: {
        error: `Error al parsear el CSV: ${detail}. Verifica que el archivo sea un CSV válido con separador de coma (,) o punto y coma (;).`,
        status: 400
      }
    };
  }

  const rows = parseResult.data as Record<string, any>[];

  if (rows.length === 0) {
    return {
      success: false,
      result: { valid: false, totalRows: 0, validRows: 0, errors: [] },
      parsedProducts: [],
      errorResponse: { error: 'El archivo CSV está vacío o no tiene datos válidos.', status: 400 }
    };
  }

  if (rows.length > 2000) {
    return {
      success: false,
      result: { valid: false, totalRows: 0, validRows: 0, errors: [] },
      parsedProducts: [],
      errorResponse: { error: 'El archivo CSV supera el límite de 2,000 filas permitidas por archivo.', status: 400 }
    };
  }

  // Detect missing required columns before processing rows
  const detectedHeaders = Object.keys(rows[0]);
  const hasSku = detectedHeaders.includes('sku');
  const hasName = detectedHeaders.includes('name');
  const missingCols: string[] = [];
  if (!hasSku) missingCols.push('identificador único (sku, código, VIN, lote, stock_number…)');
  if (!hasName) missingCols.push('nombre (nombre, name, título, modelo…)');
  if (missingCols.length > 0) {
    return {
      success: false,
      result: { valid: false, totalRows: rows.length, validRows: 0, errors: [] },
      parsedProducts: [],
      errorResponse: {
        error: `Columnas requeridas no encontradas: ${missingCols.join(' | ')}. Columnas detectadas en el archivo: ${detectedHeaders.join(', ')}.`,
        status: 400
      }
    };
  }

  const result: ImportResult & { importedCount?: number } = {
    valid: true,
    totalRows: rows.length,
    validRows: 0,
    errors: []
  };

  const parsedProducts: ProductInsert[] = [];
  const skuSet = new Set<string>();
  let hasCriticalError = false;

  // Strict Validation per row
  rows.forEach((row, index) => {
    const rowIndex = index + 2; // +1 for 0-index, +1 for header row
    
    const sku = row.sku?.toString().trim();
    const name = row.name?.toString().trim();

    if (!sku) {
      result.errors.push({ row: rowIndex, error: 'SKU es obligatorio' });
      hasCriticalError = true;
    }

    if (!name) {
      result.errors.push({ row: rowIndex, error: 'Nombre es obligatorio' });
      hasCriticalError = true;
    }

    if (sku && skuSet.has(sku)) {
      result.errors.push({ row: rowIndex, error: `SKU duplicado en el CSV: ${sku}` });
      hasCriticalError = true;
    }
    if (sku) skuSet.add(sku);

    const price = parseNumeric(row.price);
    if (price !== null && price < 0) {
      result.errors.push({ row: rowIndex, error: `Precio no puede ser negativo (${row.price})` });
      hasCriticalError = true;
    }

    const cost_price = parseNumeric(row.cost_price);
    if (cost_price !== null && cost_price < 0) {
      result.errors.push({ row: rowIndex, error: `Costo no puede ser negativo (${row.cost_price})` });
      hasCriticalError = true;
    }

    // Default stock/min_stock logic
    const rawStock = parseNumeric(row.stock);
    const stock = rawStock !== null && rawStock >= 0 ? Math.floor(rawStock) : 0;
    if (rawStock !== null && rawStock < 0) {
        result.errors.push({ row: rowIndex, error: `Stock no puede ser negativo (${row.stock})` });
        hasCriticalError = true;
    }
    
    const rawMinStock = parseNumeric(row.min_stock);
    const min_stock = rawMinStock !== null && rawMinStock >= 0 ? Math.floor(rawMinStock) : 0;
    if (rawMinStock !== null && rawMinStock < 0) {
        result.errors.push({ row: rowIndex, error: `Stock mínimo no puede ser negativo (${row.min_stock})` });
        hasCriticalError = true;
    }

    if (!hasCriticalError) {
      result.validRows++;
      parsedProducts.push({
        company_id,
        sku: sku || '',
        name: name || '',
        description: row.description?.toString().trim() || null,
        price,
        cost_price,
        stock,
        min_stock,
        unit: row.unit?.toString().trim() || null,
        category: row.category?.toString().trim() || null,
        image_url: row.image_url?.toString().trim() || null,
        is_active: true,
        source: 'csv',
        metadata: {}
      });
    }
  });

  if (hasCriticalError || result.errors.length > 0) {
    result.valid = false;
    return {
      success: false,
      result,
      parsedProducts: []
    };
  }

  return { success: true, result, parsedProducts };
}
