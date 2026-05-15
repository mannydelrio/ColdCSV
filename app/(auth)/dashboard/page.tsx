import { createClient } from "@/lib/supabase/server";
import CreditMeter from "@/components/CreditMeter";
import UploadZone from "@/components/UploadZone";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from("users")
    .select("plan, credits_used, credits_limit, credits_reset_at")
    .eq("id", user!.id)
    .single();

  const { data: recentJobs } = await supabase
    .from("jobs")
    .select("id, status, row_count, credits_consumed, created_at, completed_at, output_csv")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-[#1A1A18]">Dashboard</h1>
        <p className="text-[#5A5A54] text-sm mt-1">
          Upload a prospect CSV to generate personalized opening lines.
        </p>
      </div>

      {userData && (
        <CreditMeter
          plan={userData.plan}
          creditsUsed={userData.credits_used}
          creditsLimit={userData.credits_limit}
          creditsResetAt={userData.credits_reset_at}
        />
      )}

      <UploadZone
        remainingCredits={(userData?.credits_limit ?? 0) - (userData?.credits_used ?? 0)}
      />

      {/* Recent jobs */}
      {recentJobs && recentJobs.length > 0 && (
        <div>
          <h2 className="font-display text-xl text-[#1A1A18] mb-4">Recent jobs</h2>
          <div className="bg-white border border-[#E8E8E2] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E8E2]">
                  <th className="text-left px-5 py-3 text-[#9A9A94] font-medium">Date</th>
                  <th className="text-left px-5 py-3 text-[#9A9A94] font-medium">Rows</th>
                  <th className="text-left px-5 py-3 text-[#9A9A94] font-medium">Credits</th>
                  <th className="text-left px-5 py-3 text-[#9A9A94] font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-[#9A9A94] font-medium">Download</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => {
                  const withinWindow = job.completed_at
                    ? Date.now() - new Date(job.completed_at).getTime() < 24 * 60 * 60 * 1000
                    : false;
                  const downloadUrl = job.output_csv && withinWindow
                    ? `data:text/csv;base64,${job.output_csv}`
                    : null;
                  return (
                  <tr key={job.id} className="border-b border-[#E8E8E2] last:border-0">
                    <td className="px-5 py-3 text-[#5A5A54]">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-[#1A1A18]">{job.row_count ?? "—"}</td>
                    <td className="px-5 py-3 text-[#1A1A18]">{job.credits_consumed ?? "—"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-5 py-3">
                      {downloadUrl ? (
                        <a
                          href={downloadUrl}
                          download={`coldcsv-${job.id.slice(0, 8)}.csv`}
                          className="text-sm text-[#2A6B4A] font-medium hover:underline"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-sm text-[#9A9A94]">
                          {job.status === "done" ? "Expired" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    done: "bg-[#2A6B4A]/10 text-[#2A6B4A]",
    processing: "bg-blue-50 text-blue-600",
    pending: "bg-yellow-50 text-yellow-600",
    error: "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}
