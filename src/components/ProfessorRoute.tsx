import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingWithFeedback from "./LoadingWithFeedback";
import ProfessorLayout from "./ProfessorLayout";

const ProfessorRoute = () => {
  const { user, isLoading, isProfessor } = useAuth();

  if (isLoading) {
    return <LoadingWithFeedback message="Verificando permissões..." />;
  }

  if (!user) {
    console.log('ProfessorRoute: Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProfessorRoute: Usuário logado:', user);
  console.log('ProfessorRoute: Role do usuário:', user.role);
  console.log('ProfessorRoute: isProfessor():', isProfessor());

  if (!isProfessor()) {
    console.log('ProfessorRoute: Usuário não é professor, redirecionando para dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('ProfessorRoute: Acesso autorizado para professor');
  return (
    <ProfessorLayout>
      <Outlet />
    </ProfessorLayout>
  );
};

export default ProfessorRoute;