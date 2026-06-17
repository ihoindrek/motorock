"use client";

import { Slider, SliderThumb } from "@/components/ui/slider";
import { formatPrice } from "@/lib/shop/category";

type PriceRangeSliderProps = {
  bounds: { min: number; max: number };
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
};

function getStep(min: number, max: number) {
  const span = max - min;

  if (span > 500) {
    return 10;
  }

  if (span > 100) {
    return 5;
  }

  return 1;
}

export function PriceRangeSlider({
  bounds,
  value,
  onValueChange,
}: PriceRangeSliderProps) {
  const step = getStep(bounds.min, bounds.max);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 font-display text-sm font-bold uppercase tracking-wide text-ink">
        <span>{formatPrice(value[0])}</span>
        <span className="text-ink/25" aria-hidden="true">
          —
        </span>
        <span>{formatPrice(value[1])}</span>
      </div>

      <Slider
        min={bounds.min}
        max={bounds.max}
        step={step}
        minStepsBetweenThumbs={0}
        value={value}
        onValueChange={onValueChange}
        aria-label="Price range"
      >
        <SliderThumb aria-label="Minimum price" />
        <SliderThumb aria-label="Maximum price" />
      </Slider>
    </div>
  );
}
