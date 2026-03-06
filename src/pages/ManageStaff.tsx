import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus, Loader2, Shield } from "lucide-react";
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
  const { user, session } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");

  const fetchStaff = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const staffList: StaffMember[] = (profiles || []).map((p) => ({
        id: p.id,
        email: p.email || "",
        full_name: p.full_name || "",
        role: roles?.find((r) => r.user_id === p.id)?.role || "staff",
        created_at: p.created_at,
      }));

      setStaff(staffList);
    } catch (err: any) {
      toast.error("Failed to load staff: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);

    try {
      // Step 1: Save admin tokens BEFORE anything else
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      if (!adminSession) throw new Error("No active session");
      const adminAccessToken = adminSession.access_token;
      const adminRefreshToken = adminSession.refresh_token;

      // Step 2: Sign up new staff (this will switch the session)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Failed to create user");

      // Step 3: Immediately restore admin session BEFORE any DB calls
      await supabase.auth.setSession({
        access_token: adminAccessToken,
        refresh_token: adminRefreshToken,
      });

      // Step 4: Insert role (now running as admin again)
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: signUpData.user.id, role: role as "admin" | "staff" });

      if (roleError) throw roleError;

      toast.success(`${name} added successfully!`);
      setName(""); setEmail(""); setPassword(""); setRole("staff");
      fetchStaff();

    } catch (err: any) {
      toast.error("Failed to add staff: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, memberName: string) => {
    if (!confirm(`Remove "${memberName}"?`)) return;
    try {
      await supabase.from("user_roles").delete().eq("user_id", id);
      await supabase.from("profiles").delete().eq("id", id);
      toast.success("Staff member removed");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole as "admin" | "staff" });
      if (error) throw error;
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
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No staff members yet. Add your first staff member above.
                </td>
              </tr>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(s.id, s.full_name || s.email)}
                    >
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