import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { certificateService } from "@/services";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Certificate } from "@/types";
import { toast } from "sonner";
import { Award, Download, Eye, Search } from "lucide-react";
import jsPDF from "jspdf";

const Certificates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) {
        console.log('Nenhum usuário logado');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Iniciando busca de certificados para usuário:', user.id);
        
        // Adicionando uma proteção para garantir que user.id é válido
        if (!user.id || typeof user.id !== 'string') {
          console.error('ID de usuário inválido:', user.id);
          toast.error('ID de usuário inválido');
          setLoading(false);
          return;
        }
        
        // Buscar certificados do usuário atual com tratamento de erro aprimorado
        try {
          const data = await certificateService.getCertificates(user.id);
          console.log('Certificados recebidos:', data);
          setCertificates(data || []);
        } catch (serviceError) {
          console.error('Erro no serviço de certificados:', serviceError);
          // Tentar recuperar de um erro no serviço
          setCertificates([]);
          toast.error(`Erro no serviço de certificados: ${serviceError.message}`);
        }
      } catch (error) {
        console.error('Erro ao buscar certificados:', error);
        toast.error('Erro ao carregar seus certificados');
        // Garantir que certificados é pelo menos um array vazio
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificates();
  }, [user]);

  // Filtrar certificados com base na busca
  const filteredCertificates = certificates.filter(cert => 
    searchTerm === '' || cert.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (cert: Certificate) => {
    try {
      // Criar um PDF simples com jsPDF
      const doc = new jsPDF();
      
      // Adicionar um título
      doc.setFontSize(20);
      doc.text('Certificado de Conclusão', 105, 20, { align: 'center' });
      
      // Adicionar uma linha decorativa
      doc.setDrawColor(0, 0, 0);
      doc.line(50, 25, 160, 25);
      
      // Adicionar informações do certificado
      doc.setFontSize(16);
      doc.text('Este certificado é concedido a:', 105, 40, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(cert.userName, 105, 50, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('por concluir com sucesso o curso:', 105, 65, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(cert.courseName, 105, 75, { align: 'center' });
      
      // Adicionar data de emissão
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Emitido em: ${new Date(cert.issueDate).toLocaleDateString('pt-BR')}`, 105, 95, { align: 'center' });
      
      // Adicionar ID do certificado para verificação
      doc.setFontSize(8);
      doc.text(`ID do Certificado: ${cert.id}`, 105, 120, { align: 'center' });
      
      // Salvar o PDF
      doc.save(`certificado-${cert.courseName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      
      toast.success('Certificado baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o PDF do certificado');
    }
  };

  const viewCertificate = (certificateId: string) => {
    navigate(`/aluno/certificado/${certificateId}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Meus Certificados</h1>
        
        <div className="w-full md:w-64">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por curso..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <p>Carregando seus certificados...</p>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Award className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold mt-2">
              {certificates.length === 0 
                ? "Você ainda não possui certificados" 
                : "Nenhum certificado corresponde à sua busca"}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mt-1">
              {certificates.length === 0 
                ? "Complete seus cursos para receber certificados de conclusão." 
                : "Tente buscar por outro termo ou limpe a busca para ver todos os seus certificados."}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchTerm('')}
              >
                Limpar busca
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCertificates.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-lg font-semibold">{cert.courseName}</h2>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2 flex-grow">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Aluno:</span> {cert.userName}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Emitido em:</span> {new Date(cert.issueDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="mt-6 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => viewCertificate(cert.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleDownload(cert)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
