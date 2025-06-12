
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Module, Course } from "@/types";
import { DialogFooter } from "@/components/ui/dialog";

interface LessonFormData {
  title: string;
  description: string;
  moduleId: string;
  order: number;
  duration: string;
  videoUrl?: string;
  content?: string;
}

interface LessonFormProps {
  formData: LessonFormData;
  setFormData: (data: LessonFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  modules: Module[];
  courses: Course[];
  selectedCourseId: string;
}

const LessonForm = ({ 
  formData,
  setFormData,
  onSubmit,
  modules,
  courses,
  selectedCourseId
}: LessonFormProps) => {
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const filteredModules = selectedCourseId 
    ? modules.filter(module => module.courseId === selectedCourseId) 
    : modules;
    
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="moduleId">Módulo</Label>
        <Select
          value={formData.moduleId}
          onValueChange={(value) => 
            setFormData({ ...formData, moduleId: value })
          }
          required
        >
          <SelectTrigger id="moduleId">
            <SelectValue placeholder="Selecione um módulo" />
          </SelectTrigger>
          <SelectContent>
            {(selectedCourseId ? filteredModules : modules).map((module) => {
              const course = courses.find(c => c.id === module.courseId);
              return (
                <SelectItem key={module.id} value={module.id}>
                  {module.title} {course ? `(${course.title})` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Título da aula"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Descreva a aula"
          rows={3}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="order">Ordem</Label>
          <Input
            id="order"
            name="order"
            type="number"
            min="1"
            value={formData.order}
            onChange={handleInputChange}
            placeholder="Ordem de exibição"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duração</Label>
          <Input
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="Ex: 20 minutos"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="videoUrl">URL do Vídeo</Label>
        <Input
          id="videoUrl"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={handleInputChange}
          placeholder="URL do vídeo da aula (opcional)"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Conteúdo da Aula</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          placeholder="Conteúdo detalhado da aula"
          rows={6}
        />
      </div>
      <DialogFooter>
        <Button type="submit">
          {formData.moduleId ? "Atualizar" : "Criar"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default LessonForm;
