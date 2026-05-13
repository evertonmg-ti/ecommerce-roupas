"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type CatalogSearchAutocompleteProps = {
  suggestions: string[];
  defaultValue?: string;
  name?: string;
  placeholder?: string;
};

export function CatalogSearchAutocomplete({
  suggestions,
  defaultValue,
  name = "search",
  placeholder = "Buscar por produto, categoria ou estilo..."
}: CatalogSearchAutocompleteProps) {
  const [value, setValue] = useState(defaultValue ?? "");

  const filteredSuggestions = useMemo(() => {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return suggestions.slice(0, 6);
    }

    return suggestions
      .filter((item) => item.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [suggestions, value]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-[1.5rem] border border-espresso/15 bg-sand px-4 py-3">
        <Search className="h-4 w-4 text-espresso/45" />
        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full bg-transparent outline-none"
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      {filteredSuggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {filteredSuggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setValue(item)}
              className="rounded-full border border-espresso/10 bg-white px-3 py-1 text-xs text-espresso/70"
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
