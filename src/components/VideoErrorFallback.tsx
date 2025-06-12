import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface VideoErrorFallbackProps {
  error: string;
  onRetry?: () => void;
}

const VideoErrorFallback: React.FC<VideoErrorFallbackProps> = ({
  error,
  onRetry
}) => {
  return (
    <Card className="p-4 bg-red-50 border-red-200">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="rounded-full bg-red-100 p-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        
        <h3 className="text-lg font-medium">Não foi possível carregar o vídeo</h3>
        
        <p className="text-sm text-muted-foreground">
          {error || 'Ocorreu um erro ao tentar carregar o vídeo. Verifique sua conexão com a internet e tente novamente.'}
        </p>
        
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="mt-2 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        )}
      </div>
    </Card>
  );
};

export default VideoErrorFallback;
