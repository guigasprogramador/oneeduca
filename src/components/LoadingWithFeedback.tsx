import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingWithFeedbackProps {
  message?: string;
  longLoadingThreshold?: number; // tempo em ms para considerar carregamento longo
}

const LoadingWithFeedback: React.FC<LoadingWithFeedbackProps> = ({
  message = 'Carregando...',
  longLoadingThreshold = 3000 // Reduzido para 3 segundos para mostrar feedback mais rapidamente
}) => {
  const [isLongLoading, setIsLongLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Verificar se o carregamento está demorando mais que o threshold
    const timer = setTimeout(() => {
      setIsLongLoading(true);
    }, longLoadingThreshold);

    // Atualizar o tempo de carregamento a cada segundo
    const intervalTimer = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(intervalTimer);
    };
  }, [longLoadingThreshold, startTime]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-lg">{message}</p>
      </div>

      {isLongLoading && (
        <div className="text-sm text-muted-foreground max-w-md text-center space-y-2">
          <p>Carregando dados... ({loadingTime}s)</p>
          
          {loadingTime > 5 && (
            <div className="space-y-2">
              <p>
                Estamos otimizando os dados para melhorar sua experiência:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Carregando conteúdo do curso</li>
                <li>Organizando módulos e aulas</li>
                <li>Preparando recursos de aprendizado</li>
              </ul>
              <p>Quase pronto! Isso deve levar apenas mais alguns instantes.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingWithFeedback;
