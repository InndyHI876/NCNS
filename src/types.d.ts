declare namespace GeoJSON {
  interface Feature {
    type: 'Feature';
    geometry: Geometry;
    properties: any;
    id?: string | number;
  }

  interface Geometry {
    type: string;
    coordinates: any;
  }

  interface FeatureCollection {
    type: 'FeatureCollection';
    features: Feature[];
  }
}

declare module '@turf/bbox' {
  const bbox: (geojson: any) => [number, number, number, number];
  export default bbox;
}

declare module '@turf/turf' {
  export function bboxPolygon(bbox: [number, number, number, number]): GeoJSON.Feature;
  export function booleanIntersects(feature1: any, feature2: any): boolean;
  export function bbox(geojson: any): [number, number, number, number];
  export function featureCollection(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection;
} 