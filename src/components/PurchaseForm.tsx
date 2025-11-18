import React, { useState } from "react";
import api from "../api";

type PurchaseFormValues = {
  date: string;
  store: string;
  category: string;
  amount: string; // keep as string for input; convert to number on submit
  notes: string;
};

type PurchaseFormErrors = Partial<Record<keyof PurchaseFormValues, string>>;

interface PurchaseFormProps {
  /** Optional callback when the request succeeds */
  onSuccess?: (createdPurchase: any) => void;
  /** Optional callback when the request fails */
  onError?: (error: Error) => void;
}

export function PurchaseForm(props: PurchaseFormProps) {
  const { onSuccess, onError } = props;

  const [values, setValues] = useState<PurchaseFormValues>({
    date: "",
    store: "",
    category: "",
    amount: "",
    notes: "",
  });

  const [errors, setErrors] = useState<PurchaseFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setValues(function (prev) {
      return { ...prev, [name]: value };
    });

    // clear field-level error as user edits
    setErrors(function (prev) {
      const copy = { ...prev };
      delete copy[name as keyof PurchaseFormValues];
      return copy;
    });

    // clear messages
    setServerError(null);
    setSuccessMessage(null);
  }

  function validate(values: PurchaseFormValues): PurchaseFormErrors {
    const newErrors: PurchaseFormErrors = {};

    if (!values.date) {
      newErrors.date = "Date is required.";
    }

    if (!values.store.trim()) {
      newErrors.store = "Store is required.";
    }

    if (!values.category.trim()) {
      newErrors.category = "Category is required.";
    }

    if (!values.amount.trim()) {
      newErrors.amount = "Amount is required.";
    } else {
      const n = Number(values.amount);
      if (Number.isNaN(n) || n <= 0) {
        newErrors.amount = "Amount must be a positive number.";
      }
    }

    return newErrors;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      //date: values.date,                   // string (YYYY-MM-DD)
      location: values.store.trim(),
      //category: values.category.trim(),
      amount: Number(values.amount),
      user_id: 1,
      //notes: values.notes.trim() || null,  // optional
    };

    try {
      setIsSubmitting(true);

      const response = await api.post('/api/purchases/', payload);
      if (response.status != 200) {
        const message = `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      let data: any = null;
      try {
        data = await response.data;
      } catch {
        data = null;
      }

      setSuccessMessage("Purchase saved successfully.");
      setValues({
        date: "",
        store: "",
        category: "",
        amount: "",
        notes: "",
      });
      setErrors({});

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err: any) {
      const e = err instanceof Error ? err : new Error("Unknown error");
      setServerError(e.message || "An error occurred while saving the purchase.");
      if (onError) onError(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        New Purchase
      </h2>

      {/* Date */}
      <div className="space-y-1">
        <label
          htmlFor="date"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          value={values.date}
          onChange={handleChange}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        {errors.date && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.date}</p>
        )}
      </div>

      {/* Store */}
      <div className="space-y-1">
        <label
          htmlFor="store"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Store
        </label>
        <input
          id="store"
          name="store"
          type="text"
          value={values.store}
          onChange={handleChange}
          placeholder="e.g. Trader Joe's"
          className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        {errors.store && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.store}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Category
        </label>
        <input
          id="category"
          name="category"
          type="text"
          value={values.category}
          onChange={handleChange}
          placeholder="e.g. Groceries"
          className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        {errors.category && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {errors.category}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Amount
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-gray-400 dark:text-gray-500">
            $
          </span>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={values.amount}
            onChange={handleChange}
            placeholder="0.00"
            className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 pl-6 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
        {errors.amount && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {errors.amount}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={values.notes}
          onChange={handleChange}
          placeholder="Any extra context…"
          className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </div>

      {/* Alerts */}
      {serverError && (
        <div className="rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 px-3 py-2 text-xs text-red-800 dark:text-red-200">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
          {successMessage}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md border border-transparent bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          {isSubmitting ? "Saving…" : "Save Purchase"}
        </button>
      </div>
    </form>
  );
}

export default PurchaseForm;
