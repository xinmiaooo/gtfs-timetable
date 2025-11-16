<script lang="ts">
	import GTFSDropZone from '$lib/GTFSDropZone.svelte';
	import TimetableModal from '$lib/TimetableModal.svelte';
	import MapView from '$lib/MapView.svelte';
	import type { GTFSStop, GTFSData } from '$lib/gtfs-parser.ts';
	import { parseGTFSZip } from '$lib/gtfs-parser.js';

	let stops: GTFSStop[] = [];
	let gtfsData: GTFSData | null = null;
	let loading = false;
	let uploadedFile: File | null = null;
	let showTimetableModal = false;
	let selectedStop: GTFSStop | null = null;
	let showDropZone = true;

	async function handleFileDropped(event: CustomEvent<File>) {
		const file = event.detail;
		uploadedFile = file;
		loading = true;
		showDropZone = false; // Hide the drop zone after file is selected

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
			alert('Error processing file: ' + error);
			stops = [];
			gtfsData = null;
			showDropZone = true; // Show the drop zone again if there's an error
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

<svelte:head>
	<title>GTFS Timetable Viewer</title>
	<meta name="description" content="Browser-based GTFS data visualization tool" />
</svelte:head>

<div class="app-container">
	<h1 class="app-title">GTFS Timetable Viewer</h1>

	<div class="map-wrapper">
		<MapView {gtfsData} onStopClick={handleStopClickFromMap} />
	</div>

	<GTFSDropZone visible={showDropZone} on:fileDropped={handleFileDropped} />
</div>

{#if showTimetableModal && selectedStop && gtfsData}
	<TimetableModal
		stop={selectedStop}
		{gtfsData}
		visible={showTimetableModal}
		on:close={handleCloseTimetable}
	/>
{/if}

<style>
	.app-container {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.app-title {
		padding: 1rem 2rem;
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		background: white;
		border-bottom: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		position: relative;
		z-index: 1001;
	}

	.map-wrapper {
		flex: 1;
		position: relative;
		overflow: hidden;
	}
</style>
