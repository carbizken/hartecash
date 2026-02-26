import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConsentRecord {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  consent_type: string;
  form_source: string;
  submission_token: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  sell_form: "Sell My Car",
  schedule_visit: "Schedule Visit",
  service_landing: "Service Landing",
};

const ConsentLog = () => {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("consent_log" as any)
      .select("id, created_at, customer_name, customer_phone, customer_email, consent_type, form_source, submission_token")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) setRecords(data as any);
    setLoading(false);
  };

  const filtered = records.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.customer_name || "").toLowerCase().includes(s) ||
      (r.customer_phone || "").toLowerCase().includes(s) ||
      (r.customer_email || "").toLowerCase().includes(s) ||
      (r.form_source || "").toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search consent records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} records</span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No consent records found.</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "numeric", minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{r.customer_name || "—"}</TableCell>
                  <TableCell className="text-sm">{r.customer_phone || "—"}</TableCell>
                  <TableCell className="text-sm">{r.customer_email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {SOURCE_LABELS[r.form_source] || r.form_source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <ShieldCheck className="w-3.5 h-3.5" /> SMS/Calls/Email
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ConsentLog;
