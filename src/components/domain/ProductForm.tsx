"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productInputSchema, ProductInput, ProductRow } from "@/types/products";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, AlertCircle } from "lucide-react";

interface ProductFormProps {
  initialData?: Partial<ProductRow>;
  onSubmit: (data: ProductInput) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

export default function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.input<typeof productInputSchema>>({
    resolver: zodResolver(productInputSchema),
    defaultValues: {
      sku: initialData?.sku || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price ?? null,
      cost_price: initialData?.cost_price ?? null,
      stock: initialData?.stock ?? 0,
      min_stock: initialData?.min_stock ?? 0,
      unit: initialData?.unit || "",
      category: initialData?.category || "",
      image_url: initialData?.image_url || "",
      is_active: initialData?.is_active ?? true,
    },
  });

  const handleSubmit = async (data: z.input<typeof productInputSchema>) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Usamos el parse para obtener el tipo de salida real (z.output / ProductInput)
      const parsedData = productInputSchema.parse(data);
      const result = await onSubmit(parsedData);
      if (!result.success) {
        setSubmitError(result.error || "Ocurrió un error al guardar el producto");
      } else if (onCancel) {
        // Cierra el formulario en caso de éxito
        onCancel();
      }
    } catch (err: any) {
      setSubmitError(err.message || "Error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {submitError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{submitError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SKU y Nombre */}
        <div className="space-y-2">
          <Label className="text-zinc-300">SKU / Identificador <span className="text-red-400">*</span></Label>
          <Input 
            {...form.register("sku")} 
            disabled={!!initialData?.id} // Normalmente el SKU no se edita después de creado para evitar desastres
            placeholder="Ej: PROD-001"
            className="bg-black/50 border-white/10 text-white" 
          />
          {errors.sku && <p className="text-xs text-red-400">{errors.sku.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Nombre del Producto <span className="text-red-400">*</span></Label>
          <Input 
            {...form.register("name")} 
            placeholder="Ej: Filtro de Aceite"
            className="bg-black/50 border-white/10 text-white" 
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>

        {/* Descripción (Ocupa 2 columnas) */}
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-zinc-300">Descripción</Label>
          <textarea 
            {...form.register("description")} 
            placeholder="Descripción detallada del producto..."
            className="flex w-full rounded-md px-3 py-2 text-sm bg-black/50 border border-white/10 text-white h-20 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50" 
          />
        </div>

        {/* Precios */}
        <div className="space-y-2">
          <Label className="text-zinc-300">Precio de Venta</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <Input 
              type="number" step="0.01" min="0"
              {...form.register("price", { valueAsNumber: true })} 
              className="bg-black/50 border-white/10 text-white pl-8" 
            />
          </div>
          {errors.price && <p className="text-xs text-red-400">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Costo</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <Input 
              type="number" step="0.01" min="0"
              {...form.register("cost_price", { valueAsNumber: true })} 
              className="bg-black/50 border-white/10 text-white pl-8" 
            />
          </div>
          {errors.cost_price && <p className="text-xs text-red-400">{errors.cost_price.message}</p>}
        </div>

        {/* Stock */}
        <div className="space-y-2">
          <Label className="text-zinc-300">Stock Actual</Label>
          <Input 
            type="number" step="1" min="0"
            {...form.register("stock", { valueAsNumber: true })} 
            className="bg-black/50 border-white/10 text-white" 
          />
          {errors.stock && <p className="text-xs text-red-400">{errors.stock.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Stock Mínimo (Alerta)</Label>
          <Input 
            type="number" step="1" min="0"
            {...form.register("min_stock", { valueAsNumber: true })} 
            className="bg-black/50 border-white/10 text-white" 
          />
          {errors.min_stock && <p className="text-xs text-red-400">{errors.min_stock.message}</p>}
        </div>

        {/* Categoría y Unidad */}
        <div className="space-y-2">
          <Label className="text-zinc-300">Categoría</Label>
          <Input 
            {...form.register("category")} 
            placeholder="Ej: Repuestos"
            className="bg-black/50 border-white/10 text-white" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Unidad de Medida</Label>
          <Input 
            {...form.register("unit")} 
            placeholder="Ej: Pieza, Caja, Litro"
            className="bg-black/50 border-white/10 text-white" 
          />
        </div>

        {/* Imagen */}
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-zinc-300">URL de Imagen</Label>
          <Input 
            {...form.register("image_url")} 
            placeholder="https://..."
            className="bg-black/50 border-white/10 text-white" 
          />
          {errors.image_url && <p className="text-xs text-red-400">{errors.image_url.message}</p>}
        </div>

        {/* Estado */}
        <div className="space-y-2 sm:col-span-2 flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
          <div>
            <Label className="text-zinc-300">Estado del Producto</Label>
            <p className="text-xs text-zinc-500">Si lo desactivas, no estará disponible para venta.</p>
          </div>
          <Switch 
            checked={form.watch("is_active")}
            onCheckedChange={(val) => form.setValue("is_active", val)}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} className="text-zinc-400 hover:text-white">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? "Guardando..." : "Guardar Producto"}
        </Button>
      </div>
    </form>
  );
}
