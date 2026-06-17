type MapStyle = {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number | boolean>>;
};

export const contactMapGrayStyles: MapStyle[] = [
  {
    featureType: "all",
    elementType: "all",
    stylers: [{ saturation: -100 }],
  },
  {
    featureType: "administrative",
    elementType: "all",
    stylers: [{ saturation: -100 }],
  },
  {
    featureType: "landscape",
    elementType: "all",
    stylers: [{ saturation: -100 }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "all",
    stylers: [{ visibility: "on" }, { saturation: -100 }, { gamma: 1 }],
  },
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ saturation: -100 }, { visibility: "off" }],
  },
  {
    featureType: "poi.business",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "geometry.fill",
    stylers: [{ saturation: -100 }, { visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#e3e3e3" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ saturation: -100 }],
  },
  {
    featureType: "road.highway",
    elementType: "all",
    stylers: [{ saturation: -100 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ saturation: -3 }, { color: "#e2e2e2" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ saturation: -100 }],
  },
  {
    featureType: "transit",
    elementType: "labels.text",
    stylers: [{ saturation: -100 }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ saturation: -100 }],
  },
  {
    featureType: "water",
    elementType: "all",
    stylers: [{ saturation: -100 }],
  },
];
