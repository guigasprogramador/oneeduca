import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { certificadoService } from "@/services/certificadoService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { BotaoForcarCertificado } from "./BotaoForcarCertificado";

interface CertificadoModalProps {
  userId: string;
  courseId: string;
  courseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal para parabenizar o aluno pela conclusão do curso e oferecer o certificado
 */
export function CertificadoModal({ userId, courseId, courseName, open, onOpenChange }: CertificadoModalProps) {
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verificar certificado quando o modal for aberto
  useEffect(() => {
    if (open && userId && courseId) {
      verificarCertificado();
    }
  }, [open, userId, courseId]);

  // Verificar se o usuário já tem certificado ou gerar um novo
  const verificarCertificado = async () => {
    try {
      setLoading(true);
      console.log(`[CERTIFICADO_MODAL] Verificando certificado para usuário ${userId} no curso ${courseId}`);
      
      // Verificar se já existe um certificado
      const certificadoExistente = await certificadoService.verificarCertificado(userId, courseId);
      
      if (certificadoExistente) {
        console.log(`[CERTIFICADO_MODAL] Certificado existente encontrado: ${certificadoExistente.id}`);
        setCertificateId(certificadoExistente.id);
        return;
      }
      
      console.log(`[CERTIFICADO_MODAL] Nenhum certificado existente, verificando conclusão do curso`);
      
      // Verificar se o curso foi concluído
      const cursoConcluido = await certificadoService.verificarConclusaoCurso(userId, courseId);
      console.log(`[CERTIFICADO_MODAL] Curso concluído? ${cursoConcluido}`);
      
      if (!cursoConcluido) {
        console.log(`[CERTIFICADO_MODAL] Curso não concluído, forçando atualização do progresso`);
        // Forçar atualização do progresso para 100%
        try {
          await certificadoService.atualizarProgressoCurso(userId, courseId);
          console.log(`[CERTIFICADO_MODAL] Progresso atualizado com sucesso`);
        } catch (progressError) {
          console.error(`[CERTIFICADO_MODAL] Erro ao atualizar progresso:`, progressError);
        }
      }
      
      // Tentar gerar certificado independentemente do status de conclusão
      // O serviço de certificado fará a verificação novamente
      console.log(`[CERTIFICADO_MODAL] Gerando certificado`);
      const novoCertificadoId = await certificadoService.gerarCertificado(userId, courseId);
      
      if (novoCertificadoId) {
        console.log(`[CERTIFICADO_MODAL] Certificado gerado com sucesso: ${novoCertificadoId}`);
        setCertificateId(novoCertificadoId);
        toast.success("Certificado gerado com sucesso!");
      } else {
        console.error(`[CERTIFICADO_MODAL] Falha ao gerar certificado`);
        toast.error("Não foi possível gerar o certificado. Tente novamente mais tarde.");
      }
    } catch (error) {
      console.error("[CERTIFICADO_MODAL] Erro ao verificar/gerar certificado:", error);
      toast.error("Erro ao processar certificado. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Navegar para a página do certificado
  const verCertificado = () => {
    if (certificateId) {
      navigate(`/aluno/certificado/${certificateId}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {certificateId 
              ? "Seu certificado já está disponível e você pode acessá-lo a qualquer momento."
              : "Estamos gerando seu certificado, isso pode levar alguns instantes."}
          </p>
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processando seu certificado...</span>
            </div>
          )}
        </div>
        {!certificateId && !loading && (
          <div className="flex flex-col space-y-2 p-2 bg-amber-50 rounded-md border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-medium">Problemas para gerar seu certificado?</p>
            </div>
            <p className="text-xs text-amber-600 pl-7">
              Se você concluiu o curso mas está tendo dificuldades para gerar o certificado,
              você pode tentar forçar a geração do certificado usando o botão abaixo.
            </p>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {certificateId ? "Fechar" : "Continuar explorando o curso"}
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {!certificateId && !loading && (
              <>
                <Button 
                  onClick={verificarCertificado} 
                  className="gap-2"
                  disabled={loading}
                >
                  <Award className="h-4 w-4" /> 
                  Gerar meu certificado
                </Button>
                
                <BotaoForcarCertificado
                  userId={userId}
                  courseId={courseId}
                  courseName={courseName}
                  className="gap-2 bg-amber-600 hover:bg-amber-700"
                />
              </>
            )}
            
            {certificateId && (
              <Button 
                onClick={verCertificado} 
                className="gap-2"
                disabled={loading}
              >
                <Award className="h-4 w-4" /> 
                Ver meu certificado
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CertificadoModal;
