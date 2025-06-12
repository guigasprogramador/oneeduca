
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { userService } from "@/services/api";
import { useNavigate } from "react-router-dom";

const AdminMakeUserAdmin = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, informe um endereço de email");
      return;
    }

    setIsLoading(true);
    try {
      await userService.updateUserRoleByEmail(email, "admin");
      toast.success(`Usuário ${email} definido como administrador com sucesso!`);
      setEmail("");
      // Redirect to the users page after successful operation
      navigate("/admin/users");
    } catch (error: any) {
      console.error("Error making user admin:", error);
      toast.error(`Erro ao definir usuário como administrador: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Definir Administrador</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Tornar usuário administrador</CardTitle>
            <CardDescription>
              Digite o email do usuário que você deseja tornar administrador da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do usuário</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processando..." : "Tornar administrador"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminMakeUserAdmin;
