"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductFormProps {
  initialData?: {
    name: string;
    description: string;
    price: string;
  };
  onSubmit: (data: {
    name: string;
    description?: string;
    price?: string;
  }) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: ProductFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [price, setPrice] = useState(initialData?.price ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      price: price || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Product Name *
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Organic Tomatoes"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Description
        </label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Vine-ripened heirloom tomatoes"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Price
        </label>
        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g., 4.50"
          pattern="^\d+(\.\d{1,2})?$"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          size="sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!name || isPending}
          className="flex-1 bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
          size="sm"
        >
          {isPending ? "Saving..." : initialData ? "Update" : "Add Product"}
        </Button>
      </div>
    </form>
  );
}
