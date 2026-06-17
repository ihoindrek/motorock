"use client";

import { ControlPosition, MapControl, useMap } from "@vis.gl/react-google-maps";
import { useCallback } from "react";

const MIN_ZOOM = 10;
const MAX_ZOOM = 21;

export function ContactMapZoomControls() {
  const map = useMap();

  const zoomIn = useCallback(() => {
    if (!map) return;
    const nextZoom = Math.min((map.getZoom() ?? 17) + 1, MAX_ZOOM);
    map.setZoom(nextZoom);
  }, [map]);

  const zoomOut = useCallback(() => {
    if (!map) return;
    const nextZoom = Math.max((map.getZoom() ?? 17) - 1, MIN_ZOOM);
    map.setZoom(nextZoom);
  }, [map]);

  return (
    <MapControl position={ControlPosition.RIGHT_CENTER}>
      <div className="mr-3 flex flex-col overflow-hidden rounded-sm border border-white/60 bg-white shadow-sm">
        <button
          type="button"
          onClick={zoomIn}
          aria-label="Suumi sisse"
          className="flex h-10 w-10 items-center justify-center border-b border-ink/10 font-body text-xl font-extrabold leading-none text-ink transition-colors hover:bg-paper"
        >
          +
        </button>
        <button
          type="button"
          onClick={zoomOut}
          aria-label="Suumi välja"
          className="flex h-10 w-10 items-center justify-center font-body text-xl font-extrabold leading-none text-ink transition-colors hover:bg-paper"
        >
          −
        </button>
      </div>
    </MapControl>
  );
}
