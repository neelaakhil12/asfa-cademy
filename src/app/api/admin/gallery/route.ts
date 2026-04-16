import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import cloudinary from "@/lib/cloudinary";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function isAuthenticated(req: NextRequest) {
    return req.cookies.get("asfa_admin_session")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
    const categories = ["national", "deaf-national", "state", "district", "memories", "videos"];
    const result: Record<string, string[]> = {};

    try {
        console.log('Fetching gallery categories from Cloudinary and Supabase...');
        
        await Promise.all(categories.map(async (cat) => {
            const urls: string[] = [];
            
            // 1. Fetch from Cloudinary
            try {
                const cloudResults = await cloudinary.api.resources({
                    type: 'upload',
                    prefix: `asfa/${cat}`,
                    max_results: 100
                });
                if (cloudResults.resources) {
                    cloudResults.resources.forEach((resource: any) => {
                        urls.push(resource.secure_url);
                    });
                }
            } catch (cloudErr) {
                console.error(`Cloudinary fetch failed for ${cat}:`, cloudErr);
            }

            // 2. Fetch from Supabase (Existing images)
            try {
                const { data, error } = await supabase.storage
                    .from('gallery')
                    .list(cat, {
                        limit: 100,
                        offset: 0,
                        sortBy: { column: 'name', order: 'desc' }
                    });

                if (!error && data && data.length > 0) {
                    data.forEach(file => {
                        const { data: { publicUrl } } = supabase.storage
                            .from('gallery')
                            .getPublicUrl(`${cat}/${file.name}`);
                        urls.push(publicUrl);
                    });
                }
            } catch (e) {
                console.error(`Supabase fetch failed for ${cat}`);
            }

            // 3. Local Fallback (If both cloud and DB are empty)
            if (urls.length === 0) {
                const publicDir = path.join(process.cwd(), 'public');
                try {
                    const files = fs.readdirSync(publicDir);
                    const localFiles = files.filter(f => {
                        const prefix = cat === "deaf-national" ? "deaf-national" : cat;
                        const isMatch = f.startsWith(prefix);
                        if (cat === "videos") {
                            return (f.toLowerCase().includes("video") || f.toLowerCase().includes("vlog")) && /\.(mp4|mov|webm|avi)$/i.test(f);
                        }
                        return isMatch && /\.(png|jpg|jpeg|webp)$/i.test(f);
                    }).map(f => `/${f}`);
                    urls.push(...localFiles);
                } catch (fsError) {}
            }

            result[cat] = urls;
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Gallery API error:', error);
        return NextResponse.json({}, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    if (!isAuthenticated(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { filePath } = await req.json();

        // Case 1: Local File Deletion
        if (filePath.startsWith('/')) {
            const localPath = path.join(process.cwd(), 'public', filePath.substring(1));
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
                return NextResponse.json({ success: true, message: "Local file deleted" });
            }
            return NextResponse.json({ error: "Local file not found" }, { status: 404 });
        }

        // Case 2: Cloudinary Deletion
        if (filePath.includes('cloudinary.com')) {
            // Extract public_id from URL
            // Format: https://res.cloudinary.com/cloud_name/image/upload/v12345/asfa/category/public_id.jpg
            const parts = filePath.split('/');
            const folderPartIndex = parts.indexOf('asfa');
            if (folderPartIndex !== -1) {
                const publicIdWithExt = parts.slice(folderPartIndex).join('/');
                const publicId = publicIdWithExt.split('.')[0];
                
                const result = await cloudinary.uploader.destroy(publicId);
                if (result.result === 'ok') {
                    return NextResponse.json({ success: true, message: "Cloudinary file deleted" });
                }
                throw new Error("Cloudinary deletion failed: " + result.result);
            }
        }

        // Case 3: Supabase Storage Deletion
        try {
            const urlObj = new URL(filePath);
            const pathParts = urlObj.pathname.split('/storage/v1/object/public/');
            if (pathParts.length >= 2) {
                const fullPath = pathParts[1];
                const firstSlashIndex = fullPath.indexOf('/');
                const bucket = fullPath.substring(0, firstSlashIndex);
                const relativePath = fullPath.substring(firstSlashIndex + 1);

                const { error } = await supabaseAdmin.storage
                    .from(bucket)
                    .remove([relativePath]);

                if (error) throw error;
                return NextResponse.json({ success: true, message: "Supabase file deleted" });
            }
        } catch (e) {}

        throw new Error("Unknown storage provider or invalid URL");
    } catch (error: any) {
        console.error('Gallery delete error:', error);
        return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
    }
}
