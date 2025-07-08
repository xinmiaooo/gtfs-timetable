<script lang="ts">
  import type { GTFSStop, GTFSData } from './gtfs-parser.js';
  import { createEventDispatcher } from 'svelte';

  export let stops: GTFSStop[] = [];
  export let gtfsData: GTFSData | null = null;
  export let loading = false;

  const dispatch = createEventDispatcher<{
    showTimetable: { stop: GTFSStop, gtfsData: GTFSData };
  }>();

  let searchTerm = '';
  let filteredStops: GTFSStop[] = [];
  let contextMenuVisible = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let selectedStop: GTFSStop | null = null;

  $: {
    if (searchTerm) {
      filteredStops = stops.filter(stop => 
        stop.stop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stop.stop_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (stop.stop_code && stop.stop_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else {
      filteredStops = stops;
    }
  }

  function handleContextMenu(event: MouseEvent, stop: GTFSStop) {
    if (!gtfsData) return;
    
    event.preventDefault();
    selectedStop = stop;
    contextMenuX = event.clientX;
    contextMenuY = event.clientY;
    contextMenuVisible = true;
  }

  function showTimetable() {
    if (selectedStop && gtfsData) {
      dispatch('showTimetable', { stop: selectedStop, gtfsData });
    }
    closeContextMenu();
  }

  function closeContextMenu() {
    contextMenuVisible = false;
    selectedStop = null;
  }

  function handleDocumentClick() {
    closeContextMenu();
  }
</script>

<svelte:document on:click={handleDocumentClick} />

<div class="stops-list">
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>GTFSファイルを解析中...</p>
    </div>
  {:else if stops.length > 0}
    <div class="stops-header">
      <h2 class="title">停留所一覧 ({stops.length}件)</h2>
      <div class="search-box">
        <input
          type="text"
          placeholder="停留所名、ID、コードで検索..."
          bind:value={searchTerm}
          class="search-input"
        />
      </div>
    </div>

    <div class="stops-container">
      {#each filteredStops as stop}
        <div 
          class="stop-card"
          on:contextmenu={(e) => handleContextMenu(e, stop)}
          role="button"
          tabindex="0"
        >
          <div class="stop-header">
            <h3 class="stop-name">{stop.stop_name}</h3>
            <span class="stop-id">ID: {stop.stop_id}</span>
          </div>
          
          <div class="stop-details">
            {#if stop.stop_code}
              <div class="detail-item">
                <span class="label">コード:</span>
                <span class="value">{stop.stop_code}</span>
              </div>
            {/if}
            
            {#if stop.stop_lat && stop.stop_lon}
              <div class="detail-item">
                <span class="label">座標:</span>
                <span class="value">{stop.stop_lat}, {stop.stop_lon}</span>
              </div>
            {/if}
            
            {#if stop.location_type}
              <div class="detail-item">
                <span class="label">タイプ:</span>
                <span class="value">{stop.location_type === '1' ? '駅' : '停留所'}</span>
              </div>
            {/if}
            
            {#if stop.stop_desc}
              <div class="detail-item description">
                <span class="label">説明:</span>
                <span class="value">{stop.stop_desc}</span>
              </div>
            {/if}
          </div>
        </div>
      {/each}
      
      {#if filteredStops.length === 0 && searchTerm}
        <div class="no-results">
          <p>「{searchTerm}」に一致する停留所が見つかりませんでした</p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="empty-state">
      <!-- <p>GTFSファイルをアップロードして停留所一覧を表示します</p> -->
    </div>
  {/if}
</div>

{#if contextMenuVisible}
  <div 
    class="context-menu"
    style="left: {contextMenuX}px; top: {contextMenuY}px;"
  >
    <button class="context-menu-item" on:click={showTimetable}>
      📅 時刻表を表示
    </button>
  </div>
{/if}

<style>
  .stops-list {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .stops-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .search-box {
    flex: 1;
    max-width: 300px;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .stops-container {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  .stop-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    transition: box-shadow 0.2s;
  }

  .stop-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .stop-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .stop-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    flex: 1;
  }

  .stop-id {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    margin-left: 0.5rem;
  }

  .stop-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-item {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .detail-item.description {
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    font-weight: 500;
    color: #6b7280;
    min-width: 60px;
  }

  .value {
    color: #1f2937;
  }

  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .context-menu {
    position: fixed;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    min-width: 150px;
  }

  .context-menu-item {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
    transition: background-color 0.2s;
  }

  .context-menu-item:hover {
    background-color: #f3f4f6;
  }

  .context-menu-item:first-child {
    border-radius: 0.375rem 0.375rem 0 0;
  }

  .context-menu-item:last-child {
    border-radius: 0 0 0.375rem 0.375rem;
  }
</style>