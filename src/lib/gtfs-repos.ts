export interface GTFSRepository {
  id: string;
  name: string;
  url: string;
  description?: string;
  region?: string;
}

export const gtfsRepositories: GTFSRepository[] = [
  {
    id: 'jr-east',
    name: 'JR East',
    url: 'https://www.jreast-timetable.jp/timetable_api/gtfs/Tohoku_GTFS.zip',
    description: 'JRqå,nB;hÇü¿',
    region: 'Japan'
  },
  {
    id: 'jr-west',
    name: 'JR West',
    url: 'https://www.jr-odekake.net/railroad/service/gtfs/gtfs.zip',
    description: 'JRå,nB;hÇü¿',
    region: 'Japan'
  },
  {
    id: 'tokyo-metro',
    name: 'Tokyo Metro',
    url: 'https://api.tokyometroapp.jp/api/v2/gtfs/TokyoMetro_GTFS.zip',
    description: 'q¬áÈínB;hÇü¿',
    region: 'Japan'
  },
  {
    id: 'odpt',
    name: 'Open Data Platform for Public Transportation',
    url: 'https://api.odpt.org/api/v4/gtfs/odpt_gtfs.zip',
    description: 'lq¤ªü×óÇü¿»ó¿ünGTFSÇü¿',
    region: 'Japan'
  },
  {
    id: 'sample',
    name: 'Sample GTFS',
    url: 'https://developers.google.com/transit/gtfs/examples/sample-feed.zip',
    description: 'Google Transit APInµó×ëÇü¿',
    region: 'Sample'
  }
];

export function getGTFSRepositories(): GTFSRepository[] {
  return gtfsRepositories;
}

export function getGTFSRepositoryById(id: string): GTFSRepository | undefined {
  return gtfsRepositories.find(repo => repo.id === id);
}