const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function fetchData() {
  try {
    console.log('🔍 DEBUG START: Script initialization');
    console.log('🔍 DEBUG START: Fetching webpage');
    
    const response = await axios.get('https://bilastopa.cz/cs/aktualni-zpravodajstvi/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('✅ DEBUG END: Webpage fetched');
    console.log('📄 CONTENT START ----------------');
    console.log(response.data.substring(0, 1000));
    console.log('📄 CONTENT END ------------------');

    const $ = cheerio.load(response.data);
    const conditions = [];
    
    console.log('🔍 DEBUG START: Searching for content elements');
    
    // Log all div classes for debugging
    $('div').each((i, el) => {
      const className = $(el).attr('class');
      if (className) console.log('📦 Found div class:', className);
    });

    $('article, .art-post, .post').each((i, element) => {
      console.log(`\n🔍 DEBUG START: Processing element ${i + 1}`);
      try {
        const title = $(element).find('h2, .art-postheader').text().trim();
        console.log('📌 Found title:', title || 'NO TITLE');
        
        const content = $(element).find('.entry-content, .art-postcontent').text().trim();
        console.log('📝 Content length:', content.length);
        console.log('📝 Content preview:', content.substring(0, 100));
        
        const date = $(element).find('time, .art-postdateicon').text().trim();
        console.log('🗓 Found date:', date || 'NO DATE');

        if (title && content) {
          console.log('✅ Adding valid entry');
          conditions.push({
            region: title,
            date: date || new Date().toLocaleDateString('cs-CZ'),
            content: content,
            skating: content.toLowerCase().includes('bruslení'),
            lastUpdate: new Date().toISOString()
          });
        } else {
          console.log('❌ Skipping invalid entry');
        }
      } catch (err) {
        console.error('❌ ERROR processing element:', err);
      }
    });

    console.log(`\n📊 SUMMARY: Found ${conditions.length} valid updates`);
    
    if (conditions.length > 0) {
      console.log('💾 Writing new data to data.json');
      await fs.writeFile('data.json', JSON.stringify(conditions, null, 2));
      console.log('✅ Data saved successfully');
    } else {
      console.log('⚠️ No new updates found');
      try {
        const existing = await fs.readFile('data.json', 'utf8');
        console.log('✅ Keeping existing data');
      } catch (err) {
        console.log('💾 Creating empty data file');
        await fs.writeFile('data.json', JSON.stringify([], null, 2));
      }
    }
  } catch (error) {
    console.error('❌ MAIN ERROR:', error.message);
    console.error('🔍 FULL ERROR:', error);
    process.exit(1);
  }
}

fetchData();