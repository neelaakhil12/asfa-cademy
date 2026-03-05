import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function isAuthenticated(req: NextRequest) {
    return req.cookies.get("asfa_admin_session")?.value === "authenticated";
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('team')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data || []);
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
        const { id, ...memberData } = body;
        console.log('Admin Team: Attempting POST with payload:', memberData);

        const { data, error } = await supabaseAdmin
            .from('team')
            .insert([memberData])
            .select()
            .single();

        if (error) {
            console.error('Supabase Team POST error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('Admin Team: POST success');
        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('API Team POST error:', error);
        return NextResponse.json({ error: error.message || "Failed to create team member" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    if (!isAuthenticated(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { id, ...updateData } = body;
        console.log(`Admin Team: Attempting PUT for ID ${id} with payload:`, updateData);

        const { data, error } = await supabaseAdmin
            .from('team')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase Team PUT error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('Admin Team: PUT success');
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Team PUT error:', error);
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
            .from('team')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Supabase delete error:', error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
