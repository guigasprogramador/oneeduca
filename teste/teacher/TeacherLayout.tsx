import React from "react";
import { Outlet } from "react-router-dom";
import { TeacherNavbar } from "./TeacherNavbar";
import { TeacherSidebar } from "./TeacherSidebar";

const TeacherLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <TeacherNavbar />
      <div className="flex">
        <TeacherSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;