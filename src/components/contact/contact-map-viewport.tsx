"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import {
  SHOWROOM_MAP_VIEW,
  SHOWROOM_MAP_VIEW_MOBILE,
} from "@/data/showroom";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

function applyMapViewport(map: google.maps.Map, isDesktop: boolean) {
  const view = isDesktop ? SHOWROOM_MAP_VIEW : SHOWROOM_MAP_VIEW_MOBILE;

  map.setCenter({ lat: view.latitude, lng: view.longitude });
  map.setZoom(view.zoom);
}

export function ContactMapViewport() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => applyMapViewport(map, media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [map]);

  return null;
}
