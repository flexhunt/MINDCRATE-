import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL, 
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    console.log('Fetching all articles again...');
    const { rows } = await db.execute('SELECT slug FROM articles');
    
    console.log(`Found ${rows.length} articles. Randomizing created_at timestamps within LAST 5 MONTHS...`);
    const now = Date.now();
    // 5 months = ~150 days
    const msIn5Months = 150 * 24 * 60 * 60 * 1000; 
    
    let count = 0;
    for (const row of rows) {
        // Generate random date strictly between 5 months ago and today
        const randomDate = new Date(now - Math.random() * msIn5Months);
        const dateStr = randomDate.toISOString();
        
        await db.execute({
            sql: 'UPDATE articles SET created_at = ? WHERE slug = ?',
            args: [dateStr, row.slug]
        });
        count++;
        if (count % 100 === 0) console.log(`Re-processed ${count} articles...`);
    }
    console.log('Done! All articles are now organically mixed within a 5-month window.');
    process.exit(0);
}

run().catch(console.error);
