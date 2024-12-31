const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function fetchData() {
  try {
    const response = await axios.get('https://bilastopa.cz/cs/uvodni-strana-2/');
    const $ = cheerio.load(response.data);
    
    const conditions = [];
    
    // Parse each region's data
    $('.news-item').each((i, element) => {
      const title = $(element).find('.title').text().trim();
      const date = $(element).find('.date').text().trim();
      const content = $(element).find('.content').text().trim();
      
      // Check for skating conditions
      const hasSkating = content.toLowerCase().includes('bruslení') || 
                        content.toLowerCase().includes('skate') ||
                        content.toLowerCase().includes('upraveno pro bruslení');
      
      conditions.push({
        region: title,
        date: date,
        content: content,
        skating: hasSkating
      });
    });
    
    // Save to data.json
    fs.writeFileSync('data.json', JSON.stringify(conditions, null, 2));
    
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

fetchData();