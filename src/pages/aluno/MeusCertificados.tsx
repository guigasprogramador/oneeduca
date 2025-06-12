import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { certificateService } from "@/services";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Certificate } from "@/types";
import { toast } from "sonner";
import { Award, Download, Eye, Search, Share2, QrCode } from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MeusCertificados = () => {
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
        } catch (serviceError: any) {
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

  const handleDownload = async (cert: Certificate) => {
    try {
      // Criar um PDF com jsPDF
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
      
      // Gerar QR Code para verificação
      const verificationUrl = `${window.location.origin}/certificates/${cert.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { width: 100 });
      
      // Adicionar QR Code ao PDF
      doc.addImage(qrCodeDataUrl, 'PNG', 80, 120, 50, 50);
      
      // Adicionar texto de verificação
      doc.setFontSize(10);
      doc.text('Escaneie o QR Code para verificar a autenticidade deste certificado', 105, 180, { align: 'center' });
      
      // Adicionar ID do certificado para verificação
      doc.setFontSize(8);
      doc.text(`ID do Certificado: ${cert.id}`, 105, 190, { align: 'center' });
      
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

  const handleShare = async (cert: Certificate) => {
    try {
      const verificationUrl = `${window.location.origin}/certificates/${cert.id}`;
      
      // Verificar se a API de compartilhamento está disponível
      if (navigator.share) {
        await navigator.share({
          title: `Certificado de ${cert.courseName}`,
          text: `Certificado de conclusão do curso ${cert.courseName} por ${cert.userName}`,
          url: verificationUrl,
        });
        toast.success('Certificado compartilhado com sucesso!');
      } else {
        // Fallback para copiar o link
        navigator.clipboard.writeText(verificationUrl);
        toast.success('Link do certificado copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar certificado:', error);
      toast.error('Erro ao compartilhar certificado');
    }
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
        <Tabs defaultValue="grid" className="w-full">
          <div className="flex justify-end mb-4">
            <TabsList>
              <TabsTrigger value="grid">Grade</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="grid" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCertificates.map((cert) => (
                <Card key={cert.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg">{cert.courseName}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Aluno:</span> {cert.userName}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Emitido em:</span> {new Date(cert.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => viewCertificate(cert.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleShare(cert)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(cert)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="list" className="mt-0">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Data de Emissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.courseName}</TableCell>
                      <TableCell>{new Date(cert.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewCertificate(cert.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare(cert)}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartilhar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(cert)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MeusCertificados;