import fs from 'fs';
import https from 'https';
import path from 'path';

const fonts = [
  { file: 'roboto.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto-Regular.ttf' },
  { file: 'roboto-bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto-Bold.ttf' },
  { file: 'lora.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/lora/static/Lora-Regular.ttf' },
  { file: 'lora-bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/lora/static/Lora-Bold.ttf' },
  { file: 'playfair.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/static/PlayfairDisplay-Regular.ttf' },
  { file: 'playfair-bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/static/PlayfairDisplay-Bold.ttf' },
  { file: 'merriweather.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/merriweather/Merriweather-Regular.ttf' },
  { file: 'merriweather-bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/merriweather/Merriweather-Bold.ttf' },
  { file: 'caveat.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/static/Caveat-Regular.ttf' },
  { file: 'caveat-bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/static/Caveat-Bold.ttf' },
  { file: 'pacifico.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/pacifico/Pacifico-Regular.ttf' },
  { file: 'amatic.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/amaticsc/AmaticSC-Regular.ttf' },
  { file: 'amatic-bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/amaticsc/AmaticSC-Bold.ttf' },
  { file: 'poppins.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf' },
  { file: 'poppins-bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf' },
  { file: 'ptsans.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PTSans-Regular.ttf' },
  { file: 'ptsans-bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PTSans-Bold.ttf' },
];

const destDir = path.join(process.cwd(), 'public', 'fonts');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  for (const font of fonts) {
    console.log(`Downloading ${font.file}...`);
    try {
      await download(font.url, path.join(destDir, font.file));
      console.log(`Successfully downloaded ${font.file}`);
    } catch (e) {
      console.error(`Failed to download ${font.file}:`, e);
    }
  }
}

main();
