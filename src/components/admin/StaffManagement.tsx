import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Shield } from "lucide-react";

interface StaffMember {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  role_id: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  sales_bdc: "Sales / BDC",
  used_car_manager: "Used Car Manager",
  gsm_gm: "GSM / GM",
  user: "User",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/15 text-destructive",
  gsm_gm: "bg-accent/20 text-accent",
  used_car_manager: "bg-warning/20 text-warning-foreground",
  sales_bdc: "bg-success/20 text-success",
  user: "bg-muted text-muted-foreground",
};

const StaffManagement = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_all_staff");
    if (error) {
      toast({ title: "Error", description: "Failed to load staff.", variant: "destructive" });
    } else {
      setStaff(data || []);
    }
    setLoading(false);
  };

  const handleRemove = async (member: StaffMember) => {
    if (!confirm(`Remove ${member.email || member.display_name || "this user"} (${ROLE_LABELS[member.role] || member.role})? They will lose dashboard access.`)) return;

    const { error } = await supabase.rpc("remove_staff_role", { _role_id: member.role_id });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed", description: `${member.email || "User"} has been removed.` });
      setStaff(prev => prev.filter(s => s.role_id !== member.role_id));
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading staff...</div>;
  }

  if (staff.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No staff members found.</div>;
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">User</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Role</th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr key={member.role_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-card-foreground">{member.display_name || member.email || "Unknown"}</div>
                {member.display_name && member.email && (
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[member.role] || "bg-muted text-muted-foreground"}`}>
                  <Shield className="w-3 h-3 inline mr-1" />
                  {ROLE_LABELS[member.role] || member.role}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(member)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffManagement;
