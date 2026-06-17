"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { SHOWROOM } from "@/data/showroom";

const MARKER_SIZE = 80;

function createPulseOverlay(lat: number, lng: number) {
  return class PulseOverlay extends google.maps.OverlayView {
    private readonly latLng = new google.maps.LatLng({ lat, lng });
    private container: HTMLDivElement | null = null;

    onAdd() {
      this.container = document.createElement("div");
      this.container.style.position = "absolute";
      this.container.style.pointerEvents = "none";
      this.container.style.width = `${MARKER_SIZE}px`;
      this.container.style.height = `${MARKER_SIZE}px`;
      this.container.innerHTML = `
        <div class="contact-map-marker__wrap">
          <span class="contact-map-marker__ping" aria-hidden="true"></span>
          <span class="contact-map-marker__ring" aria-hidden="true"></span>
          <span class="contact-map-marker__dot" aria-hidden="true"></span>
        </div>
      `;
      this.getPanes()?.overlayMouseTarget.appendChild(this.container);
    }

    draw() {
      if (!this.container) return;
      const point = this.getProjection()?.fromLatLngToDivPixel(this.latLng);
      if (!point) return;
      this.container.style.left = `${point.x}px`;
      this.container.style.top = `${point.y}px`;
      this.container.style.transform = "translate(-50%, -50%)";
    }

    onRemove() {
      this.container?.remove();
      this.container = null;
    }
  };
}

export function ContactMapMarker() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const PulseOverlay = createPulseOverlay(
      SHOWROOM.latitude,
      SHOWROOM.longitude,
    );
    const pulse = new PulseOverlay();
    pulse.setMap(map);

    return () => {
      pulse.setMap(null);
    };
  }, [map]);

  return null;
}
