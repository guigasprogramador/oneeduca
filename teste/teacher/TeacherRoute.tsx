import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingWithFeedback from "./LoadingWithFeedback";
import TeacherLayout from "@/components/TeacherLayout";

const TeacherRoute = () => {
  const { user, isLoading, isTeacher } = useAuth();

  if (isLoading) {
    return <LoadingWithFeedback message="Verificando permissões..." />;
  }

  if (!user) {
    console.log('TeacherRoute: Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  console.log('TeacherRoute: Usuário logado:', user);
  console.log('TeacherRoute: Role do usuário:', user.role);
  console.log('TeacherRoute: isTeacher():', isTeacher());

  if (!isTeacher()) {
    console.log('TeacherRoute: Usuário não é professor, redirecionando para dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('TeacherRoute: Acesso autorizado para professor');
  return (
    <TeacherLayout>
      <Outlet />
    </TeacherLayout>
  );
};

export default TeacherRoute;