import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function isAuthenticated(req: NextRequest) {
    return req.cookies.get("asfa_admin_session")?.value === "authenticated";
}

// Map snake_case database to camelCase frontend
const mapFromDB = (item: any) => ({
    ...item,
    coachQuote: item.coach_quote,
});

const mapToDB = (item: any) => {
    const { coachQuote, ...rest } = item;
    return {
        ...rest,
        coach_quote: coachQuote,
    };
};

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('updates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json((data || []).map(mapFromDB));
    } catch (error) {
        console.error('Supabase fetch error:', error);
        return NextResponse.json([]);
    }
}

export async function POST(req: NextRequest) {
    if (!isAuthenticated(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await req.json();
        const dbPayload = mapToDB(body);
        console.log('Admin Updates: Attempting POST with payload:', dbPayload);

        const { data, error } = await supabaseAdmin
            .from('updates')
            .insert([dbPayload])
            .select()
            .single();

        if (error) {
            console.error('Supabase POST error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('Admin Updates: POST success');
        return NextResponse.json(mapFromDB(data), { status: 201 });
    } catch (error: any) {
        console.error('API POST error:', error);
        return NextResponse.json({ error: error.message || "Failed to create update" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    if (!isAuthenticated(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { id, ...updateData } = body;
        const dbPayload = mapToDB(updateData);
        console.log(`Admin Updates: Attempting PUT for ID ${id} with payload:`, dbPayload);

        const { data, error } = await supabaseAdmin
            .from('updates')
            .update(dbPayload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase PUT error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('Admin Updates: PUT success');
        return NextResponse.json(mapFromDB(data));
    } catch (error: any) {
        console.error('API PUT error:', error);
        return NextResponse.json({ error: error.message || "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    if (!isAuthenticated(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { id } = await req.json();
        const { error } = await supabaseAdmin
            .from('updates')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Supabase delete error:', error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
