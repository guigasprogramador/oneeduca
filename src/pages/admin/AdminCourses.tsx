import React, { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, Table as TableIcon } from "lucide-react";
import CourseForm from "@/components/admin/courses/CourseForm";
import CoursesTable from "@/components/admin/courses/CoursesTable";
import { useCourseManagement } from "@/hooks/useCourseManagement";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminCourses = () => {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  const {
    courses,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    formData,
    editingCourseId,
    isSubmitting,
    handleInputChange,
    handleEditCourse,
    handleDeleteCourse,
    handleSubmit,
    resetForm,
  } = useCourseManagement();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Cursos</h1>
        <div className="flex items-center gap-4">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "table" | "grid")}>
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="table" className="flex items-center justify-center gap-2">
                <TableIcon className="h-4 w-4" />
                <span>Tabela</span>
              </TabsTrigger>
              <TabsTrigger value="grid" className="flex items-center justify-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span>Grade</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Curso
              </Button>
            </DialogTrigger>
            <CourseForm
              formData={formData}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              editingCourseId={editingCourseId}
            />
          </Dialog>
        </div>
      </div>

      <Card>
        <CoursesTable
          courses={courses}
          isLoading={isLoading}
          onEditCourse={handleEditCourse}
          onDeleteCourse={handleDeleteCourse}
          viewMode={viewMode}
        />
      </Card>
    </div>
  );
};

export default AdminCourses;
