<script lang="ts">
  import GTFSSelector from '$lib/GTFSSelector.svelte';
  import GTFSDropZone from '$lib/GTFSDropZone.svelte';
  import StopsList from '$lib/StopsList.svelte';
  import TimetableModal from '$lib/TimetableModal.svelte';
  import type { GTFSRepository } from '$lib/gtfs-repos.js';
  import type { GTFSStop, GTFSData } from '$lib/gtfs-parser.js';
  import { parseGTFSZip } from '$lib/gtfs-parser.js';

  let selectedRepository: GTFSRepository | null = null;
  let stops: GTFSStop[] = [];
  let gtfsData: GTFSData | null = null;
  let loading = false;
  let uploadedFile: File | null = null;
  let showTimetableModal = false;
  let selectedStop: GTFSStop | null = null;

  function handleRepositorySelect(event: CustomEvent<GTFSRepository>) {
    selectedRepository = event.detail;
    console.log('Selected repository:', selectedRepository);
  }

  async function handleFileDropped(event: CustomEvent<File>) {
    const file = event.detail;
    uploadedFile = file;
    loading = true;
    
    try {
      console.log('Processing file:', file.name);
      gtfsData = await parseGTFSZip(file);
      stops = gtfsData.stops;
      console.log('Parsed GTFS data:', {
        stops: gtfsData.stops.length,
        stopTimes: gtfsData.stopTimes.length,
        trips: gtfsData.trips.length,
        routes: gtfsData.routes.length
      });
    } catch (error) {
      console.error('Error processing file:', error);
      alert('ファイルの処理中にエラーが発生しました: ' + error);
      stops = [];
      gtfsData = null;
    } finally {
      loading = false;
    }
  }

  function handleShowTimetable(event: CustomEvent<{ stop: GTFSStop, gtfsData: GTFSData }>) {
    selectedStop = event.detail.stop;
    gtfsData = event.detail.gtfsData;
    showTimetableModal = true;
  }

  function handleCloseTimetable() {
    showTimetableModal = false;
    selectedStop = null;
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">GTFS Timetable</h1>
  
  <!-- <div class="mb-8">
    <h2 class="text-xl font-semibold mb-4">オンラインリポジトリから選択</h2>
    <GTFSSelector on:select={handleRepositorySelect} />
  </div> -->

  {#if selectedRepository}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
      <h2 class="text-lg font-semibold text-blue-900 mb-2">選択されたリポジトリ</h2>
      <p class="text-blue-800">{selectedRepository.name} が選択されました。</p>
      <p class="text-sm text-blue-600 mt-2">今後、このリポジトリから時刻表データを取得して表示する機能を追加できます。</p>
    </div>
  {/if}

  <div class="mb-8">
    <h2 class="text-xl font-semibold mb-4">ローカルファイルをアップロード</h2>
    <GTFSDropZone on:fileDropped={handleFileDropped} />
  </div>

  {#if uploadedFile}
    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
      <h2 class="text-lg font-semibold text-green-900 mb-2">アップロード完了</h2>
      <p class="text-green-800">ファイル: {uploadedFile.name}</p>
      <p class="text-sm text-green-600 mt-2">ファイルサイズ: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
    </div>
  {/if}

  <div class="mb-8">
    <StopsList {stops} {gtfsData} {loading} on:showTimetable={handleShowTimetable} />
  </div>
</div>

{#if showTimetableModal && selectedStop && gtfsData}
  <TimetableModal 
    stop={selectedStop} 
    {gtfsData} 
    visible={showTimetableModal} 
    on:close={handleCloseTimetable} 
  />
{/if}
