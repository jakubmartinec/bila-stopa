const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function fetchData() {
  try {
    console.log('Fetching data from bilastopa.cz...');
    const response = await axios.get('https://bilastopa.cz/cs/aktualni-zpravodajstvi/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    console.log('Parsing webpage content...');
    
    const conditions = [];
    
    // Get all news posts
    $('article.post').each((i, element) => {
      try {
        const title = $(element).find('h2').text().trim();
        const date = $(element).find('time').text().trim();
        const content = $(element).find('.entry-content').text().trim();
        
        // Only include if there's actual content
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
        console.error('Error parsing article:', err);
      }
    });

    if (conditions.length === 0) {
      throw new Error('No conditions data found on the page');
    }

    console.log(`Found ${conditions.length} region updates`);
    await fs.writeFile('data.json', JSON.stringify(conditions, null, 2));
    console.log('Data successfully written to data.json');
    
  } catch (error) {
    console.error('Error in fetchData:', error);
    process.exit(1);
  }
}

fetchData();