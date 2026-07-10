"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { ContactMapMarker } from "@/components/contact/contact-map-marker";
import { ContactMapViewport } from "@/components/contact/contact-map-viewport";
import { ContactMapZoomControls } from "@/components/contact/contact-map-zoom-controls";
import { contactMapGrayStyles } from "@/components/contact/contact-map-styles";
import { SHOWROOM_MAP_VIEW_MOBILE } from "@/data/showroom";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const mapCenter = {
  lat: SHOWROOM_MAP_VIEW_MOBILE.latitude,
  lng: SHOWROOM_MAP_VIEW_MOBILE.longitude,
};

export function ContactMapGoogle() {
  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-detail px-6 text-center text-sm text-ink/60">
        Lisa <code className="mx-1">.env.local</code> faili{" "}
        <code className="mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={mapCenter}
        defaultZoom={SHOWROOM_MAP_VIEW_MOBILE.zoom}
        gestureHandling="greedy"
        disableDefaultUI
        mapTypeControl={false}
        zoomControl={false}
        clickableIcons={false}
        mapTypeId="roadmap"
        className="contact-map-google h-full w-full"
        styles={contactMapGrayStyles}
      >
        <ContactMapViewport />
        <ContactMapMarker />
        <ContactMapZoomControls />
      </Map>
    </APIProvider>
  );
}
