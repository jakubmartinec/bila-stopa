const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function fetchData() {
  try {
    console.log('DEBUG: Starting script');
    console.log('DEBUG: Fetching data from bilastopa.cz...');
    
    const response = await axios.get('https://bilastopa.cz/cs/aktualni-zpravodajstvi/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('DEBUG: Response received, content length:', response.data.length);
    console.log('DEBUG: First 500 chars of response:', response.data.substring(0, 500));

    const $ = cheerio.load(response.data);
    const conditions = [];
    
    console.log('DEBUG: Looking for article elements...');
    
    $('article').each((i, element) => {
      console.log(`DEBUG: Processing article ${i + 1}`);
      try {
        const title = $(element).find('h2').text().trim();
        console.log('DEBUG: Found title:', title);
        
        const content = $(element).find('.entry-content').text().trim();
        console.log('DEBUG: Found content length:', content.length);
        
        const date = $(element).find('time').text().trim();
        console.log('DEBUG: Found date:', date);

        if (title && content) {
          console.log('DEBUG: Adding valid entry for:', title);
          conditions.push({
            region: title,
            date: date,
            content: content,
            skating: content.toLowerCase().includes('bruslení'),
            lastUpdate: new Date().toISOString()
          });
        } else {
          console.log('DEBUG: Skipping invalid entry - missing title or content');
        }
      } catch (err) {
        console.error('DEBUG: Error processing article:', err);
      }
    });

    console.log(`DEBUG: Found ${conditions.length} valid updates`);
    
    if (conditions.length > 0) {
      console.log('DEBUG: Writing to data.json');
      await fs.writeFile('data.json', JSON.stringify(conditions, null, 2));
      console.log('DEBUG: File written successfully');
    } else {
      console.log('DEBUG: No updates to write');
      try {
        console.log('DEBUG: Checking for existing data.json');
        const existing = await fs.readFile('data.json', 'utf8');
        console.log('DEBUG: Existing data found');
      } catch (err) {
        console.log('DEBUG: No existing data.json, creating empty file');
        await fs.writeFile('data.json', JSON.stringify([], null, 2));
      }
    }
  } catch (error) {
    console.error('DEBUG: Main error:', error.message);
    console.error('DEBUG: Full error:', error);
    process.exit(1);
  }
}

fetchData();