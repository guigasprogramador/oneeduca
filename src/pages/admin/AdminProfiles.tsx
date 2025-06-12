
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Profile, User } from "@/types";
import { profileService, userService } from "@/services/api";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Edit, Trash } from "lucide-react";

interface ProfileFormData {
  userId: string;
  fullName: string;
  bio?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  website?: string;
}

const defaultFormData: ProfileFormData = {
  userId: "",
  fullName: "",
  bio: "",
  jobTitle: "",
  company: "",
  location: "",
  website: "",
};

const AdminProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(defaultFormData);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesData, usersData] = await Promise.all([
        profileService.getProfiles(),
        userService.getUsers(),
      ]);
      setProfiles(profilesData as Profile[]);
      setUsers(usersData as User[]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId);
    setFormData(prev => ({
      ...prev,
      userId,
      fullName: selectedUser ? selectedUser.name : prev.fullName,
    }));
  };

  const handleEditProfile = (profile: Profile) => {
    setFormData({
      userId: profile.userId,
      fullName: profile.fullName,
      bio: profile.bio || "",
      jobTitle: profile.jobTitle || "",
      company: profile.company || "",
      location: profile.location || "",
      website: profile.website || "",
    });
    setEditingProfileId(profile.id);
    setIsDialogOpen(true);
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (confirm("Tem certeza de que deseja excluir este perfil?")) {
      try {
        await profileService.deleteProfile(profileId);
        toast.success("Perfil excluído com sucesso");
        fetchData();
      } catch (error) {
        console.error("Error deleting profile:", error);
        toast.error("Erro ao excluir perfil");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProfileId) {
        await profileService.updateProfile(editingProfileId, formData);
        toast.success("Perfil atualizado com sucesso");
      } else {
        await profileService.createProfile(formData);
        toast.success("Perfil criado com sucesso");
      }
      
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      setEditingProfileId(null);
      fetchData();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erro ao salvar perfil");
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingProfileId(null);
  };

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  const getUsersWithoutProfile = () => {
    return users.filter(
      user => !profiles.some(profile => profile.userId === user.id)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Perfis</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingProfileId ? "Editar Perfil" : "Criar Novo Perfil"}
              </DialogTitle>
              <DialogDescription>
                {editingProfileId
                  ? "Atualize as informações do perfil abaixo."
                  : "Preencha as informações do novo perfil abaixo."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingProfileId && (
                <div className="space-y-2">
                  <Label htmlFor="userId">Usuário</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={handleUserChange}
                    required
                  >
                    <SelectTrigger id="userId">
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUsersWithoutProfile().map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Uma breve biografia"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Cargo</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder="Seu cargo atual"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Ex: São Paulo, Brasil"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://seusite.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingProfileId ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <p>Carregando perfis...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Nenhum perfil encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((profile) => {
                    const user = users.find(u => u.id === profile.userId);
                    return (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{getInitials(profile.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{profile.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                {user?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{profile.jobTitle || "—"}</TableCell>
                        <TableCell>{profile.company || "—"}</TableCell>
                        <TableCell>{profile.location || "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditProfile(profile)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteProfile(profile.id)}>
                                <Trash className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminProfiles;
