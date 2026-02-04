import fs from 'fs';
import path from 'path';

const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
const latestManifest = {
  "name": "ZK.",
  "short_name": "ZK.",
  "description": "松本を共有するSNS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0B0C0F",
  "theme_color": "#0B0C0F",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "any",
      "type": "image/x-icon"
    }
  ]
};

fs.writeFileSync(manifestPath, JSON.stringify(latestManifest, null, 2), 'utf-8');
console.log('manifest.jsonを最新状態に強制上書きしました');
console.log('icons:', latestManifest.icons);