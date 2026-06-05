import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  ShoppingCart,
  UserCheck,
  UserX,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "sales" | "user";
  isActive: boolean;
  createdAt: Date;
  lastSignedIn: Date;
};

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <Badge className="gap-1 bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30">
        <ShieldCheck className="w-3 h-3" /> Admin
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30">
      <ShoppingCart className="w-3 h-3" /> Sales
    </Badge>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="gap-1 bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
      <UserCheck className="w-3 h-3" /> Active
    </Badge>
  ) : (
    <Badge className="gap-1 bg-red-600/20 text-red-400 border-red-600/30">
      <UserX className="w-3 h-3" /> Inactive
    </Badge>
  );
}

function PasswordInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setShow(s => !s)}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Redirect non-admins
  if (currentUser && currentUser.role !== "admin") {
    navigate("/");
    return null;
  }

  const { data: users = [], isLoading } = trpc.users.list.useQuery();

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "sales" as "admin" | "sales" });

  // Edit user dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "sales" as "admin" | "sales", isActive: true, password: "" });

  // Delete confirm dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "sales" });
      toast.success("User created", { description: "The new user can now log in." });
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setEditOpen(false);
      toast.success("User updated");
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setDeleteOpen(false);
      toast.success("User deleted");
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  function openEdit(u: UserRow) {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role === "user" ? "sales" : u.role as "admin" | "sales", isActive: u.isActive, password: "" });
    setEditOpen(true);
  }

  function openDelete(u: UserRow) {
    setDeleteUser(u);
    setDeleteOpen(true);
  }

  const adminCount = users.filter(u => u.role === "admin").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage admin and sales staff accounts
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold">{users.length}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-blue-400">{adminCount}</div>
          <div className="text-sm text-muted-foreground">Admins</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-green-400">{users.filter(u => u.role !== "admin").length}</div>
          <div className="text-sm text-muted-foreground">Sales Staff</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Sign In</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">No users found</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {u.name}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3"><StatusBadge isActive={u.isActive} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(u.lastSignedIn).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(u as UserRow)}
                        title="Edit user"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => openDelete(u as UserRow)}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? "Cannot delete yourself" : "Delete user"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. John Mensah"
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. john@kenniefresh.biz"
                value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <PasswordInput
                value={createForm.password}
                onChange={v => setCreateForm(f => ({ ...f, password: v }))}
                placeholder="Min. 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={v => setCreateForm(f => ({ ...f, role: v as "admin" | "sales" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales — Can manage products, inventory & sales</SelectItem>
                  <SelectItem value="admin">Admin — Full access including user management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(createForm)}
              disabled={createMutation.isPending || !createForm.name || !createForm.email || !createForm.password}
            >
              {createMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" /> Edit User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={v => setEditForm(f => ({ ...f, role: v as "admin" | "sales" }))}
                disabled={editUser?.id === currentUser?.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {editUser?.id === currentUser?.id && (
                <p className="text-xs text-muted-foreground">You cannot change your own role</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={editForm.isActive ? "active" : "inactive"}
                onValueChange={v => setEditForm(f => ({ ...f, isActive: v === "active" }))}
                disabled={editUser?.id === currentUser?.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive (cannot log in)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> New Password
                <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>
              </Label>
              <PasswordInput
                value={editForm.password}
                onChange={v => setEditForm(f => ({ ...f, password: v }))}
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!editUser) return;
                updateMutation.mutate({
                  id: editUser.id,
                  name: editForm.name || undefined,
                  email: editForm.email || undefined,
                  role: editForm.role,
                  isActive: editForm.isActive,
                  password: editForm.password || undefined,
                });
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" /> Delete User
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-foreground">{deleteUser?.name}</span>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteUser && deleteMutation.mutate({ id: deleteUser.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
