import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface ModuleFormProps {
  formData: {
    title: string;
    description: string;
    order: number;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingModuleId: string | null;
}

export default function ModuleForm({
  formData,
  handleInputChange,
  handleSubmit,
  isSubmitting,
  editingModuleId,
}: ModuleFormProps) {
  const [isValid, setIsValid] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsValid(Boolean(formData.title?.trim()));
  }, [formData.title]);

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedFields({
      title: true,
      description: true,
      order: true
    });

    if (!isValid) return;
    handleSubmit(e);
  };

  return (
    <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-xl sm:text-2xl">
          {editingModuleId ? "Editar Módulo" : "Novo Módulo"}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title" className="text-sm font-medium flex items-center">
              Título <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              onBlur={() => handleBlur('title')}
              placeholder="Digite o título do módulo"
              className={touchedFields.title && !formData.title.trim() ? 'border-red-500' : ''}
            />
            {touchedFields.title && !formData.title.trim() && (
              <p className="text-red-500 text-sm">Título é obrigatório</p>
            )}
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              onBlur={() => handleBlur('description')}
              placeholder="Digite a descrição do módulo"
              rows={3}
              className="min-h-[80px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order" className="text-sm font-medium">Ordem</Label>
            <Input
              id="order"
              name="order"
              type="number"
              min="0"
              value={formData.order}
              onChange={handleInputChange}
              onBlur={() => handleBlur('order')}
              placeholder="Digite a ordem do módulo"
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
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? (
              "Salvando..."
            ) : (
              editingModuleId ? "Atualizar Módulo" : "Criar Módulo"
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}