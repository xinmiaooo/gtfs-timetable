<script lang="ts">
  import { createEventDispatcher } from 'svelte';

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
        alert('ZIPファイルをドロップしてください');
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

<div class="gtfs-drop-zone">
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
      <p class="main-text">GTFS ZIPファイルをドロップするか、クリックして選択</p>
      <p class="sub-text">stops.txt を含むGTFSデータセットを選択してください</p>
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

<style>
  .gtfs-drop-zone {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  .drop-area {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 2rem;
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
    width: 48px;
    height: 48px;
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