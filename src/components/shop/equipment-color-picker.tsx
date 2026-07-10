import type { ProductColorOption } from "@/types/catalog-product";
import { getColorSwatchStyle } from "@/lib/shop/product-color-swatches";

type EquipmentColorPickerProps = {
  options: readonly ProductColorOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
};

function optionValue(option: ProductColorOption) {
  return option.value ?? option.label;
}

export function EquipmentColorPicker({
  options,
  value,
  onChange,
  label,
}: EquipmentColorPickerProps) {
  const selectedLabel = options.find(
    (option) => optionValue(option) === value,
  )?.label;

  return (
    <div>
      <p className="text-xs font-medium text-ink">
        {label}
        {selectedLabel ? (
          <span className="font-normal text-ink/60"> · {selectedLabel}</span>
        ) : null}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const key = optionValue(option);
          const selected = value === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={selected}
              aria-label={option.label}
              title={option.label}
              className={`size-8 shrink-0 overflow-hidden border transition-colors sm:size-9 ${
                selected
                  ? "border-ink ring-1 ring-ink ring-offset-1"
                  : "border-ink/20 hover:border-ink"
              }`}
              style={getColorSwatchStyle(option)}
            />
          );
        })}
      </div>
    </div>
  );
}
