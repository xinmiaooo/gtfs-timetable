export interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  location_type?: string;
  parent_station?: string;
  stop_code?: string;
  stop_desc?: string;
  zone_id?: string;
  stop_url?: string;
  stop_timezone?: string;
  wheelchair_boarding?: string;
}

export interface GTFSStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: string;
  stop_headsign?: string;
  pickup_type?: string;
  drop_off_type?: string;
  shape_dist_traveled?: string;
}

export interface GTFSTrip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign?: string;
  trip_short_name?: string;
  direction_id?: string;
  block_id?: string;
  shape_id?: string;
}

export interface GTFSRoute {
  route_id: string;
  agency_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_desc?: string;
  route_type: string;
  route_url?: string;
  route_color?: string;
  route_text_color?: string;
}

export interface GTFSCalendar {
  service_id: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  start_date: string;
  end_date: string;
}

export interface GTFSCalendarDate {
  service_id: string;
  date: string;
  exception_type: string; // 1 = service added, 2 = service removed
}

export interface GTFSData {
  stops: GTFSStop[];
  stopTimes: GTFSStopTime[];
  trips: GTFSTrip[];
  routes: GTFSRoute[];
  calendar: GTFSCalendar[];
  calendarDates: GTFSCalendarDate[];
}

export async function parseGTFSZip(file: File): Promise<GTFSData> {
  try {
    console.log('Parsing GTFS ZIP file:', file.name, 'Size:', file.size);
    
    // Read the ZIP file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('Array buffer length:', arrayBuffer.byteLength);
    
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log('Uint8Array length:', uint8Array.length);
    
    // Parse all GTFS files
    const gtfsData = await extractGTFSDataFromZip(uint8Array);
    
    return gtfsData;
  } catch (error) {
    console.error('Error parsing GTFS ZIP file:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    throw new Error(`GTFSファイルの解析に失敗しました: ${error?.message || 'Unknown error'}`);
  }
}

// Backward compatibility function
export async function parseGTFSZipForStops(file: File): Promise<GTFSStop[]> {
  const data = await parseGTFSZip(file);
  return data.stops;
}

async function extractGTFSDataFromZip(zipData: Uint8Array): Promise<GTFSData> {
  try {
    console.log('Parsing ZIP structure...');
    
    // Parse ZIP file structure
    const files = await parseZipStructure(zipData);
    console.log('Found files:', files.map(f => f.name));
    
    const result: GTFSData = {
      stops: [],
      stopTimes: [],
      trips: [],
      routes: [],
      calendar: [],
      calendarDates: []
    };

    // Parse required and optional files
    for (const fileName of ['stops.txt', 'stop_times.txt', 'trips.txt', 'routes.txt', 'calendar.txt', 'calendar_dates.txt']) {
      const file = files.find(f => f.name === fileName);
      if (!file) {
        console.warn(`${fileName} not found in ZIP file`);
        continue;
      }

      console.log(`Extracting ${fileName}...`);
      const content = await extractFileFromZip(zipData, file);
      const csvContent = new TextDecoder('utf-8').decode(content);

      switch (fileName) {
        case 'stops.txt':
          result.stops = parseCSVContent<GTFSStop>(csvContent);
          console.log('Parsed stops count:', result.stops.length);
          break;
        case 'stop_times.txt':
          result.stopTimes = parseCSVContent<GTFSStopTime>(csvContent);
          console.log('Parsed stop times count:', result.stopTimes.length);
          break;
        case 'trips.txt':
          result.trips = parseCSVContent<GTFSTrip>(csvContent);
          console.log('Parsed trips count:', result.trips.length);
          break;
        case 'routes.txt':
          result.routes = parseCSVContent<GTFSRoute>(csvContent);
          console.log('Parsed routes count:', result.routes.length);
          break;
        case 'calendar.txt':
          result.calendar = parseCSVContent<GTFSCalendar>(csvContent);
          console.log('Parsed calendar count:', result.calendar.length);
          break;
        case 'calendar_dates.txt':
          result.calendarDates = parseCSVContent<GTFSCalendarDate>(csvContent);
          console.log('Parsed calendar dates count:', result.calendarDates.length);
          break;
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('Error extracting GTFS data from ZIP:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    throw new Error(`ZIPファイルからGTFSデータの抽出に失敗しました: ${error?.message || 'Unknown error'}`);
  }
}

// Legacy function for backward compatibility
async function extractStopsFromZip(zipData: Uint8Array): Promise<GTFSStop[]> {
  const gtfsData = await extractGTFSDataFromZip(zipData);
  return gtfsData.stops;
}

interface ZipFileEntry {
  name: string;
  offset: number;
  size: number;
  compressedSize: number;
  compressionMethod: number;
}

async function parseZipStructure(zipData: Uint8Array): Promise<ZipFileEntry[]> {
  const files: ZipFileEntry[] = [];
  
  console.log('ZIP file size:', zipData.length);
  
  // Look for central directory end record (signature: 0x06054b50)
  let endOffset = zipData.length - 22;
  while (endOffset >= 0) {
    if (zipData[endOffset] === 0x50 && zipData[endOffset + 1] === 0x4b &&
        zipData[endOffset + 2] === 0x05 && zipData[endOffset + 3] === 0x06) {
      break;
    }
    endOffset--;
  }
  
  if (endOffset < 0) {
    throw new Error('Invalid ZIP file: End of central directory not found');
  }
  
  console.log('Found end of central directory at offset:', endOffset);
  
  // Read central directory info
  const centralDirOffset = readUint32(zipData, endOffset + 16);
  const numEntries = readUint16(zipData, endOffset + 10);
  
  console.log('Central directory offset:', centralDirOffset);
  console.log('Number of entries:', numEntries);
  
  // Parse central directory entries
  let offset = centralDirOffset;
  for (let i = 0; i < numEntries; i++) {
    if (offset + 46 > zipData.length) {
      console.warn('Reached end of data while parsing central directory');
      break;
    }
    
    // Check central directory file header signature (0x02014b50)
    const signature = readUint32(zipData, offset);
    if (signature !== 0x02014b50) {
      console.warn(`Invalid central directory signature: 0x${signature.toString(16)} at offset ${offset}`);
      break;
    }
    
    const compressionMethod = readUint16(zipData, offset + 10);
    const compressedSize = readUint32(zipData, offset + 20);
    const uncompressedSize = readUint32(zipData, offset + 24);
    const fileNameLength = readUint16(zipData, offset + 28);
    const extraFieldLength = readUint16(zipData, offset + 30);
    const commentLength = readUint16(zipData, offset + 32);
    const localHeaderOffset = readUint32(zipData, offset + 42);
    
    if (offset + 46 + fileNameLength > zipData.length) {
      console.warn('File name extends beyond ZIP data');
      break;
    }
    
    const fileName = new TextDecoder('utf-8').decode(
      zipData.slice(offset + 46, offset + 46 + fileNameLength)
    );
    
    console.log(`Found file: ${fileName} (compression: ${compressionMethod}, size: ${uncompressedSize})`);
    
    files.push({
      name: fileName,
      offset: localHeaderOffset,
      size: uncompressedSize,
      compressedSize: compressedSize,
      compressionMethod: compressionMethod
    });
    
    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }
  
  return files;
}

async function extractFileFromZip(zipData: Uint8Array, file: ZipFileEntry): Promise<Uint8Array> {
  try {
    console.log('Extracting file:', file.name, 'from offset:', file.offset);
    
    // Read local file header
    const localHeaderOffset = file.offset;
    
    if (localHeaderOffset + 30 > zipData.length) {
      throw new Error(`Local header offset ${localHeaderOffset} is beyond ZIP data length ${zipData.length}`);
    }
    
    const localHeaderSignature = readUint32(zipData, localHeaderOffset);
    console.log('Local header signature:', '0x' + localHeaderSignature.toString(16));
    
    if (localHeaderSignature !== 0x04034b50) {
      throw new Error(`Invalid local file header signature: 0x${localHeaderSignature.toString(16)} (expected 0x04034b50)`);
    }
    
    const fileNameLength = readUint16(zipData, localHeaderOffset + 26);
    const extraFieldLength = readUint16(zipData, localHeaderOffset + 28);
    
    console.log('File name length:', fileNameLength, 'Extra field length:', extraFieldLength);
    
    const dataOffset = localHeaderOffset + 30 + fileNameLength + extraFieldLength;
    
    if (dataOffset + file.compressedSize > zipData.length) {
      throw new Error(`Data extends beyond ZIP file: offset ${dataOffset} + size ${file.compressedSize} > ${zipData.length}`);
    }
    
    console.log('Data offset:', dataOffset, 'Compressed size:', file.compressedSize);
    
    const compressedData = zipData.slice(dataOffset, dataOffset + file.compressedSize);
    
    if (file.compressionMethod === 0) {
      // No compression
      console.log('File is uncompressed');
      return compressedData;
    } else if (file.compressionMethod === 8) {
      // Deflate compression - use native browser DecompressionStream
      console.log('File is deflate compressed, decompressing...');
      try {
        const decompressedData = await decompressDeflate(compressedData);
        console.log('Decompressed size:', decompressedData.length);
        return decompressedData;
      } catch (decompressError) {
        console.error('Decompression failed:', decompressError);
        throw new Error(`Failed to decompress file: ${decompressError.message}`);
      }
    } else {
      throw new Error(`Unsupported compression method: ${file.compressionMethod}`);
    }
  } catch (error) {
    console.error('Error in extractFileFromZip:', error);
    throw error;
  }
}

async function decompressDeflate(compressedData: Uint8Array): Promise<Uint8Array> {
  try {
    // Use the native browser DecompressionStream API
    const stream = new DecompressionStream('deflate-raw');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    const chunks: Uint8Array[] = [];
    
    // Start reading the decompressed data
    const readPromise = (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
    })();
    
    // Write the compressed data
    await writer.write(compressedData);
    await writer.close();
    
    // Wait for all data to be read
    await readPromise;
    
    // Combine all chunks into a single Uint8Array
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  } catch (error) {
    console.error('Native decompression failed:', error);
    
    // Fallback: Try with 'deflate' format instead of 'deflate-raw'
    try {
      const stream = new DecompressionStream('deflate');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      const chunks: Uint8Array[] = [];
      
      const readPromise = (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
        } finally {
          reader.releaseLock();
        }
      })();
      
      await writer.write(compressedData);
      await writer.close();
      await readPromise;
      
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result;
    } catch (fallbackError) {
      console.error('Fallback decompression also failed:', fallbackError);
      throw new Error(`Both deflate-raw and deflate decompression failed: ${(error as Error).message}`);
    }
  }
}

function readUint16(data: Uint8Array, offset: number): number {
  if (offset + 1 >= data.length) {
    throw new Error(`Cannot read uint16 at offset ${offset}: data length is ${data.length}`);
  }
  return data[offset] | (data[offset + 1] << 8);
}

function readUint32(data: Uint8Array, offset: number): number {
  if (offset + 3 >= data.length) {
    throw new Error(`Cannot read uint32 at offset ${offset}: data length is ${data.length}`);
  }
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
}

export function parseCSVContent<T>(csvContent: string): T[] {
  // Remove BOM if present
  const cleanContent = csvContent.replace(/^\uFEFF/, '');
  const lines = cleanContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('Invalid CSV format');
  }
  
  const headers = parseCSVLine(lines[0]);
  const results: T[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = parseCSVLine(lines[i]);
    const item: Partial<T> = {};
    
    headers.forEach((header, index) => {
      if (values[index] && values[index] !== '') {
        (item as Record<string, string>)[header] = values[index];
      }
    });
    
    // Basic validation - check if required fields exist
    const hasRequiredFields = Object.keys(item).length > 0;
    if (hasRequiredFields) {
      results.push(item as T);
    }
  }
  
  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}