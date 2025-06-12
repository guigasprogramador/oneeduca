
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";
import UsersTable from "@/components/admin/users/UsersTable";
import UserForm from "@/components/admin/users/UserForm";

const AdminUsers = () => {
  const {
    users,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    formData,
    editingUserId,
    handleEditUser,
    handleDeleteUser,
    handleSubmit,
    resetForm,
    openNewUserDialog,
  } = useUserManagement();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={openNewUserDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <UserForm 
            initialData={formData} 
            isEditing={!!editingUserId} 
            onSubmit={async (data) => {
              const success = await handleSubmit(data);
              if (success) {
                setIsDialogOpen(false);
              }
            }}
          />
        </Dialog>
      </div>

      <Card>
        <UsersTable 
          users={users}
          isLoading={isLoading}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
        />
      </Card>
    </div>
  );
};

export default AdminUsers;
