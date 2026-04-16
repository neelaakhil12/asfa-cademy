import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
import fs from "fs/promises";
import path from "path";

function isAuthenticated(req: NextRequest) {
    return req.cookies.get("asfa_admin_session")?.value === "authenticated";
}

export async function POST(req: NextRequest) {
    if (!isAuthenticated(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs: string[] = [];
    const rootPath = process.cwd();

    try {
        // 1. Sync Athletes
        logs.push("--- Syncing Athletes ---");
        try {
            const athletesData = JSON.parse(await fs.readFile(path.join(rootPath, "src/data/athletes.json"), "utf8"));
            for (const item of athletesData) {
                const { id, ...data } = item;
                console.log(`Sync: Attempting upsert for athlete ${data.name}`);
                const { data: upsertData, error } = await supabase.from("athletes").upsert([data], { onConflict: "name" }).select();
                if (error) {
                    console.error(`Sync error for athlete ${data.name}:`, error);
                    logs.push(`Error syncing athlete ${data.name}: ${error.message}`);
                } else {
                    console.log(`Sync success for athlete ${data.name}:`, upsertData);
                    logs.push(`Synced athlete: ${data.name}`);
                }
            }
        } catch (e: any) { logs.push(`Athletes file error: ${e.message}`); }

        // 2. Sync Team
        logs.push("--- Syncing Team ---");
        try {
            const teamData = JSON.parse(await fs.readFile(path.join(rootPath, "src/data/team.json"), "utf8"));
            for (const item of teamData) {
                const { id, ...data } = item;
                console.log(`Sync: Attempting upsert for team member ${data.name}`);
                const { data: upsertData, error } = await supabase.from("team").upsert([data], { onConflict: "name" }).select();
                if (error) {
                    console.error(`Sync error for team member ${data.name}:`, error);
                    logs.push(`Error syncing team member ${data.name}: ${error.message}`);
                } else {
                    console.log(`Sync success for team member ${data.name}:`, upsertData);
                    logs.push(`Synced team member: ${data.name}`);
                }
            }
        } catch (e: any) { logs.push(`Team file error: ${e.message}`); }

        // 3. Sync Updates
        logs.push("--- Syncing Updates ---");
        try {
            const updatesData = JSON.parse(await fs.readFile(path.join(rootPath, "src/data/updates.json"), "utf8"));
            for (const item of updatesData) {
                const { id, coachQuote, ...rest } = item;
                const data = { ...rest, coach_quote: coachQuote };
                console.log(`Sync: Attempting upsert for update ${data.title}`);
                const { data: upsertData, error } = await supabase.from("updates").upsert([data], { onConflict: "title" }).select();
                if (error) {
                    console.error(`Sync error for update ${data.title}:`, error);
                    logs.push(`Error syncing update ${data.title}: ${error.message}`);
                } else {
                    console.log(`Sync success for update ${data.title}:`, upsertData);
                    logs.push(`Synced update: ${data.title}`);
                }
            }
        } catch (e: any) { logs.push(`Updates file error: ${e.message}`); }

        // 4. Sync Gallery (Cloudinary)
        logs.push("--- Syncing Gallery to Cloudinary ---");
        const categories = ["national", "deaf-national", "state", "district", "memories"];
        const publicFiles = await fs.readdir(path.join(rootPath, "public"));

        for (const cat of categories) {
            const matchingFiles = publicFiles.filter(f => f.startsWith(cat) && f.match(/\.(png|jpg|jpeg|webp|mp4)$/i));
            logs.push(`Found ${matchingFiles.length} files for category: ${cat}`);

            for (const file of matchingFiles) {
                const filePath = path.join(rootPath, "public", file);
                const fileBuffer = await fs.readFile(filePath);

                try {
                    const uploadResult = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                folder: `asfa/${cat}`,
                                public_id: file.split('.')[0],
                                resource_type: "auto",
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        uploadStream.end(fileBuffer);
                    }) as any;
                    
                    logs.push(`Uploaded ${file} to Cloudinary folder asfa/${cat}`);
                } catch (cloudinaryErr: any) {
                    logs.push(`Error uploading ${file} to Cloudinary: ${cloudinaryErr.message}`);
                }
            }
        }

        return NextResponse.json({ success: true, logs });
    } catch (error: any) {
        console.error("Sync error:", error);
        return NextResponse.json({ error: error.message, logs }, { status: 500 });
    }
}
