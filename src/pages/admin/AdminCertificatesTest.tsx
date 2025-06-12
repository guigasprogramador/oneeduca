import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, Edit, Trash } from "lucide-react";

// Componente simplificado para diagnóstico
const AdminCertificatesTest = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  
  // Dados de teste
  const mockCourses = [
    { id: "course1", title: "Curso de Teste 1" },
    { id: "course2", title: "Curso de Teste 2" },
    { id: "course3", title: "Curso de Teste 3" },
  ];
  
  const mockCertificates = [
    { 
      id: "cert1", 
      userName: "João Silva", 
      courseName: "Curso de Teste 1",
      issueDate: "2023-01-01T12:00:00Z"
    },
    { 
      id: "cert2", 
      userName: "Maria Santos", 
      courseName: "Curso de Teste 2",
      issueDate: "2023-02-15T12:00:00Z"
    },
  ];
  
  // Alunos mockados por curso
  const mockEnrolledUsers = {
    "course1": [
      {
        userId: "user1",
        userName: "João Silva",
        progress: 85,
        hasCertificate: true,
        isEligible: true
      },
      {
        userId: "user2",
        userName: "Maria Santos",
        progress: 60,
        hasCertificate: false,
        isEligible: false
      }
    ],
    "course2": [
      {
        userId: "user3",
        userName: "Pedro Rocha",
        progress: 100,
        hasCertificate: false,
        isEligible: true
      }
    ],
    "course3": [
      {
        userId: "user4",
        userName: "Ana Beatriz",
        progress: 75,
        hasCertificate: false,
        isEligible: false
      },
      {
        userId: "user5",
        userName: "Carlos Eduardo",
        progress: 90,
        hasCertificate: false,
        isEligible: true
      }
    ]
  };
  
  // Obter alunos do curso selecionado
  const getEnrolledUsers = (courseId) => {
    return mockEnrolledUsers[courseId] || [];
  };
  
  // Handlers
  const handleCourseChange = (courseId) => {
    console.log(`Curso selecionado: ${courseId}`);
    setSelectedCourseId(courseId);
    setSelectedUserId("");
  };
  
  const handleCreateCertificate = () => {
    if (!selectedCourseId || !selectedUserId) {
      alert("Selecione um curso e um aluno!");
      return;
    }
    
    alert(`Certificado criado para o curso ${selectedCourseId} e usuário ${selectedUserId}`);
    setIsDialogOpen(false);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Certificados (Página de Teste)</h1>
      
      <div className="flex justify-between mb-4">
        <div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Certificado
          </Button>
        </div>
      </div>
      
      <Card className="mb-4 p-4">
        <h2 className="text-xl font-semibold mb-2">Certificados Existentes</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Data de Emissão</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCertificates.map((cert) => (
              <TableRow key={cert.id}>
                <TableCell>{cert.userName}</TableCell>
                <TableCell>{cert.courseName}</TableCell>
                <TableCell>{new Date(cert.issueDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      {/* Dialog para criar certificado */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Certificado</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseId" className="text-right">
                Curso
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedCourseId}
                  onValueChange={handleCourseChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {mockCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedCourseId && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="userId" className="text-right">
                  Aluno
                </Label>
                <div className="col-span-3">
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {getEnrolledUsers(selectedCourseId).length > 0 ? (
                          getEnrolledUsers(selectedCourseId).map((student) => {
                            let statusText = `(${student.progress}% completo)`;
                            if (student.hasCertificate) {
                              statusText += ' [Já possui certificado]';
                            } else if (student.isEligible) {
                              statusText += ' [Elegível]';
                            }
                            
                            return (
                              <SelectItem
                                key={student.userId}
                                value={student.userId}
                                disabled={student.hasCertificate}
                              >
                                {student.userName} {statusText}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="" disabled>
                            Nenhum aluno matriculado neste curso
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCertificate}>
              Criar Certificado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCertificatesTest;
