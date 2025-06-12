
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/types";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

interface UserFormData {
  name: string;
  email: string;
  role: "admin" | "student";
  password?: string;
}

interface UserFormProps {
  initialData: UserFormData;
  isEditing: boolean;
  onSubmit: (formData: UserFormData) => Promise<void>;
}

const UserForm = ({ initialData, isEditing, onSubmit }: UserFormProps) => {
  const [formData, setFormData] = useState<UserFormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [generatePassword, setGeneratePassword] = useState(true);

  useEffect(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Limpar erro quando o campo é editado
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRoleChange = (value: "admin" | "student") => {
    setFormData((prev) => ({ ...prev, role: value }));
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleGeneratePassword = () => {
    setGeneratePassword(!generatePassword);
    if (generatePassword) {
      // Se desativar a geração automática, limpar o campo de senha
      setFormData(prev => ({ ...prev, password: '' }));
    } else {
      // Se ativar a geração automática, gerar uma senha forte
      const generatedPassword = generateStrongPassword();
      setFormData(prev => ({ ...prev, password: generatedPassword }));
    }
  };
  
  const generateStrongPassword = () => {
    const length = 10;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!isEditing && !generatePassword && (!formData.password || formData.password.length < 6)) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    // Se estiver usando senha gerada automaticamente, gerar uma nova
    if (!isEditing && generatePassword) {
      const generatedPassword = generateStrongPassword();
      setFormData(prev => ({ ...prev, password: generatedPassword }));
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Editar Usuário" : "Criar Novo Usuário"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Atualize as informações do usuário abaixo."
            : "Preencha as informações do novo usuário abaixo."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Nome completo"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <div className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.name}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="email@exemplo.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <div className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.email}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Função</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleRoleChange(value as "admin" | "student")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="student">Aluno</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!isEditing && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="generatePassword" 
                checked={generatePassword}
                onCheckedChange={() => toggleGeneratePassword()}
              />
              <Label htmlFor="generatePassword" className="cursor-pointer">
                Gerar senha automaticamente
              </Label>
            </div>
            
            {!generatePassword ? (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password || ""}
                    onChange={handleInputChange}
                    placeholder="Digite uma senha forte"
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Uma senha segura será gerada automaticamente e mostrada após a criação do usuário.
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? "Processando..." 
              : isEditing 
                ? "Atualizar" 
                : "Criar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default UserForm;
