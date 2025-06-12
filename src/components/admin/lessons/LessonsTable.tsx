
import { Lesson } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { MoreHorizontal, Edit, Trash, Video } from "lucide-react";

interface LessonsTableProps {
  lessons: Lesson[];
  isLoading: boolean;
  selectedModuleId: string;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
}

const LessonsTable = ({
  lessons,
  isLoading,
  selectedModuleId,
  onEditLesson,
  onDeleteLesson
}: LessonsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p>Carregando aulas...</p>
      </div>
    );
  }

  if (!selectedModuleId) {
    return (
      <div className="flex items-center justify-center p-6">
        <p>Selecione um módulo para ver as aulas</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ordem</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Vídeo</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Este módulo ainda não possui aulas
              </TableCell>
            </TableRow>
          ) : (
            lessons.map((lesson) => (
              <TableRow key={lesson.id}>
                <TableCell>{lesson.order}</TableCell>
                <TableCell className="font-medium">{lesson.title}</TableCell>
                <TableCell>{lesson.duration}</TableCell>
                <TableCell>
                  {lesson.videoUrl ? (
                    <Badge variant="outline">
                      <Video className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Não disponível
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditLesson(lesson)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDeleteLesson(lesson.id)}>
                        <Trash className="h-4 w-4 mr-2" />
                        Excluir
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
};

export default LessonsTable;
