<script lang="ts">
  import { MapLibre, GeoJSONSource, LineLayer, CircleLayer, NavigationControl } from 'svelte-maplibre-gl';
  import type { GTFSData, GTFSStop } from './gtfs-parser';
  import { convertStopsToGeoJSON, convertRoutesToGeoJSON, getMapBounds } from './gtfs-to-geojson';

  export let gtfsData: GTFSData | null = null;
  export let onStopClick: ((stop: GTFSStop) => void) | undefined = undefined;

  let stopsGeoJSON: any = null;
  let routesGeoJSON: any = null;
  let center: [number, number] = [139.6917, 35.6895]; // Tokyo default
  let zoom = 10;
  let bounds: [[number, number], [number, number]] | undefined = undefined;

  $: if (gtfsData && gtfsData.stops.length > 0) {
    stopsGeoJSON = convertStopsToGeoJSON(gtfsData.stops);
    routesGeoJSON = convertRoutesToGeoJSON(gtfsData);
    const mapBounds = getMapBounds(gtfsData.stops);
    bounds = mapBounds ?? undefined;
  }

  function handleStopClick(e: any) {
    console.log('Stop clicked!', e);
    const features = e.features;
    if (!features || features.length === 0) {
      console.log('No features found');
      return;
    }

    const feature = features[0];
    const properties = feature.properties;
    console.log('Stop properties:', properties);

    // Find the full stop object
    const stop = gtfsData?.stops.find(s => s.stop_id === properties?.stop_id);
    console.log('Found stop:', stop);

    if (stop && onStopClick) {
      console.log('Calling onStopClick callback');
      onStopClick(stop);
    } else {
      console.log('No stop found or no callback', { stop, hasCallback: !!onStopClick });
    }
  }
</script>

<div class="map-container">
  <MapLibre
    style={{
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
    }}
    {center}
    {zoom}
    {bounds}
    fitBoundsOptions={{ padding: 50, maxZoom: 15 }}
    class="map-gl"
  >
    <NavigationControl position="top-right" />

    {#if routesGeoJSON}
      <GeoJSONSource id="routes" data={routesGeoJSON}>
        <LineLayer
          paint={{
            'line-color': ['concat', '#', ['get', 'route_color']],
            'line-width': 3,
            'line-opacity': 0.7
          }}
        />
      </GeoJSONSource>
    {/if}

    {#if stopsGeoJSON}
      <GeoJSONSource id="stops" data={stopsGeoJSON}>
        <CircleLayer
          id="stops-layer"
          paint={{
            'circle-radius': 6,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#2563eb',
            'circle-stroke-width': 2
          }}
          onclick={handleStopClick}
        />
      </GeoJSONSource>
    {/if}
  </MapLibre>
</div>

<style>
  .map-container {
    width: 100%;
    height: 600px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  :global(.map-gl) {
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
