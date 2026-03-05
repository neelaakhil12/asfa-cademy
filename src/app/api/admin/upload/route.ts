import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function isAuthenticated(req: NextRequest) {
    return req.cookies.get("asfa_admin_session")?.value === "authenticated";
}

export async function POST(req: NextRequest) {
    if (!isAuthenticated(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const category = formData.get("category") as string;

        if (!file || !category) {
            return NextResponse.json({ error: "File and category required" }, { status: 400 });
        }

        const bucketName = (category === "athletes" || category === "team") ? "uploads" : "gallery";
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const filePath = `${category}/${safeName}`;

        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const { data, error } = await supabaseAdmin.storage
                .from(bucketName)
                .upload(filePath, buffer, {
                    contentType: file.type,
                    upsert: true
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            return NextResponse.json({ path: publicUrl, name: safeName }, { status: 201 });
        } catch (supaError: any) {
            console.error('Supabase upload failed:', supaError);
            return NextResponse.json({ error: supaError.message || "Supabase upload failed" }, { status: 500 });
        }
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
