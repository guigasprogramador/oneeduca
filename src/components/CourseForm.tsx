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
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
    <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-xl sm:text-2xl">
          {editingCourseId ? "Editar Curso" : "Criar Novo Curso"}
        </DialogTitle>
        <DialogDescription className="text-sm sm:text-base">
          {editingCourseId
            ? "Atualize as informações do curso abaixo."
            : "Preencha as informações do novo curso abaixo."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
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
                required
                placeholder="Digite o título do curso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">Duração</Label>
              <Input
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="Ex: 8 semanas"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructor" className="text-sm font-medium flex items-center">
                Instrutor <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="instructor"
                name="instructor"
                value={formData.instructor}
                onChange={handleInputChange}
                required
                placeholder="Nome do instrutor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-sm font-medium">URL da Imagem</Label>
              <Input
                id="thumbnail"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleInputChange}
                placeholder="/placeholder.svg"
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
              rows={5}
              className="min-h-[120px] resize-y"
              placeholder="Digite uma descrição detalhada do curso"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
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
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : editingCourseId ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default CourseForm;