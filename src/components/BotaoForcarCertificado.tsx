import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Award, Loader2 } from "lucide-react";
import { certificadoService } from "@/services/certificadoService";
import { toast } from "sonner";

interface BotaoForcarCertificadoProps {
  userId: string;
  courseId: string;
  courseName: string;
  className?: string;
}

/**
 * Componente de botão para forçar a geração de certificados
 * Ignora a verificação de progresso e gera o certificado diretamente
 */
export function BotaoForcarCertificado({ userId, courseId, courseName, className }: BotaoForcarCertificadoProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Função para forçar a geração do certificado
  const forcarGeracaoCertificado = async () => {
    if (!userId || !courseId) {
      toast.error("Dados incompletos para gerar certificado");
      return;
    }

    try {
      setLoading(true);
      console.log(`[BOTAO_FORCAR] Iniciando geração forçada de certificado para usuário ${userId} no curso ${courseId}`);
      
      // Chamar a função que força a geração do certificado
      const certificadoId = await certificadoService.forcarGeracaoCertificado(userId, courseId);
      
      if (certificadoId) {
        console.log(`[BOTAO_FORCAR] Certificado gerado com sucesso: ${certificadoId}`);
        toast.success("Certificado gerado com sucesso!");
        
        // Navegar para a página do certificado
        setTimeout(() => {
          navigate(`/aluno/certificado/${certificadoId}`);
        }, 1000);
      } else {
        console.error("[BOTAO_FORCAR] Falha ao gerar certificado");
        toast.error("Não foi possível gerar o certificado. Tente novamente mais tarde.");
      }
    } catch (error) {
      console.error("[BOTAO_FORCAR] Erro ao forçar geração de certificado:", error);
      toast.error("Erro ao gerar certificado. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={forcarGeracaoCertificado}
      className={`gap-2 ${className || "bg-green-600 hover:bg-green-700"}`}
      disabled={loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando certificado...
        </span>
      ) : (
        <>
          <Award className="h-4 w-4" />
          Gerar certificado
        </>
      )}
    </Button>
  );
}

export default BotaoForcarCertificado;
