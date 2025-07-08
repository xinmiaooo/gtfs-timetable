<script lang="ts">
  import type { GTFSStop, GTFSData, GTFSStopTime, GTFSTrip, GTFSRoute } from './gtfs-parser.js';
  import { createEventDispatcher } from 'svelte';

  export let stop: GTFSStop;
  export let gtfsData: GTFSData;
  export let visible = false;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  interface TimetableEntry {
    time: string;
    tripId: string;
    headsign: string;
    routeName: string;
    routeColor?: string;
    routeId: string;
    hour: number;
    minute: number;
  }

  interface RouteGroup {
    route: GTFSRoute;
    entries: TimetableEntry[];
    hourlyGroups: HourlyGroup[];
  }

  interface HourlyGroup {
    hour: number;
    entries: TimetableEntry[];
  }

  let timetableEntries: TimetableEntry[] = [];
  let routeGroups: RouteGroup[] = [];
  let selectedDate = new Date().toISOString().split('T')[0];
  let sortBy: 'time' | 'route' = 'time';
  let selectedRouteId: string | null = null;

  $: if (visible && stop && gtfsData) {
    generateTimetable();
  }

  function generateTimetable() {
    // Get all stop times for this stop
    const stopTimes = gtfsData.stopTimes.filter(st => st.stop_id === stop.stop_id);
    
    const entries: TimetableEntry[] = [];
    
    for (const stopTime of stopTimes) {
      // Find the trip
      const trip = gtfsData.trips.find(t => t.trip_id === stopTime.trip_id);
      if (!trip) continue;
      
      // Find the route
      const route = gtfsData.routes.find(r => r.route_id === trip.route_id);
      if (!route) continue;
      
      const timeStr = stopTime.departure_time || stopTime.arrival_time;
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      entries.push({
        time: timeStr,
        tripId: stopTime.trip_id,
        headsign: stopTime.stop_headsign || trip.trip_headsign || '方向不明',
        routeName: route.route_short_name || route.route_long_name || route.route_id,
        routeColor: route.route_color,
        routeId: route.route_id,
        hour: hours,
        minute: minutes
      });
    }
    
    timetableEntries = entries;
    generateRouteGroups();
  }

  function generateRouteGroups() {
    // Group entries by route
    const routeMap = new Map<string, RouteGroup>();
    
    for (const entry of timetableEntries) {
      const route = gtfsData.routes.find(r => r.route_id === entry.routeId);
      if (!route) continue;
      
      if (!routeMap.has(entry.routeId)) {
        routeMap.set(entry.routeId, {
          route,
          entries: [],
          hourlyGroups: []
        });
      }
      
      routeMap.get(entry.routeId)!.entries.push(entry);
    }
    
    // Sort entries within each route by time and create hourly groups
    for (const group of routeMap.values()) {
      group.entries.sort((a, b) => {
        const timeA = parseTime(a.time);
        const timeB = parseTime(b.time);
        return timeA - timeB;
      });
      
      // Group by hour
      const hourlyMap = new Map<number, TimetableEntry[]>();
      for (const entry of group.entries) {
        const displayHour = entry.hour >= 24 ? entry.hour - 24 : entry.hour;
        if (!hourlyMap.has(displayHour)) {
          hourlyMap.set(displayHour, []);
        }
        hourlyMap.get(displayHour)!.push(entry);
      }
      
      // Convert to array and sort by hour
      group.hourlyGroups = Array.from(hourlyMap.entries())
        .map(([hour, entries]) => ({ hour, entries }))
        .sort((a, b) => a.hour - b.hour);
    }
    
    // Convert to array and sort by route name
    routeGroups = Array.from(routeMap.values()).sort((a, b) => 
      (a.route.route_short_name || a.route.route_long_name || a.route.route_id)
        .localeCompare(b.route.route_short_name || b.route.route_long_name || b.route.route_id)
    );
  }

  function parseTime(timeStr: string): number {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return (hours % 24) * 3600 + minutes * 60 + (seconds || 0);
  }

  function formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const displayHour = hour >= 24 ? hour - 24 : hour;
    return `${displayHour.toString().padStart(2, '0')}:${minutes}`;
  }

  function getTimeStatus(timeStr: string): 'past' | 'current' | 'future' {
    const now = new Date();
    const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const entryTime = parseTime(timeStr);
    
    if (entryTime < currentTime - 300) return 'past'; // 5 minutes ago
    if (entryTime < currentTime + 300) return 'current'; // within 5 minutes
    return 'future';
  }

  function close() {
    visible = false;
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    }
  }

  function selectRoute(routeId: string | null) {
    selectedRouteId = routeId;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if visible}
  <div class="modal-overlay" on:click={close} role="presentation">
    <div class="modal-content" on:click|stopPropagation role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2 class="modal-title">{stop.stop_name} の時刻表</h2>
        <button class="close-button" on:click={close} aria-label="閉じる">
          ✕
        </button>
      </div>
      
      <div class="modal-body">
        <div class="stop-info">
          <div class="info-item">
            <span class="label">停留所ID:</span>
            <span class="value">{stop.stop_id}</span>
          </div>
          {#if stop.stop_code}
            <div class="info-item">
              <span class="label">停留所コード:</span>
              <span class="value">{stop.stop_code}</span>
            </div>
          {/if}
          <div class="info-item">
            <span class="label">座標:</span>
            <span class="value">{stop.stop_lat}, {stop.stop_lon}</span>
          </div>
        </div>

        <div class="controls">
          <div class="route-tabs">
            <button 
              class="route-tab {selectedRouteId === null ? 'active' : ''}" 
              on:click={() => selectRoute(null)}
            >
              全ての路線
            </button>
            {#each routeGroups as group}
              <button 
                class="route-tab {selectedRouteId === group.route.route_id ? 'active' : ''}"
                style={group.route.route_color ? `border-color: #${group.route.route_color};` : ''}
                on:click={() => selectRoute(group.route.route_id)}
              >
                <span 
                  class="route-badge"
                  style={group.route.route_color ? `background-color: #${group.route.route_color}; color: white;` : ''}
                >
                  {group.route.route_short_name || group.route.route_long_name || group.route.route_id}
                </span>
                <span class="trip-count">({group.entries.length}便)</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="timetable-container">
          {#if selectedRouteId === null}
            <!-- Show all routes grouped -->
            {#if routeGroups.length > 0}
              {#each routeGroups as group}
                <div class="route-section">
                  <div class="route-header">
                    <span 
                      class="route-badge large"
                      style={group.route.route_color ? `background-color: #${group.route.route_color}; color: white;` : ''}
                    >
                      {group.route.route_short_name || group.route.route_long_name || group.route.route_id}
                    </span>
                    <span class="route-description">
                      {group.route.route_long_name || group.route.route_desc || ''}
                    </span>
                    <span class="trip-count">({group.entries.length}便)</span>
                  </div>
                  
                  <table class="hourly-timetable">
                    <thead>
                      <tr>
                        <th class="hour-column">時</th>
                        <th class="minutes-column">分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each group.hourlyGroups as hourGroup}
                        <tr class="hourly-row">
                          <td class="hour-cell">{hourGroup.hour.toString().padStart(2, '0')}</td>
                          <td class="minutes-cell">
                            <div class="minutes-grid">
                              {#each hourGroup.entries as entry}
                                <span 
                                  class="minute-item {getTimeStatus(entry.time)}"
                                  title="{entry.headsign} (便ID: {entry.tripId})"
                                >
                                  {entry.minute.toString().padStart(2, '0')}
                                </span>
                              {/each}
                            </div>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/each}
            {:else}
              <div class="no-data">
                <p>この停留所の時刻表データが見つかりませんでした。</p>
              </div>
            {/if}
          {:else}
            <!-- Show specific route -->
            {#each routeGroups as group}
              {#if group.route.route_id === selectedRouteId}
                <div class="route-section">
                  <div class="route-header">
                    <span 
                      class="route-badge large"
                      style={group.route.route_color ? `background-color: #${group.route.route_color}; color: white;` : ''}
                    >
                      {group.route.route_short_name || group.route.route_long_name || group.route.route_id}
                    </span>
                    <span class="route-description">
                      {group.route.route_long_name || group.route.route_desc || ''}
                    </span>
                    <span class="trip-count">({group.entries.length}便)</span>
                  </div>
                  
                  <table class="hourly-timetable">
                    <thead>
                      <tr>
                        <th class="hour-column">時</th>
                        <th class="minutes-column">分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each group.hourlyGroups as hourGroup}
                        <tr class="hourly-row">
                          <td class="hour-cell">{hourGroup.hour.toString().padStart(2, '0')}</td>
                          <td class="minutes-cell">
                            <div class="minutes-grid">
                              {#each hourGroup.entries as entry}
                                <span 
                                  class="minute-item {getTimeStatus(entry.time)}"
                                  title="{entry.headsign} (便ID: {entry.tripId})"
                                >
                                  {entry.minute.toString().padStart(2, '0')}
                                </span>
                              {/each}
                            </div>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            {/each}
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: color 0.2s;
  }

  .close-button:hover {
    color: #374151;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .stop-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: #f9fafb;
    border-radius: 0.375rem;
  }

  .info-item {
    display: flex;
    gap: 0.5rem;
  }

  .label {
    font-weight: 500;
    color: #6b7280;
  }

  .value {
    color: #1f2937;
  }

  .controls {
    margin-bottom: 1.5rem;
  }

  .route-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
  }

  .route-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .route-tab:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .route-tab.active {
    border-color: #3b82f6;
    background-color: #dbeafe;
    font-weight: 600;
  }

  .trip-count {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .route-section {
    margin-bottom: 2rem;
  }

  .route-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: #f9fafb;
    border-radius: 0.375rem;
    border-left: 4px solid #3b82f6;
  }

  .route-badge.large {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    font-weight: 700;
  }

  .route-description {
    flex: 1;
    color: #374151;
    font-weight: 500;
  }

  .timetable-container {
    overflow-x: auto;
  }

  .hourly-timetable {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .hourly-timetable th {
    background-color: #f3f4f6;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }

  .hour-column {
    width: 80px;
    text-align: center;
  }

  .minutes-column {
    min-width: 400px;
  }

  .hourly-row {
    border-bottom: 1px solid #e5e7eb;
  }

  .hourly-row:nth-child(even) {
    background-color: #f9fafb;
  }

  .hour-cell {
    padding: 1rem 0.75rem;
    text-align: center;
    font-weight: 600;
    font-family: monospace;
    font-size: 1rem;
    background-color: #f3f4f6;
    border-right: 2px solid #e5e7eb;
  }

  .minutes-cell {
    padding: 0.5rem;
  }

  .minutes-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    align-items: center;
  }

  .minute-item {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background-color: #3b82f6;
    color: white;
    border-radius: 0.25rem;
    font-family: monospace;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 2rem;
    text-align: center;
  }

  .minute-item:hover {
    background-color: #2563eb;
    transform: scale(1.05);
  }

  .minute-item.past {
    opacity: 0.5;
    background-color: #6b7280;
  }

  .minute-item.current {
    background-color: #f59e0b;
    animation: pulse 2s infinite;
  }

  .minute-item.future {
    background-color: #3b82f6;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .route-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background-color: #3b82f6;
    color: white;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .no-data {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }
</style>