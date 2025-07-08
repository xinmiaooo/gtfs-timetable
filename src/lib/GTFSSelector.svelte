<script lang="ts">
  import { getGTFSRepositories, type GTFSRepository } from './gtfs-repos.js';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    select: GTFSRepository;
  }>();

  const repositories = getGTFSRepositories();
  let selectedRepository: GTFSRepository | null = null;

  function handleSelection(event: Event) {
    const target = event.target as HTMLSelectElement;
    const repo = repositories.find(r => r.id === target.value);
    if (repo) {
      selectedRepository = repo;
      dispatch('select', repo);
    }
  }
</script>

<div class="gtfs-selector">
  <label for="gtfs-select" class="block text-sm font-medium text-gray-700 mb-2">
    GTFSリポジトリを選択
  </label>
  <select 
    id="gtfs-select" 
    on:change={handleSelection}
    class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
    <option value="">-- リポジトリを選択してください --</option>
    {#each repositories as repo}
      <option value={repo.id}>{repo.name}</option>
    {/each}
  </select>
  
  {#if selectedRepository}
    <div class="mt-4 p-4 bg-gray-50 rounded-md">
      <h3 class="font-medium text-gray-900">{selectedRepository.name}</h3>
      {#if selectedRepository.description}
        <p class="text-sm text-gray-600 mt-1">{selectedRepository.description}</p>
      {/if}
      {#if selectedRepository.region}
        <p class="text-xs text-gray-500 mt-1">地域: {selectedRepository.region}</p>
      {/if}
      <p class="text-xs text-gray-500 mt-2">
        URL: <a href={selectedRepository.url} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
          {selectedRepository.url}
        </a>
      </p>
    </div>
  {/if}
</div>

<style>
  .gtfs-selector {
    max-width: 500px;
  }
</style>