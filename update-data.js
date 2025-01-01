const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function fetchData() {
  try {
    console.log('Fetching data...');
    const response = await axios.get('https://bilastopa.cz/cs/aktualni-zpravodajstvi/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const conditions = [];
    
    // Debug: Print HTML structure
    console.log('Page structure:', $.html().substring(0, 500));

    // Try multiple potential selectors
    $('.art-post, .post').each((i, element) => {
      try {
        console.log('Found post element');
        const title = $(element).find('.art-postheader, h2.entry-title').text().trim();
        const content = $(element).find('.art-postcontent, .entry-content').text().trim();
        const date = $(element).find('.art-postdateicon, .entry-date').text().trim() 
                    || new Date().toLocaleDateString('cs-CZ');

        console.log('Parsed element:', { title, date });
        
        if (title && content) {
          conditions.push({
            region: title,
            date: date,
            content: content,
            skating: content.toLowerCase().includes('bruslení') || 
                    content.toLowerCase().includes('skate'),
            lastUpdate: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error parsing element:', err);
      }
    });

    console.log(`Found ${conditions.length} updates`);
    
    if (conditions.length > 0) {
      await fs.writeFile('data.json', JSON.stringify(conditions, null, 2));
      console.log('Data updated');
    } else {
      console.log('No new data found');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fetchData();