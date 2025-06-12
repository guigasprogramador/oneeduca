
import { Course, Module } from "@/types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LessonFiltersProps {
  courses: Course[];
  filteredModules: Module[];
  selectedCourseId: string;
  selectedModuleId: string;
  onCourseSelect: (courseId: string) => void;
  onModuleSelect: (moduleId: string) => void;
}

const LessonFilters = ({
  courses,
  filteredModules,
  selectedCourseId,
  selectedModuleId,
  onCourseSelect,
  onModuleSelect
}: LessonFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="filterCourse">Filtrar por Curso</Label>
        <Select value={selectedCourseId} onValueChange={onCourseSelect}>
          <SelectTrigger id="filterCourse">
            <SelectValue placeholder="Selecione um curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cursos</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="filterModule">Filtrar por Módulo</Label>
        <Select 
          value={selectedModuleId} 
          onValueChange={onModuleSelect}
          disabled={!selectedCourseId}
        >
          <SelectTrigger id="filterModule">
            <SelectValue placeholder={selectedCourseId ? "Selecione um módulo" : "Selecione um curso primeiro"} />
          </SelectTrigger>
          <SelectContent>
            {filteredModules.map((module) => (
              <SelectItem key={module.id} value={module.id}>
                {module.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LessonFilters;
