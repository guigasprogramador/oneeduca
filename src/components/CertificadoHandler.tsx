import { useEffect, useState } from "react";
import { certificadoService } from "@/services/certificadoService";
import { toast } from "sonner";

interface CertificadoHandlerProps {
  userId: string;
  courseId: string;
  onCertificateGenerated?: (certificateId: string) => void;
}

/**
 * Componente para gerenciar a verificação e geração de certificados
 * Deve ser usado dentro do CoursePlayer quando o progresso do curso atingir 100%
 */
export function CertificadoHandler({ userId, courseId, onCertificateGenerated }: CertificadoHandlerProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Verificar e gerar certificado quando o componente for montado
  useEffect(() => {
    if (userId && courseId) {
      verificarEGerarCertificado();
    }
  }, [userId, courseId]);

  // Função principal para verificar e gerar certificado
  const verificarEGerarCertificado = async () => {
    try {
      setIsProcessing(true);
      console.log(`[CERTIFICADO] Verificando certificado para usuário ${userId} no curso ${courseId}`);
      
      // 1. Verificar se já existe certificado
      const certificadoExistente = await certificadoService.verificarCertificado(userId, courseId);
      if (certificadoExistente) {
        console.log(`[CERTIFICADO] Certificado já existe: ${certificadoExistente.id}`);
        if (onCertificateGenerated) {
          onCertificateGenerated(certificadoExistente.id);
        }
        return;
      }
      
      // 2. Verificar se o curso foi concluído
      const cursoConcluido = await certificadoService.verificarConclusaoCurso(userId, courseId);
      if (!cursoConcluido) {
        console.log('[CERTIFICADO] Curso não concluído, não é possível gerar certificado');
        return;
      }
      
      // 3. Atualizar progresso para 100% se necessário
      await certificadoService.atualizarProgressoCurso(userId, courseId);
      
      // 4. Gerar certificado
      console.log('[CERTIFICADO] Gerando novo certificado...');
      const novoCertificadoId = await certificadoService.gerarCertificado(userId, courseId);
      
      if (novoCertificadoId) {
        console.log(`[CERTIFICADO] Certificado gerado com sucesso: ${novoCertificadoId}`);
        toast.success('Certificado gerado com sucesso!');
        
        if (onCertificateGenerated) {
          onCertificateGenerated(novoCertificadoId);
        }
      }
    } catch (error) {
      console.error('[CERTIFICADO] Erro ao verificar/gerar certificado:', error);
      toast.error('Erro ao verificar/gerar certificado. Tente novamente mais tarde.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Este componente não renderiza nada visualmente
  return null;
}

export default CertificadoHandler;
