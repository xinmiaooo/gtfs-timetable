<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let visible = true;

  const dispatch = createEventDispatcher<{
    fileDropped: File;
  }>();

  let isDragOver = false;
  let fileInput: HTMLInputElement;

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        dispatch('fileDropped', file);
      } else {
        alert('Please drop a ZIP file');
      }
    }
  }

  function handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      dispatch('fileDropped', file);
    }
  }

  function triggerFileInput() {
    fileInput.click();
  }
</script>

{#if visible}
  <div class="modal-overlay" on:click|self={() => {}}>
    <div class="modal-dialog">
      <div class="modal-content">
        <h2 class="modal-title">Upload GTFS Data</h2>

        <div
          class="drop-area {isDragOver ? 'drag-over' : ''}"
          on:dragover={handleDragOver}
          on:dragleave={handleDragLeave}
          on:drop={handleDrop}
          role="button"
          tabindex="0"
          on:click={triggerFileInput}
          on:keydown={(e) => e.key === 'Enter' && triggerFileInput()}
        >
          <div class="drop-content">
            <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <p class="main-text">Drop GTFS ZIP file here or click to select</p>
            <p class="sub-text">Select a GTFS dataset containing stops.txt</p>
          </div>
        </div>

        <input
          bind:this={fileInput}
          type="file"
          accept=".zip"
          on:change={handleFileInput}
          style="display: none;"
        />
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
    backdrop-filter: blur(4px);
  }

  .modal-dialog {
    max-width: 600px;
    width: 90%;
    margin: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 1.5rem 0;
    text-align: center;
  }

  .drop-area {
    border: 3px dashed #d1d5db;
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    background-color: #f9fafb;
  }

  .drop-area:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .drop-area.drag-over {
    border-color: #3b82f6;
    background-color: #dbeafe;
    transform: scale(1.02);
  }

  .drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .upload-icon {
    width: 64px;
    height: 64px;
    color: #6b7280;
  }

  .main-text {
    font-size: 1.125rem;
    font-weight: 500;
    color: #374151;
    margin: 0;
  }

  .sub-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .drag-over .upload-icon {
    color: #3b82f6;
  }

  .drag-over .main-text {
    color: #1d4ed8;
  }
</style>
