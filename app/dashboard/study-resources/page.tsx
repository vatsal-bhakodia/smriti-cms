"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
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
import { Plus } from "lucide-react";

interface StudyResource {
  id: string;
  subjectId: string;
  type: "notes" | "pyq" | "books" | "practical";
  link: string;
  createdAt: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function StudyResourcesPage() {
  const searchParams = useSearchParams();
  const subjectIdFilter = searchParams.get("subjectId");

  const [resources, setResources] = React.useState<StudyResource[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StudyResource | null>(null);
  const [formData, setFormData] = React.useState({
    subjectId: subjectIdFilter || "",
    type: "notes" as "notes" | "pyq" | "books" | "practical",
    link: "",
  });

  React.useEffect(() => {
    fetchSubjects();
    fetchResources();
  }, [subjectIdFilter]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/cms/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const url = subjectIdFilter
        ? `/api/cms/study-resources?subjectId=${subjectIdFilter}`
        : "/api/cms/study-resources";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing
        ? `/api/cms/study-resources/${editing.id}`
        : "/api/cms/study-resources";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setDialogOpen(false);
        setEditing(null);
        setFormData({
          subjectId: subjectIdFilter || "",
          type: "notes",
          link: "",
        });
        fetchResources();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save resource");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const handleEdit = (resource: StudyResource) => {
    setEditing(resource);
    setFormData({
      subjectId: resource.subjectId,
      type: resource.type,
      link: resource.link,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (resource: StudyResource) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const res = await fetch(`/api/cms/study-resources/${resource.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchResources();
      } else {
        alert("Failed to delete resource");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const columns = [
    {
      key: "subjectId",
      header: "Subject",
      render: (value: string) => {
        const subject = subjects.find((s) => s.id === value);
        return subject ? `${subject.code} - ${subject.name}` : value;
      },
    },
    {
      key: "type",
      header: "Type",
      render: (value: string) => value.toUpperCase(),
    },
    {
      key: "link",
      header: "Link",
      render: (value: string) => (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {value.length > 50 ? `${value.substring(0, 50)}...` : value}
        </a>
      ),
    },
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
          <h1 className="text-3xl font-bold">Study Resources</h1>
          <p className="text-muted-foreground">
            {subjectIdFilter
              ? `Resources for ${subjects.find((s) => s.id === subjectIdFilter)?.name || "selected subject"}`
              : "Manage study resources"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      <DataTable
        data={resources}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Resource" : "Add Resource"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update resource information"
                  : "Add a new study resource"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="subjectId">Subject</Label>
                <select
                  id="subjectId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectId: e.target.value })
                  }
                  required
                  disabled={!!subjectIdFilter}
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as typeof formData.type,
                    })
                  }
                  required
                >
                  <option value="notes">Notes</option>
                  <option value="pyq">Previous Year Questions</option>
                  <option value="books">Books</option>
                  <option value="practical">Practical</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="link">Link</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="https://example.com/resource"
                  required
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
                  setFormData({
                    subjectId: subjectIdFilter || "",
                    type: "notes",
                    link: "",
                  });
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

