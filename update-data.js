const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function generateHTML(conditions) {
    const html = `<!DOCTYPE html>
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
        ${conditions.map(c => `
        <div class="info-box">
            <h2>${c.region}</h2>
            <p class="date">${c.date}</p>
            <p>${c.content}</p>
            ${c.skating ? '<p class="tag">#skate</p>' : ''}
        </div>
        `).join('')}
    </main>
</body>
</html>`;
    await fs.writeFile('index.html', html);
}

async function fetchData() {
    try {
        console.log('🔍 DEBUG START: Script initialization');
        const response = await axios.get('https://bilastopa.cz/cs/aktualni-zpravodajstvi/', {
            headers: {'User-Agent': 'Mozilla/5.0 Chrome/91.0.4472.124'}
        });

        console.log('📄 DEBUG: Parsing webpage');
        const $ = cheerio.load(response.data);
        const conditions = [];

        $('.rpwe-block li').each((i, element) => {
            try {
                const title = $(element).find('.rpwe-title').text().trim();
                const content = $(element).find('.rpwe-summary').text().trim();
                const date = $(element).find('time').text().trim();

                console.log(\`📌 Found entry: \${title} (\${date})\`);
                
                if (title && content) {
                    conditions.push({
                        region: title,
                        date: date,
                        content: content,
                        skating: content.toLowerCase().includes('bruslení'),
                    });
                }
            } catch (err) {
                console.error('❌ Error parsing entry:', err);
            }
        });

        if (conditions.length > 0) {
            console.log(\`✅ Found \${conditions.length} updates\`);
            await fs.writeFile('data.json', JSON.stringify(conditions, null, 2));
            await generateHTML(conditions);
            console.log('✅ Updated data.json and index.html');
        } else {
            console.log('⚠️ No updates found');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fetchData();