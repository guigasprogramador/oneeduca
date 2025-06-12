import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Award, Loader2 } from "lucide-react";
import { useCertificado } from "@/hooks/useCertificado";
import { toast } from "sonner";
import CertificadoModal from "./CertificadoModal";
import { certificadoService } from "@/services/certificadoService";

interface BotaoCertificadoProps {
  userId: string;
  courseId: string;
  courseName: string;
  progress: number;
}

/**
 * Componente de botão para verificar e gerar certificados
 * Deve ser usado quando o progresso do curso atingir 100%
 */
export function BotaoCertificado({ userId, courseId, courseName, progress }: BotaoCertificadoProps) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { 
    certificadoId, 
    isElegivel, 
    loading, 
    verificarEGerarCertificado 
  } = useCertificado();

  // Verificar certificado quando o componente for montado
  useEffect(() => {
    if (userId && courseId) {
      console.log(`[BOTAO_CERTIFICADO] Verificando certificado para usuário ${userId} no curso ${courseId}`);
      console.log(`[BOTAO_CERTIFICADO] Progresso atual: ${progress}%`);
      verificarCertificado();
    }
    
    return () => {
      // Cleanup
    };
  }, [userId, courseId, progress]);

  // Verificar se o certificado existe ou pode ser gerado
  const verificarCertificado = async () => {
    if (userId && courseId) {
      try {
        console.log(`[BOTAO_CERTIFICADO] Verificando certificado para ${userId} no curso ${courseId}`);
        
        // Primeiro verificar se o usuário já tem certificado
        const certificadoExistente = await certificadoService.verificarCertificado(userId, courseId);
        if (certificadoExistente) {
          console.log(`[BOTAO_CERTIFICADO] Certificado existente encontrado: ${certificadoExistente.id}`);
          // Não mostrar modal se já tem certificado
          return;
        }
        
        // Se não tem certificado, verificar se o curso foi concluído
        if (progress >= 100) {
          console.log(`[BOTAO_CERTIFICADO] Curso concluído, verificando elegibilidade para certificado`);
          const result = await verificarEGerarCertificado(userId, courseId);
          
          // Se o certificado foi gerado com sucesso, mostrar o modal
          if (result.success && result.certificateId) {
            console.log(`[BOTAO_CERTIFICADO] Certificado gerado com sucesso: ${result.certificateId}`);
            setShowModal(true);
          } else {
            console.log(`[BOTAO_CERTIFICADO] Não foi possível gerar o certificado`);
          }
        } else {
          console.log(`[BOTAO_CERTIFICADO] Progresso insuficiente: ${progress}%`);
        }
      } catch (error) {
        console.error(`[BOTAO_CERTIFICADO] Erro ao verificar certificado:`, error);
        toast.error("Erro ao verificar certificado. Tente novamente mais tarde.");
      }
    }
  };

  // Navegar para a página do certificado
  const verCertificado = async () => {
    try {
      if (certificadoId) {
        console.log(`[BOTAO_CERTIFICADO] Navegando para certificado ${certificadoId}`);
        navigate(`/aluno/certificado/${certificadoId}`);
        return;
      }
      
      // Se não tiver certificadoId no estado, verificar novamente
      console.log(`[BOTAO_CERTIFICADO] Verificando certificado antes de navegar`);
      const certificadoExistente = await certificadoService.verificarCertificado(userId, courseId);
      
      if (certificadoExistente) {
        console.log(`[BOTAO_CERTIFICADO] Certificado encontrado: ${certificadoExistente.id}`);
        navigate(`/aluno/certificado/${certificadoExistente.id}`);
      } else {
        console.log(`[BOTAO_CERTIFICADO] Nenhum certificado encontrado, tentando gerar`);
        // Tentar gerar certificado
        const result = await verificarEGerarCertificado(userId, courseId);
        
        if (result.success && result.certificateId) {
          console.log(`[BOTAO_CERTIFICADO] Certificado gerado com sucesso: ${result.certificateId}`);
          navigate(`/aluno/certificado/${result.certificateId}`);
        } else {
          console.error(`[BOTAO_CERTIFICADO] Não foi possível gerar o certificado`);
          toast.error("Não foi possível gerar o certificado. Tente novamente mais tarde.");
        }
      }
    } catch (error) {
      console.error(`[BOTAO_CERTIFICADO] Erro ao navegar para certificado:`, error);
      toast.error("Erro ao acessar certificado. Tente novamente mais tarde.");
    }
  };

  // Se o progresso não for 100%, não mostrar o botão
  if (progress < 100) {
    return null;
  }

  return (
    <>
      <Button
        onClick={isElegivel ? verCertificado : verificarCertificado}
        className="gap-2 bg-green-600 hover:bg-green-700"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isElegivel ? "Carregando certificado..." : "Verificando..."}
          </span>
        ) : (
          <>
            <Award className="h-4 w-4" />
            {isElegivel ? "Ver meu certificado" : "Gerar certificado"}
          </>
        )}
      </Button>

      {/* Modal de certificado */}
      <CertificadoModal
        userId={userId}
        courseId={courseId}
        courseName={courseName}
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  );
}

export default BotaoCertificado;
