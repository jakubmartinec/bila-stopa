const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function generateHTML(conditions) {
  const template = `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bílá Stopa - Aktuální podmínky</title>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Open Sans', sans-serif;
            line-height: 1.6;
            padding: 16px;
            max-width: 1200px;
            margin: 0 auto;
            color: #000;
            background: #fff;
        }
        header { text-align: center; margin-bottom: 32px; }
        h1 { font-size: 24px; margin-bottom: 16px; }
        .info-box {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            height: 100%;
            position: relative;
            padding-bottom: 40px;
        }
        .info-box h2 { font-size: 20px; margin-bottom: 8px; }
        .info-box p { margin-bottom: 8px; }
        .date { color: #666; font-size: 14px; }
        .tag {
            position: absolute;
            bottom: 16px;
            left: 16px;
            color: #0066cc;
            font-size: 14px;
            font-weight: 600;
        }
        @media (min-width: 600px) {
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 16px;
            }
            .info-box { margin-bottom: 0; }
        }
    </style>
</head>
<body>
    <header>
        <h1>Bílá Stopa</h1>
        <p>Aktuální podmínky pro běžecké lyžování</p>
        <p class="date">Poslední aktualizace: ${new Date().toLocaleString('cs-CZ')}</p>
    </header>
    
    <main class="grid">
        ${conditions.map(condition => `
        <div class="info-box">
            <h2>${condition.region}</h2>
            <p class="date">${condition.date}</p>
            <p>${condition.content}</p>
            ${condition.skating ? '<p class="tag">#skate</p>' : ''}
        </div>
        `).join('')}
    </main>
</body>
</html>`;

  return template;
}

async function fetchData() {
  try {
    console.log('Fetching data from bilastopa.cz...');
    const response = await axios.get('https://bilastopa.cz/cs/aktualni-zpravodajstvi/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'cs,en-US;q=0.7,en;q=0.3'
      }
    });

    console.log('Response received, parsing content...');
    const $ = cheerio.load(response.data);
    
    const conditions = [];
    
    $('.aktuality-list > div').each((i, element) => {
      try {
        const titleElement = $(element).find('h3, .nadpis');
        const contentElement = $(element).find('p, .obsah');
        const dateElement = $(element).find('.datum, time');
        
        const title = titleElement.text().trim();
        const content = contentElement.text().trim();
        const date = dateElement.text().trim();
        
        if (title && content) {
          const hasSkating = content.toLowerCase().includes('bruslení') || 
                           content.toLowerCase().includes('skate') ||
                           content.toLowerCase().includes('upraveno pro bruslení');
          
          conditions.push({
            region: title,
            date: date,
            content: content,
            skating: hasSkating,
            lastUpdate: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error parsing element:', err);
      }
    });

    console.log(`Found ${conditions.length} region updates`);
    
    if (conditions.length === 0) {
      console.log('No new updates found, checking existing data...');
      try {
        const existingData = JSON.parse(await fs.readFile('data.json', 'utf8'));
        console.log('Using existing data');
        // Update HTML with existing data
        const html = await generateHTML(existingData);
        await fs.writeFile('index.html', html);
        process.exit(0);
      } catch (err) {
        console.log('No existing data, creating empty files');
        await fs.writeFile('data.json', JSON.stringify([], null, 2));
        const html = await generateHTML([]);
        await fs.writeFile('index.html', html);
        process.exit(0);
      }
    } else {
      // Write new data and update HTML
      await fs.writeFile('data.json', JSON.stringify(conditions, null, 2));
      const html = await generateHTML(conditions);
      await fs.writeFile('index.html', html);
      console.log('Data and HTML updated successfully');
    }
    
  } catch (error) {
    console.error('Error details:', error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('Connection issue, keeping existing data');
      process.exit(0);
    }
    process.exit(1);
  }
}

fetchData();