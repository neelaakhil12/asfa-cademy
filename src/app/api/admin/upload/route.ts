import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

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

        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Upload to Cloudinary using a Promise wrapper for the stream
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `asfa/${category}`,
                        public_id: safeName.split('.')[0],
                        resource_type: "auto",
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(buffer);
            }) as any;

            return NextResponse.json({ 
                path: uploadResult.secure_url, 
                name: uploadResult.public_id 
            }, { status: 201 });
        } catch (cloudinaryError: any) {
            console.error('Cloudinary upload failed:', cloudinaryError);
            return NextResponse.json({ error: cloudinaryError.message || "Cloudinary upload failed" }, { status: 500 });
        }
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
