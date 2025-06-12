import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Certificate as CertificateType } from "@/types";
import { certificateService } from "@/services";
import { toast } from "sonner";
import { Download, Printer, ChevronLeft, Award, Share2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Certificate = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [certificate, setCertificate] = useState<CertificateType | null>(null);
  const [loading, setLoading] = useState(true);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!certificateId) {
        toast.error("ID do certificado não fornecido");
        navigate("/aluno/certificados");
        return;
      }

      try {
        setLoading(true);
        // Buscar o certificado pelo ID
        const response = await certificateService.getCertificateById(certificateId);
        
        if (response) {
          setCertificate(response);
          console.log("Certificado carregado:", response);
        } else {
          toast.error("Certificado não encontrado");
          navigate("/aluno/certificados");
        }
      } catch (error) {
        console.error("Erro ao buscar certificado:", error);
        toast.error("Erro ao carregar o certificado");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId, navigate]);

  const downloadPDF = async () => {
    if (!certificateRef.current || !certificate) return;

    toast.info("Preparando o download do certificado...");
    
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
      pdf.save(`certificado-${certificate.userName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      
      toast.success("Certificado baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o PDF do certificado");
    }
  };

  const printCertificate = () => {
    window.print();
  };

  const shareCertificate = async () => {
    if (!certificateId) return;
    
    try {
      const shareUrl = `${window.location.origin}/aluno/certificado/${certificateId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Meu Certificado',
          text: 'Confira meu certificado de conclusão de curso!',
          url: shareUrl
        });
        toast.success('Certificado compartilhado com sucesso!');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link do certificado copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Não foi possível compartilhar o certificado');
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg">Carregando certificado...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-8 max-w-lg w-full text-center">
          <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Certificado não encontrado</h2>
          <p className="text-muted-foreground mb-6">O certificado solicitado não existe ou foi removido.</p>
          <Button onClick={goBack}>Voltar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container py-6">
        <Button variant="outline" size="sm" onClick={goBack} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Certificado de Conclusão</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={printCertificate}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={shareCertificate}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>

        {/* Área do certificado - Modificada para usar o HTML gerado do certificado */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none">
          {certificate.certificateHtml ? (
            <div 
              ref={certificateRef} 
              className="certificate-container"
              dangerouslySetInnerHTML={{ __html: certificate.certificateHtml }}
            />
          ) : (
            <div ref={certificateRef} className="p-8 md:p-12 certificate-legacy">
              <div className="border-8 border-double border-primary/20 p-6 md:p-10 text-center">
                <div className="mb-6">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">Certificado de Conclusão</h1>
                  <div className="w-40 h-1 bg-primary mx-auto"></div>
                </div>
                
                <div className="my-8 space-y-4">
                  <p className="text-lg text-muted-foreground">Este certificado é concedido a</p>
                  <h3 className="text-3xl sm:text-4xl font-serif font-bold">{certificate.userName}</h3>
                  <p className="text-lg">por concluir com sucesso o curso</p>
                  <h4 className="text-2xl sm:text-3xl font-medium">{certificate.courseName}</h4>
                  
                  {certificate.courseHours && (
                    <p className="text-lg">com carga horária de <strong>{certificate.courseHours} horas</strong></p>
                  )}
                </div>
                
                <div className="mb-6">
                  <p className="font-medium">
                    Emitido em: {new Date(certificate.issueDate).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    ID do certificado para verificação: {certificate.id}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
                  <div className="text-center">
                    <div className="w-40 h-px bg-gray-400 mx-auto mb-2"></div>
                    <p>Diretor</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 h-px bg-gray-400 mx-auto mb-2"></div>
                    <p>Coordenador</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-sm text-muted-foreground">
          <p>Este certificado foi emitido para {certificate.userName} em {new Date(certificate.issueDate).toLocaleDateString('pt-BR')}.</p>
          <p>Para verificar a autenticidade deste certificado, entre em contato com o suporte.</p>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
