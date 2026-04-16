import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fetch from 'cross-fetch';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function migrateImages() {
    console.log("Starting image migration from Supabase Storage to Cloudinary...");

    const tables = [
        { name: 'athletes', imageColumn: 'image' },
        { name: 'team', imageColumn: 'image' },
        { name: 'updates', imageColumn: 'image' }
    ];

    for (const table of tables) {
        console.log(`\nChecking table: ${table.name}`);
        const { data, error } = await supabase.from(table.name).select('*');
        
        if (error) {
            console.error(`Error fetching ${table.name}:`, error.message);
            continue;
        }

        for (const row of data) {
            const imageUrl = row[table.imageColumn];
            
            // Only migrate if it's a Supabase URL
            if (imageUrl && imageUrl.includes('supabase.co') && imageUrl.includes('/storage/v1/object/public/')) {
                console.log(`Migrating image for ${table.name} ID ${row.id}: ${imageUrl}`);
                
                try {
                    // Upload to Cloudinary directly from URL
                    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
                        folder: `asfa/${table.name}`,
                        resource_type: 'auto'
                    });

                    // Update Supabase DB with new Cloudinary URL
                    const { error: updateErr } = await supabase
                        .from(table.name)
                        .update({ [table.imageColumn]: uploadResult.secure_url })
                        .eq('id', row.id);

                    if (updateErr) {
                        console.error(`Failed to update DB for ${table.name} ID ${row.id}:`, updateErr.message);
                    } else {
                        console.log(`Successfully migrated to: ${uploadResult.secure_url}`);
                    }
                } catch (uploadErr: any) {
                    console.error(`Failed to upload ${imageUrl} to Cloudinary:`, uploadErr.message);
                }
            }
        }
    }

    console.log("\nImage migration finished!");
}

migrateImages();
