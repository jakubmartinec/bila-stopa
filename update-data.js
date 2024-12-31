const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

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
    
    // Debug: Print the entire HTML to see its structure
    console.log('HTML Content:', response.data.slice(0, 500) + '...');
    
    // Try different selectors
    $('.aktuality-list > div').each((i, element) => {
      try {
        const titleElement = $(element).find('h3, .nadpis');
        const contentElement = $(element).find('p, .obsah');
        const dateElement = $(element).find('.datum, time');
        
        const title = titleElement.text().trim();
        const content = contentElement.text().trim();
        const date = dateElement.text().trim();
        
        console.log('Found item:', { title, date });
        
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
      throw new Error('No conditions data found on the page');
    }

    await fs.writeFile('data.json', JSON.stringify(conditions, null, 2));
    console.log('Data successfully written to data.json');
    
  } catch (error) {
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

fetchData();