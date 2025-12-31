"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, FileText, Users } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  const stats = [
    {
      title: "Universities",
      value: "0",
      icon: GraduationCap,
      description: "Total universities",
    },
    {
      title: "Programs",
      value: "0",
      icon: BookOpen,
      description: "Total programs",
    },
    {
      title: "Subjects",
      value: "0",
      icon: FileText,
      description: "Total subjects",
    },
    {
      title: "Users",
      value: "1",
      icon: Users,
      description: "Total users",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || session?.user?.email}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

