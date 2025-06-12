import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { certificateManager } from "@/services/certificateManager";
import { toast } from "sonner";
import { Award } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CertificateHandlerProps {
  userId: string;
  courseId: string;
  courseName: string;
  onCertificateGenerated?: (certificateId: string) => void;
}

/**
 * Componente para gerenciar a geração e exibição de certificados
 */
export const CertificateHandler = ({ userId, courseId, courseName, onCertificateGenerated }: CertificateHandlerProps) => {
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verificar certificado quando o componente for montado
  useEffect(() => {
    if (userId && courseId) {
      checkCertificate();
    }
  }, [userId, courseId]);

  // Verificar se o usuário tem certificado para este curso
  const checkCertificate = async () => {
    try {
      setLoading(true);
      const result = await certificateManager.checkAndGenerateCertificate(userId, courseId);
      
      if (result.success && result.certificateId) {
        setCertificateId(result.certificateId);
        
        if (result.isNew) {
          // Se é um certificado novo, mostrar o modal de parabéns
          setShowCongratulations(true);
        }
        
        // Notificar o componente pai se necessário
        if (onCertificateGenerated) {
          onCertificateGenerated(result.certificateId);
        }
      }
    } catch (error) {
      console.error("[CERTIFICADO] Erro ao verificar certificado:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navegar para a página do certificado
  const viewCertificate = () => {
    if (certificateId) {
      navigate(`/aluno/certificado/${certificateId}`);
    } else {
      toast.error("Certificado não encontrado");
    }
  };

  // Fechar o diálogo de parabéns
  const handleCloseCongratulations = () => {
    setShowCongratulations(false);
  };

  // Renderização do diálogo de congratulações quando o curso é concluído
  return (
    <Dialog open={showCongratulations} onOpenChange={setShowCongratulations}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            <span>Parabéns! Você concluiu o curso</span>
          </DialogTitle>
          <DialogDescription>
            Você completou todas as aulas de <strong>{courseName}</strong> e está 
            elegível para receber seu certificado de conclusão.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          <Award className="h-24 w-24 text-yellow-500 mb-4" />
          <p className="text-center mb-4">
            Seu certificado já está disponível e você pode acessá-lo a 
            qualquer momento na seção de certificados ou clicando no botão abaixo.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={handleCloseCongratulations}>
            Continuar explorando o curso
          </Button>
          <Button 
            onClick={viewCertificate} 
            className="gap-2"
          >
            <Award className="h-4 w-4" /> 
            Ver meu certificado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateHandler;
