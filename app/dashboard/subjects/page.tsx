"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Eye } from "lucide-react";
import { generateSlug } from "@/lib/utils";

interface Subject {
  id: string;
  programId: string;
  specializationId: string | null;
  semester: number;
  code: string;
  name: string;
  slug: string;
  theoryCredits: number;
  description: string | null;
  syllabus: any;
  practicalCredits: number | null;
  practicalTopics: any;
  createdAt: string;
}

interface Program {
  id: string;
  name: string;
  hasSpecialization: boolean;
  semesterCount: number;
}

interface Specialization {
  id: string;
  name: string;
  slug: string;
}

export default function SubjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programIdFilter = searchParams.get("programId");

  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [program, setProgram] = React.useState<Program | null>(null);
  const [specializations, setSpecializations] = React.useState<Specialization[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Subject | null>(null);
  const [formData, setFormData] = React.useState({
    programId: programIdFilter || "",
    specializationId: "",
    semester: "",
    code: "",
    name: "",
    slug: "",
    theoryCredits: "",
    description: "",
    syllabus: "",
    practicalCredits: "",
    practicalTopics: "",
  });

  React.useEffect(() => {
    if (!programIdFilter) {
      router.push("/dashboard/programs");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programIdFilter]);

  const loadData = async () => {
    if (!programIdFilter) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchProgram(),
        fetchSpecializations(),
        fetchSubjects(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgram = async () => {
    if (!programIdFilter) return;
    try {
      const res = await fetch(`/api/cms/programs/${programIdFilter}`);
      if (res.ok) {
        const data = await res.json();
        setProgram(data);
        setFormData((prev) => ({ ...prev, programId: data.id }));
      }
    } catch (error) {
      console.error("Failed to fetch program:", error);
    }
  };

  const fetchSpecializations = async () => {
    if (!programIdFilter) return;
    try {
      const res = await fetch(`/api/cms/specializations?programId=${programIdFilter}`);
      if (res.ok) {
        const data = await res.json();
        setSpecializations(data);
      }
    } catch (error) {
      console.error("Failed to fetch specializations:", error);
    }
  };

  const fetchSubjects = async () => {
    if (!programIdFilter) return;
    try {
      const res = await fetch(`/api/cms/subjects?programId=${programIdFilter}`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing
        ? `/api/cms/subjects/${editing.id}`
        : "/api/cms/subjects";
      const method = editing ? "PUT" : "POST";

      // Auto-generate slug from name if slug is empty
      const payload = {
        ...formData,
        slug: formData.slug.trim() || generateSlug(formData.name),
        theoryCredits: parseInt(formData.theoryCredits),
        practicalCredits: formData.practicalCredits
          ? parseInt(formData.practicalCredits)
          : null,
        specializationId: formData.specializationId || null,
        syllabus: formData.syllabus ? JSON.parse(formData.syllabus) : null,
        practicalTopics: formData.practicalTopics
          ? JSON.parse(formData.practicalTopics)
          : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        setEditing(null);
        setFormData({
          programId: programIdFilter || "",
          specializationId: "",
          semester: "",
          code: "",
          name: "",
          slug: "",
          theoryCredits: "",
          description: "",
          syllabus: "",
          practicalCredits: "",
          practicalTopics: "",
        });
        fetchSubjects();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save subject");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditing(subject);
    setFormData({
      programId: subject.programId,
      specializationId: subject.specializationId || "",
      semester: String(subject.semester),
      code: subject.code,
      name: subject.name,
      slug: subject.slug,
      theoryCredits: String(subject.theoryCredits),
      description: subject.description || "",
      syllabus: subject.syllabus ? JSON.stringify(subject.syllabus, null, 2) : "",
      practicalCredits: subject.practicalCredits
        ? String(subject.practicalCredits)
        : "",
      practicalTopics: subject.practicalTopics
        ? JSON.stringify(subject.practicalTopics, null, 2)
        : "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
      const res = await fetch(`/api/cms/subjects/${subject.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSubjects();
      } else {
        alert("Failed to delete subject");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const columns = [
    { key: "code", header: "Code" },
    { key: "name", header: "Name" },
    { key: "slug", header: "Slug" },
    { key: "semester", header: "Semester" },
    {
      key: "specializationId",
      header: "Specialization",
      render: (value: string | null) => {
        if (!value) return "-";
        const spec = specializations.find((s) => s.id === value);
        return spec?.name || "-";
      },
    },
    { key: "theoryCredits", header: "Theory Credits" },
    {
      key: "practicalCredits",
      header: "Practical Credits",
      render: (value: number | null) => value || "-",
    },
  ];

  if (!programIdFilter) {
    return <div>Redirecting...</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!program) {
    return <div>Program not found</div>;
  }

  // Generate semester options
  const semesterOptions = Array.from(
    { length: program.semesterCount },
    (_, i) => i + 1
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subjects</h1>
          <p className="text-muted-foreground">
            Subjects for {program.name}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      <DataTable
        data={subjects}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={(subject) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/study-resources?subjectId=${subject.id}`)}
            title="View Resources"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Subject" : "Add Subject"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update subject information"
                  : "Add a new subject to the system"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="programId">Program</Label>
                <Input
                  id="programId"
                  value={program.name}
                  disabled
                  className="bg-muted"
                />
              </div>
              {program.hasSpecialization && (
                <div className="grid gap-2">
                  <Label htmlFor="specializationId">Specialization</Label>
                  <select
                    id="specializationId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.specializationId}
                    onChange={(e) =>
                      setFormData({ ...formData, specializationId: e.target.value })
                    }
                  >
                    <option value="">None</option>
                    {specializations.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="semester">Semester</Label>
                <select
                  id="semester"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                  required
                >
                  <option value="">Select a semester</option>
                  {semesterOptions.map((num) => (
                    <option key={num} value={num}>
                      Semester {num}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="theoryCredits">Theory Credits</Label>
                  <Input
                    id="theoryCredits"
                    type="number"
                    value={formData.theoryCredits}
                    onChange={(e) =>
                      setFormData({ ...formData, theoryCredits: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="practicalCredits">Practical Credits</Label>
                  <Input
                    id="practicalCredits"
                    type="number"
                    value={formData.practicalCredits}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        practicalCredits: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="syllabus">Syllabus (JSON)</Label>
                <Textarea
                  id="syllabus"
                  value={formData.syllabus}
                  onChange={(e) =>
                    setFormData({ ...formData, syllabus: e.target.value })
                  }
                  className="font-mono text-xs"
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="practicalTopics">Practical Topics (JSON)</Label>
                <Textarea
                  id="practicalTopics"
                  value={formData.practicalTopics}
                  onChange={(e) =>
                    setFormData({ ...formData, practicalTopics: e.target.value })
                  }
                  className="font-mono text-xs"
                  rows={4}
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
                    programId: programIdFilter || "",
                    specializationId: "",
                    semester: "",
                    code: "",
                    name: "",
                    slug: "",
                    theoryCredits: "",
                    description: "",
                    syllabus: "",
                    practicalCredits: "",
                    practicalTopics: "",
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
