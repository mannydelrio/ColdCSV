import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateOpeningLine } from "@/lib/anthropic";
import { parseCSV, extractProspect, buildCSV } from "@/lib/csv";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("credits_used, credits_limit, plan")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const remaining = userData.credits_limit - userData.credits_used;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const content = await file.text();
  const { rows, columnMap, headers } = parseCSV(content);

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV has no rows" }, { status: 400 });
  }

  if (rows.length > remaining) {
    return NextResponse.json(
      { error: `Not enough credits. Need ${rows.length}, have ${remaining}.` },
      { status: 402 }
    );
  }

  const service = createServiceClient();

  const { data: job, error: jobError } = await service
    .from("jobs")
    .insert({
      user_id: user.id,
      status: "processing",
      row_count: rows.length,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  let creditsConsumed = 0;

  try {
    for (let i = 0; i < rows.length; i++) {
      const prospect = extractProspect(rows[i], columnMap);
      const openingLine = await generateOpeningLine(prospect);
      rows[i].coldcsv_opening_line = openingLine;
      creditsConsumed++;

      await service
        .from("jobs")
        .update({ credits_consumed: creditsConsumed })
        .eq("id", job.id);
    }

    const outputCsv = buildCSV(rows, headers);
    const base64 = Buffer.from(outputCsv, "utf-8").toString("base64");
    const downloadUrl = `data:text/csv;base64,${base64}`;

    await service
      .from("jobs")
      .update({
        status: "done",
        completed_at: new Date().toISOString(),
        credits_consumed: creditsConsumed,
        output_csv: base64,
      })
      .eq("id", job.id);

    await service
      .from("users")
      .update({ credits_used: userData.credits_used + creditsConsumed })
      .eq("id", user.id);

    await service.from("usage_logs").insert({
      user_id: user.id,
      job_id: job.id,
      rows_processed: creditsConsumed,
    });

    return NextResponse.json({ jobId: job.id, downloadUrl });
  } catch (err) {
    await service
      .from("jobs")
      .update({
        status: "error",
        credits_consumed: creditsConsumed,
        error_message: err instanceof Error ? err.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (creditsConsumed > 0) {
      await service
        .from("users")
        .update({ credits_used: userData.credits_used + creditsConsumed })
        .eq("id", user.id);
    }

    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
