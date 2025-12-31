"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Plus, Eye, X } from "lucide-react";
import { generateSlug } from "@/lib/utils";

interface Program {
  id: string;
  universityId: string;
  name: string;
  slug: string;
  hasSpecialization: boolean;
  semesterCount: number;
  createdAt: string;
}

interface Specialization {
  id: string;
  programId: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface University {
  id: string;
  name: string;
}

export default function ProgramsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const universityIdFilter = searchParams.get("universityId");

  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [universities, setUniversities] = React.useState<University[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Program | null>(null);
  const [programSpecializations, setProgramSpecializations] = React.useState<
    Specialization[]
  >([]);
  const [formData, setFormData] = React.useState({
    universityId: universityIdFilter || "",
    name: "",
    slug: "",
    hasSpecialization: false,
    semesterCount: "8",
  });
  const [specializations, setSpecializations] = React.useState<
    Array<{ name: string; slug: string; id?: string }>
  >([]);

  React.useEffect(() => {
    fetchUniversities();
    fetchPrograms();
  }, [universityIdFilter]);

  const fetchUniversities = async () => {
    try {
      const res = await fetch("/api/cms/universities");
      if (res.ok) {
        const data = await res.json();
        setUniversities(data);
      }
    } catch (error) {
      console.error("Failed to fetch universities:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/cms/programs");
      if (res.ok) {
        const data = await res.json();
        // Filter by universityId if provided
        const filtered = universityIdFilter
          ? data.filter((p: Program) => p.universityId === universityIdFilter)
          : data;
        setPrograms(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing
        ? `/api/cms/programs/${editing.id}`
        : "/api/cms/programs";
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
        const programData = await res.json();
        const programId = programData.id;

        // Handle specializations
        if (formData.hasSpecialization) {
          // Get existing specialization IDs
          const existingIds = programSpecializations
            .map((s) => s.id)
            .filter(Boolean);

          // Create/update specializations
          for (const spec of specializations) {
            if (spec.id) {
              // Update existing
              await fetch(`/api/cms/specializations/${spec.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: spec.name,
                  slug: spec.slug.trim() || generateSlug(spec.name),
                }),
              });
            } else {
              // Create new
              await fetch("/api/cms/specializations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  programId,
                  name: spec.name,
                  slug: spec.slug.trim() || generateSlug(spec.name),
                }),
              });
            }
          }

          // Delete removed specializations
          const currentIds = specializations.map((s) => s.id).filter(Boolean);
          for (const id of existingIds) {
            if (!currentIds.includes(id)) {
              await fetch(`/api/cms/specializations/${id}`, {
                method: "DELETE",
              });
            }
          }
        } else {
          // Delete all specializations if hasSpecialization is false
          for (const spec of programSpecializations) {
            await fetch(`/api/cms/specializations/${spec.id}`, {
              method: "DELETE",
            });
          }
        }

        setDialogOpen(false);
        setEditing(null);
        setFormData({
          universityId: universityIdFilter || "",
          name: "",
          slug: "",
          hasSpecialization: false,
          semesterCount: "8",
        });
        setSpecializations([]);
        setProgramSpecializations([]);
        fetchPrograms();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save program");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const addSpecialization = () => {
    setSpecializations([...specializations, { name: "", slug: "" }]);
  };

  const removeSpecialization = (index: number) => {
    setSpecializations(specializations.filter((_, i) => i !== index));
  };

  const updateSpecialization = (
    index: number,
    field: "name" | "slug",
    value: string
  ) => {
    const updated = [...specializations];
    updated[index] = { ...updated[index], [field]: value };
    setSpecializations(updated);
  };

  const fetchSpecializations = async (programId: string) => {
    try {
      const res = await fetch(
        `/api/cms/specializations?programId=${programId}`
      );
      if (res.ok) {
        const data = await res.json();
        setProgramSpecializations(data);
        setSpecializations(
          data.map((s: Specialization) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch specializations:", error);
    }
  };

  const handleEdit = async (program: Program) => {
    setEditing(program);
    setFormData({
      universityId: program.universityId,
      name: program.name,
      slug: program.slug,
      hasSpecialization: program.hasSpecialization,
      semesterCount: String(program.semesterCount || 8),
    });
    if (program.hasSpecialization) {
      await fetchSpecializations(program.id);
    } else {
      setSpecializations([]);
      setProgramSpecializations([]);
    }
    setDialogOpen(true);
  };

  const handleDelete = async (program: Program) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    try {
      const res = await fetch(`/api/cms/programs/${program.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchPrograms();
      } else {
        alert("Failed to delete program");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "slug", header: "Slug" },
    {
      key: "universityId",
      header: "University",
      render: (value: string) => {
        const university = universities.find((u) => u.id === value);
        return university?.name || value;
      },
    },
    {
      key: "hasSpecialization",
      header: "Has Specialization",
      render: (value: boolean) => (value ? "Yes" : "No"),
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Programs</h1>
          <p className="text-muted-foreground">
            {universityIdFilter
              ? `Programs for ${
                  universities.find((u) => u.id === universityIdFilter)?.name ||
                  "selected university"
                }`
              : "Manage academic programs"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Program
        </Button>
      </div>

      <DataTable
        data={programs}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={(program) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(`/dashboard/subjects?programId=${program.id}`)
            }
            title="View Subjects"
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
                {editing ? "Edit Program" : "Add Program"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update program information"
                  : "Add a new program to the system"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="universityId">University</Label>
                <select
                  id="universityId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.universityId}
                  onChange={(e) =>
                    setFormData({ ...formData, universityId: e.target.value })
                  }
                  required
                >
                  <option value="">Select a university</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>
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
                <Label htmlFor="semesterCount">Number of Semesters</Label>
                <Input
                  id="semesterCount"
                  type="number"
                  min="1"
                  value={formData.semesterCount}
                  onChange={(e) =>
                    setFormData({ ...formData, semesterCount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasSpecialization"
                  checked={formData.hasSpecialization}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({
                      ...formData,
                      hasSpecialization: checked,
                    });
                    if (!checked) {
                      setSpecializations([]);
                    } else if (specializations.length === 0) {
                      setSpecializations([{ name: "", slug: "" }]);
                    }
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="hasSpecialization">Has Specialization</Label>
              </div>
              {formData.hasSpecialization && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Specializations</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSpecialization}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Specialization
                    </Button>
                  </div>
                  {specializations.map((spec, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end"
                    >
                      <div className="grid gap-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={spec.name}
                          onChange={(e) =>
                            updateSpecialization(index, "name", e.target.value)
                          }
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">Slug</Label>
                        <Input
                          value={spec.slug}
                          onChange={(e) =>
                            updateSpecialization(index, "slug", e.target.value)
                          }
                          placeholder="Auto-generated"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpecialization(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditing(null);
                  setFormData({
                    universityId: universityIdFilter || "",
                    name: "",
                    slug: "",
                    hasSpecialization: false,
                    semesterCount: "8",
                  });
                  setSpecializations([]);
                  setProgramSpecializations([]);
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
