import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Course } from "@/types";
import { MoreHorizontal, Edit, Trash, BookOpen } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CoursesTableProps {
  courses: Course[];
  isLoading: boolean;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  viewMode?: "table" | "grid";
}

const CoursesTable: React.FC<CoursesTableProps> = ({
  courses,
  isLoading,
  onEditCourse,
  onDeleteCourse,
  viewMode = "table",
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p>Carregando cursos...</p>
      </div>
    );
  }

  if (viewMode === "table") {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Instrutor</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead className="text-right">Alunos</TableHead>
              <TableHead className="text-right">Módulos</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhum curso encontrado
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{course.instructor}</TableCell>
                  <TableCell>{course.duration}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{course.enrolledCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{course.moduleCount || course.modules.length || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditCourse(course)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteCourse(course.id)}>
                          <Trash className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/admin/modules?courseId=${course.id}`)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Gerenciar Módulos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.length === 0 ? (
        <div className="col-span-full text-center py-8">
          <p className="text-muted-foreground">Nenhum curso encontrado</p>
        </div>
      ) : (
        courses.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <Badge variant="outline">{course.duration}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Instrutor: {course.instructor}</p>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Alunos:</span>
                    <Badge variant="outline">{course.enrolledCount}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Módulos:</span>
                    <Badge variant="outline">{course.moduleCount || course.modules.length || 0}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex flex-wrap justify-start gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditCourse(course)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDeleteCourse(course.id)}
              >
                <Trash className="h-4 w-4 mr-2" />
                Excluir
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/admin/modules?courseId=${course.id}`)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Módulos
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
};

export default CoursesTable;
