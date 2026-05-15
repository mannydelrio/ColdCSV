import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("id, status, row_count, credits_consumed, error_message, output_csv, completed_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const withinWindow = data.completed_at
    ? Date.now() - new Date(data.completed_at).getTime() < 24 * 60 * 60 * 1000
    : false;

  const downloadUrl =
    data.output_csv && withinWindow
      ? `data:text/csv;base64,${data.output_csv}`
      : null;

  return NextResponse.json({
    status: data.status,
    progress: data.credits_consumed ?? 0,
    rowCount: data.row_count,
    error: data.error_message,
    downloadUrl,
  });
}
