import type { GTFSData, GTFSStop, GTFSRoute, GTFSTrip, GTFSStopTime } from './gtfs-parser';

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString';
    coordinates: number[] | number[][];
  };
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export function convertStopsToGeoJSON(stops: GTFSStop[]): GeoJSONFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stops.map(stop => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(stop.stop_lon), parseFloat(stop.stop_lat)]
      },
      properties: {
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        stop_code: stop.stop_code,
        location_type: stop.location_type,
        parent_station: stop.parent_station
      }
    }))
  };
}

export function convertRoutesToGeoJSON(gtfsData: GTFSData): GeoJSONFeatureCollection {
  const { routes, trips, stopTimes, stops } = gtfsData;
  const features: GeoJSONFeature[] = [];

  // Create a map for quick lookup
  const stopMap = new Map(stops.map(s => [s.stop_id, s]));

  // Group trips by route
  const tripsByRoute = new Map<string, GTFSTrip[]>();
  trips.forEach(trip => {
    if (!tripsByRoute.has(trip.route_id)) {
      tripsByRoute.set(trip.route_id, []);
    }
    tripsByRoute.get(trip.route_id)!.push(trip);
  });

  // For each route, create LineString features
  routes.forEach(route => {
    const routeTrips = tripsByRoute.get(route.route_id) || [];

    // Use the first trip to get the route geometry
    if (routeTrips.length > 0) {
      const trip = routeTrips[0];

      // Get stop times for this trip, sorted by stop_sequence
      const tripStopTimes = stopTimes
        .filter(st => st.trip_id === trip.trip_id)
        .sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));

      // Convert to coordinates
      const coordinates: number[][] = [];
      tripStopTimes.forEach(st => {
        const stop = stopMap.get(st.stop_id);
        if (stop) {
          coordinates.push([parseFloat(stop.stop_lon), parseFloat(stop.stop_lat)]);
        }
      });

      if (coordinates.length >= 2) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates
          },
          properties: {
            route_id: route.route_id,
            route_short_name: route.route_short_name,
            route_long_name: route.route_long_name,
            route_type: route.route_type,
            route_color: route.route_color || '0000FF',
            route_text_color: route.route_text_color || 'FFFFFF'
          }
        });
      }
    }
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

export function getMapBounds(stops: GTFSStop[]): [[number, number], [number, number]] | null {
  if (stops.length === 0) return null;

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  stops.forEach(stop => {
    const lon = parseFloat(stop.stop_lon);
    const lat = parseFloat(stop.stop_lat);

    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });

  return [[minLon, minLat], [maxLon, maxLat]];
}
