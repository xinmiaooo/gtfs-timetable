<script lang="ts">
	import GTFSDropZone from '$lib/GTFSDropZone.svelte';
	import TimetableModal from '$lib/TimetableModal.svelte';
	import MapView from '$lib/MapView.svelte';
	import type { GTFSRepository } from '$lib/gtfs-repos.ts';
	import type { GTFSStop, GTFSData } from '$lib/gtfs-parser.ts';
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

	function handleShowTimetable(event: CustomEvent<{ stop: GTFSStop; gtfsData: GTFSData }>) {
		selectedStop = event.detail.stop;
		gtfsData = event.detail.gtfsData;
		showTimetableModal = true;
	}

	function handleStopClickFromMap(stop: GTFSStop) {
		selectedStop = stop;
		showTimetableModal = true;
	}

	function handleCloseTimetable() {
		showTimetableModal = false;
		selectedStop = null;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="mb-8 text-3xl font-bold">GTFS Timetable</h1>

	<!-- <div class="mb-8">
    <h2 class="text-xl font-semibold mb-4">オンラインリポジトリから選択</h2>
    <GTFSSelector on:select={handleRepositorySelect} />
  </div> -->

	{#if selectedRepository}
		<div class="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
			<h2 class="mb-2 text-lg font-semibold text-blue-900">選択されたリポジトリ</h2>
			<p class="text-blue-800">{selectedRepository.name} が選択されました。</p>
			<p class="mt-2 text-sm text-blue-600">
				今後、このリポジトリから時刻表データを取得して表示する機能を追加できます。
			</p>
		</div>
	{/if}

	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold">ローカルファイルをアップロード</h2>
		<GTFSDropZone on:fileDropped={handleFileDropped} />
	</div>

	{#if gtfsData && gtfsData.stops.length > 0}
		<div class="mb-8">
			<h2 class="mb-4 text-xl font-semibold">ルートと停留所の地図</h2>
			<MapView {gtfsData} onStopClick={handleStopClickFromMap} />
		</div>
	{/if}
</div>

{#if showTimetableModal && selectedStop && gtfsData}
	<TimetableModal
		stop={selectedStop}
		{gtfsData}
		visible={showTimetableModal}
		on:close={handleCloseTimetable}
	/>
{/if}
