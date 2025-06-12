import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CourseFormProps {
  formData: {
    title: string;
    description: string;
    instructor: string;
    duration: string;
    thumbnail: string;
  };
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingCourseId: string | null;
}

const CourseForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  isSubmitting,
  editingCourseId,
}: CourseFormProps) => {
  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>
          {editingCourseId ? "Editar Curso" : "Criar Novo Curso"}
        </DialogTitle>
        <DialogDescription>
          {editingCourseId
            ? "Atualize as informações do curso abaixo."
            : "Preencha as informações do novo curso abaixo."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="required">Título</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (horas)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="Ex: 40"
                onKeyPress={(e) => {
                  // Permitir apenas números
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor" className="required">Instrutor</Label>
            <Input
              id="instructor"
              name="instructor"
              value={formData.instructor}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">URL da Imagem</Label>
            <Input
              id="thumbnail"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleInputChange}
              placeholder="/placeholder.svg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : editingCourseId ? "Atualizar" : "Criar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default CourseForm;
