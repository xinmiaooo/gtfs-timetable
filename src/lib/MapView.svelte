<script lang="ts">
  import { onMount } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import type { GTFSData } from './gtfs-parser';
  import { convertStopsToGeoJSON, convertRoutesToGeoJSON, getMapBounds } from './gtfs-to-geojson';

  export let gtfsData: GTFSData | null = null;

  console.log('MapView initialized with GTFS data:', gtfsData);

  let mapContainer: HTMLDivElement;
  let map: maplibregl.Map | null = null;
  let mapLoaded = false;

  onMount(() => {
    // Initialize the map
    map = new maplibregl.Map({
      container: mapContainer,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [139.6917, 35.6895], // Tokyo default
      zoom: 10
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Wait for the map style to load before adding sources and layers
    map.on('load', () => {
      mapLoaded = true;
      if (gtfsData && gtfsData.stops.length > 0) {
        updateMapData();
      }
    });

    return () => {
      map?.remove();
    };
  });

  $: if (mapLoaded && map && gtfsData && gtfsData.stops.length > 0) {
    updateMapData();
  }

  function updateMapData() {
    if (!map || !gtfsData) return;

    // Remove existing layers and sources
    if (map.getLayer('routes')) map.removeLayer('routes');
    if (map.getLayer('stops')) map.removeLayer('stops');
    if (map.getSource('routes')) map.removeSource('routes');
    if (map.getSource('stops')) map.removeSource('stops');

    // Convert GTFS data to GeoJSON
    const stopsGeoJSON = convertStopsToGeoJSON(gtfsData.stops);
    const routesGeoJSON = convertRoutesToGeoJSON(gtfsData);

    // Add routes layer
    map.addSource('routes', {
      type: 'geojson',
      data: routesGeoJSON
    });

    map.addLayer({
      id: 'routes',
      type: 'line',
      source: 'routes',
      paint: {
        'line-color': ['concat', '#', ['get', 'route_color']],
        'line-width': 3,
        'line-opacity': 0.7
      }
    });

    // Add stops layer
    map.addSource('stops', {
      type: 'geojson',
      data: stopsGeoJSON
    });

    map.addLayer({
      id: 'stops',
      type: 'circle',
      source: 'stops',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ffffff',
        'circle-stroke-color': '#2563eb',
        'circle-stroke-width': 2
      }
    });

    // Add popup on click
    map.on('click', 'stops', (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const coordinates = (feature.geometry as any).coordinates.slice();
      const properties = feature.properties;

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div style="font-family: sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${properties?.stop_name || 'Unknown'}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">Stop ID: ${properties?.stop_id || 'N/A'}</p>
            ${properties?.stop_code ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Code: ${properties.stop_code}</p>` : ''}
          </div>
        `)
        .addTo(map!);
    });

    // Add popup on hover for routes
    map.on('click', 'routes', (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const properties = feature.properties;

      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
              ${properties?.route_short_name || properties?.route_long_name || 'Unknown Route'}
            </h3>
            ${properties?.route_long_name && properties?.route_short_name ?
              `<p style="margin: 0; font-size: 12px; color: #666;">${properties.route_long_name}</p>` : ''}
          </div>
        `)
        .addTo(map!);
    });

    // Change cursor on hover
    map.on('mouseenter', 'stops', () => {
      map!.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'stops', () => {
      map!.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', 'routes', () => {
      map!.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'routes', () => {
      map!.getCanvas().style.cursor = '';
    });

    // Fit map to bounds
    const bounds = getMapBounds(gtfsData.stops);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }
</script>

<div class="map-container">
  <div bind:this={mapContainer} class="map"></div>
</div>

<style>
  .map-container {
    width: 100%;
    height: 600px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .map {
    width: 100%;
    height: 100%;
  }

  :global(.maplibregl-popup-content) {
    padding: 12px;
    border-radius: 6px;
  }

  :global(.maplibregl-popup-close-button) {
    font-size: 18px;
    padding: 4px 8px;
  }
</style>
