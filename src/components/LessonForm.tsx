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
import { useState, useEffect } from "react";

interface LessonFormData {
  title: string;
  description: string;
  content: string;
  duration: string;
  videoUrl: string;
  order: number;
}

interface LessonFormProps {
  formData: LessonFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingLessonId: string | null;
}

const LessonForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  isSubmitting,
  editingLessonId,
}: LessonFormProps) => {
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(Boolean(formData.title?.trim()));
  }, [formData.title]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    handleSubmit(e);
  };

  return (
    <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl sm:text-2xl">
            {editingLessonId ? "Editar Aula" : "Criar Nova Aula"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {editingLessonId
              ? "Atualize as informações da aula abaixo."
              : "Preencha as informações da nova aula abaixo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium flex items-center">
                Título <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Digite o título da aula"
                required
                minLength={3}
                maxLength={100}
                className={!formData.title?.trim() ? "border-red-500" : ""}
              />
              {!formData.title?.trim() && (
                <p className="text-xs text-red-500">Título é obrigatório</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="order" className="text-sm font-medium">Ordem</Label>
              <Input
                id="order"
                name="order"
                type="number"
                value={formData.order}
                onChange={handleInputChange}
                min={0}
                step={1}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">Duração</Label>
              <Input
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="Ex: 45 minutos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl" className="text-sm font-medium">URL do Vídeo</Label>
              <Input
                id="videoUrl"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                placeholder="URL do vídeo da aula"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Digite uma descrição para a aula"
              rows={3}
              className="min-h-[80px] resize-y"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">Conteúdo</Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Conteúdo da aula em markdown"
              rows={8}
              className="min-h-[200px] resize-y"
              maxLength={10000}
            />
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button 
            type="button" 
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => (document.querySelector('[data-dialog-close]') as HTMLButtonElement)?.click()}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !isValid}
            className="w-full sm:w-auto"
          >
            {isSubmitting 
              ? "Salvando..." 
              : editingLessonId 
                ? "Atualizar" 
                : "Criar"
            }
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default LessonForm;