import { Outlet } from "react-router-dom";
import { ProfessorNavbar } from "./ProfessorNavbar";
import { ProfessorSidebar } from "./ProfessorSidebar";

const ProfessorLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <ProfessorNavbar />
      <div className="flex">
        <ProfessorSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProfessorLayout;