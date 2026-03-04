import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus, Loader2, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function ManageStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");

  const callEdge = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-staff", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const fetchStaff = async () => {
    try {
      const data = await callEdge({ action: "list_staff" });
      setStaff(data.staff || []);
    } catch (err: any) {
      toast.error("Failed to load staff: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await callEdge({
        action: "create_staff",
        email,
        password,
        full_name: name,
        role,
      });
      toast.success("Staff member added");
      setName(""); setEmail(""); setPassword(""); setRole("staff");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, memberName: string) => {
    if (!confirm(`Remove "${memberName}"?`)) return;
    try {
      await callEdge({ action: "delete_staff", user_id: id });
      toast.success("Staff member removed");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await callEdge({ action: "update_role", user_id: userId, role: newRole });
      toast.success("Role updated");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Staff</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Add Staff Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No staff members</td></tr>
            ) : staff.map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/50 transition-colors">
                <td className="p-3 font-medium">{s.full_name || "—"}</td>
                <td className="p-3 text-muted-foreground">{s.email}</td>
                <td className="p-3">
                  {s.id === user?.id ? (
                    <Badge variant="default" className="gap-1">
                      <Shield className="h-3 w-3" /> {s.role}
                    </Badge>
                  ) : (
                    <Select value={s.role} onValueChange={(v) => handleRoleChange(s.id, v)}>
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="p-3 text-right">
                  {s.id !== user?.id && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id, s.full_name || s.email)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
