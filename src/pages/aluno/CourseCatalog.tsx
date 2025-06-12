import { useEffect, useState } from "react";
import { courseService } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const data = await courseService.getCourses();
      setCourses(data);
      setFiltered(data);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(courses);
    } else {
      setFiltered(
        courses.filter((c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, courses]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Catálogo de Cursos</h1>
      <Input
        placeholder="Buscar cursos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      {loading ? (
        <p>Carregando cursos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <Card key={course.id} className="p-4 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
                <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                <p className="text-xs mb-1">Carga horária: {course.duration || "-"}</p>
                <p className="text-xs mb-1">Instrutor: {course.instructor || "-"}</p>
                {/* Conteúdo programático pode ser detalhado em outra página */}
              </div>
              <Button className="mt-4" onClick={() => window.location.href = `/aluno/curso/${course.id}`}>Ver detalhes</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;
