import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
import fs from "fs";
import path from "path";

function isAuthenticated(req: NextRequest) {
    return req.cookies.get("asfa_admin_session")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
    const categories = ["national", "deaf-national", "state", "district", "memories", "videos"];
    const result: Record<string, string[]> = {};

    try {
        console.log('Fetching gallery categories from Supabase...');
        const categoryData = await Promise.all(categories.map(async (cat) => {
            try {
                const { data, error } = await supabase.storage
                    .from('gallery')
                    .list(cat, {
                        limit: 100,
                        offset: 0,
                        sortBy: { column: 'name', order: 'desc' }
                    });

                if (!error && data && data.length > 0) {
                    const urls = data.map(file => {
                        const { data: { publicUrl } } = supabase.storage
                            .from('gallery')
                            .getPublicUrl(`${cat}/${file.name}`);
                        return publicUrl;
                    });
                    return { cat, files: urls };
                }
            } catch (e) {
                console.error(`Supabase fetch failed for ${cat}, using local fallback`);
            }

            // --- Local Fallback ---
            const publicDir = path.join(process.cwd(), 'public');
            try {
                const files = fs.readdirSync(publicDir);
                const localFiles = files.filter(f => {
                    // Match files starting with category prefix (e.g. "national-", "state-")
                    const prefix = cat === "deaf-national" ? "deaf-national" : cat;
                    const isMatch = f.startsWith(prefix);

                    // Special case for videos: match if file contains "video" or has video extension
                    if (cat === "videos") {
                        return (f.toLowerCase().includes("video") || f.toLowerCase().includes("vlog")) && /\.(mp4|mov|webm|avi)$/i.test(f);
                    }

                    return isMatch && /\.(png|jpg|jpeg|webp)$/i.test(f);
                }).map(f => `/${f}`);

                console.log(`Fallback for ${cat}: found ${localFiles.length} files`);
                return { cat, files: localFiles };
            } catch (fsError) {
                console.error(`Local fallback failed for ${cat}:`, fsError);
                return { cat, files: [] };
            }
        }));

        categoryData.forEach(({ cat, files }) => {
            result[cat] = files;
        });

        // Ensure all categories exist even if empty
        categories.forEach(cat => {
            if (!result[cat]) result[cat] = [];
        });

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

        // Case 1: Local File Deletion (starts with /)
        if (filePath.startsWith('/')) {
            if (process.env.NODE_ENV !== 'development') {
                return NextResponse.json({ error: "Local files can only be deleted in development mode" }, { status: 403 });
            }

            const localPath = path.join(process.cwd(), 'public', filePath.substring(1));
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
                return NextResponse.json({ success: true, message: "Local file deleted" });
            }
            return NextResponse.json({ error: "Local file not found" }, { status: 404 });
        }

        // Case 2: Supabase Storage Deletion
        const urlObj = new URL(filePath);
        const pathParts = urlObj.pathname.split('/storage/v1/object/public/');
        if (pathParts.length < 2) throw new Error("Invalid URL format");

        const fullPath = pathParts[1]; // e.g., "gallery/national/image.jpg"
        const firstSlashIndex = fullPath.indexOf('/');
        const bucket = fullPath.substring(0, firstSlashIndex);
        const relativePath = fullPath.substring(firstSlashIndex + 1);

        const { error } = await supabaseAdmin.storage
            .from(bucket)
            .remove([relativePath]);

        if (error) throw error;
        return NextResponse.json({ success: true, message: "Supabase file deleted" });
    } catch (error: any) {
        console.error('Gallery delete error:', error);
        return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
    }
}
