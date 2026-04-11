import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ConsentRecord {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  consent_type: string;
  form_source: string;
  submission_token: string | null;
  consent_version: string | null;
}

interface ConsentVersion {
  id: string;
  version: string;
  consent_type: string;
  text: string;
  is_active: boolean;
  published_at: string;
  published_by: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  sell_form: "Sell My Car",
  schedule_visit: "Schedule Visit",
  service_landing: "Service Landing",
};

const ConsentLog = () => {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [versions, setVersions] = useState<ConsentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRecords();
    fetchVersions();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("consent_log")
      .select("id, created_at, customer_name, customer_phone, customer_email, consent_type, form_source, submission_token, consent_version")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) setRecords(data as any);
    setLoading(false);
  };

  const fetchVersions = async () => {
    setVersionsLoading(true);
    const { data } = await (supabase as any)
      .from("consent_text_versions")
      .select("id, version, consent_type, text, is_active, published_at, published_by")
      .order("published_at", { ascending: false });
    if (data) setVersions(data as ConsentVersion[]);
    setVersionsLoading(false);
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
    <Tabs defaultValue="records">
      <TabsList className="mb-4">
        <TabsTrigger value="records" className="gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Records
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-1.5">
          <History className="w-3.5 h-3.5" /> Consent Text History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="records">
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
                  <TableHead>Version</TableHead>
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
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {r.consent_version || "v1"}
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
      </TabsContent>

      <TabsContent value="history">
        <p className="text-sm text-muted-foreground mb-4">
          Every customer consent record links to one of these versions. Keeping
          a clean version history lets you prove exactly what a customer agreed
          to on any given day without re-reading thousands of rows.
        </p>
        {versionsLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No consent text versions yet. The v1 baseline will appear here after the migration runs.
          </p>
        ) : (
          <div className="space-y-3">
            {versions.map((v) => (
              <div key={v.id} className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="font-mono text-xs">{v.version}</Badge>
                  <Badge variant="outline" className="text-[10px]">{v.consent_type}</Badge>
                  {v.is_active && (
                    <Badge className="text-[10px] bg-success/15 text-success border-success/30">Active</Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    Published {new Date(v.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {v.published_by ? ` by ${v.published_by}` : ""}
                  </span>
                </div>
                <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ConsentLog;
