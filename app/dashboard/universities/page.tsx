"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Eye } from "lucide-react";
import { generateSlug } from "@/lib/utils";

interface University {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  createdAt: string;
}

export default function UniversitiesPage() {
  const router = useRouter();
  const [universities, setUniversities] = React.useState<University[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<University | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    location: "",
  });

  React.useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const res = await fetch("/api/cms/universities");
      if (res.ok) {
        const data = await res.json();
        setUniversities(data);
      }
    } catch (error) {
      console.error("Failed to fetch universities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing
        ? `/api/cms/universities/${editing.id}`
        : "/api/cms/universities";
      const method = editing ? "PUT" : "POST";

      // Auto-generate slug from name if slug is empty
      const payload = {
        ...formData,
        slug: formData.slug.trim() || generateSlug(formData.name),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        setEditing(null);
        setFormData({ name: "", slug: "", location: "" });
        fetchUniversities();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save university");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const handleEdit = (university: University) => {
    setEditing(university);
    setFormData({
      name: university.name,
      slug: university.slug,
      location: university.location || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (university: University) => {
    if (!confirm("Are you sure you want to delete this university?")) return;

    try {
      const res = await fetch(`/api/cms/universities/${university.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUniversities();
      } else {
        alert("Failed to delete university");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "slug", header: "Slug" },
    { key: "location", header: "Location" },
    {
      key: "createdAt",
      header: "Created",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Universities</h1>
          <p className="text-muted-foreground">
            Manage universities and their information
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add University
        </Button>
      </div>

      <DataTable
        data={universities}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={(university) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(`/dashboard/programs?universityId=${university.id}`)
            }
            title="View Programs"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit University" : "Add University"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update university information"
                  : "Add a new university to the system"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="Auto-generated from name if left empty"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditing(null);
                  setFormData({ name: "", slug: "", location: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
