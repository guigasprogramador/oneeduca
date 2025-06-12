import React, { useState, useEffect } from 'react';
import VideoErrorFallback from './VideoErrorFallback';

interface VideoPlayerProps {
  url: string;
  title?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * Componente de player de vídeo que suporta diferentes formatos de URL
 * (YouTube, Vimeo, URLs diretas, etc.)
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title = 'Video Player',
  width = '100%',
  height = 360
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      // Processar a URL do vídeo quando o componente montar ou a URL mudar
      processVideoUrl(url);
    } catch (err) {
      console.error('Erro ao processar URL do vídeo:', err);
      setError('Não foi possível carregar o vídeo. URL inválida.');
    } finally {
      setLoading(false);
    }
  }, [url]);

  const processVideoUrl = (inputUrl: string) => {
    if (!inputUrl) {
      setError('URL do vídeo não fornecida');
      return;
    }
    
    // Limpar a URL (remover espaços, etc.)
    const cleanUrl = inputUrl.trim();
    setVideoUrl(cleanUrl);
  };

  // Tentar novamente carregar o vídeo
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    try {
      processVideoUrl(url);
    } catch (err) {
      console.error('Erro ao processar URL do vídeo durante retry:', err);
      setError('Não foi possível carregar o vídeo. URL inválida.');
    } finally {
      setLoading(false);
    }
  };

  // Função para determinar o tipo de vídeo e retornar o player apropriado
  const renderVideoPlayer = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-full">Carregando vídeo...</div>;
    }
    
    if (error) {
      return <VideoErrorFallback error={error} onRetry={handleRetry} />;
    }
    
    if (!videoUrl) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-md border border-gray-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-600 text-center">
            Esta aula não possui vídeo. Consulte o conteúdo escrito abaixo.
          </p>
        </div>
      );
    }

    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      try {
        // Extrair o ID do vídeo do YouTube
        let videoId = '';
        if (videoUrl.includes('youtube.com/watch')) {
          try {
            const urlParams = new URLSearchParams(new URL(videoUrl).search);
            videoId = urlParams.get('v') || '';
          } catch (e) {
            // Fallback para regex se a URL não puder ser analisada
            const match = videoUrl.match(/[?&]v=([^&]+)/);
            videoId = match ? match[1] : '';
          }
        } else if (videoUrl.includes('youtu.be/')) {
          videoId = videoUrl.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
        } else if (videoUrl.includes('youtube.com/embed/')) {
          videoId = videoUrl.split('youtube.com/embed/')[1]?.split(/[?#]/)[0] || '';
        }

        if (videoId) {
          // Garantir que a URL seja HTTPS e usar o domínio youtube-nocookie.com para evitar problemas de cookies
          // Adicionar parâmetros para melhor compatibilidade
          const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?origin=${encodeURIComponent(window.location.origin)}&enablejsapi=1&rel=0`;
          
          // Remover log desnecessário
          
          return (
            <div className="video-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
              <iframe
                src={embedUrl}
                title={title}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
              />
            </div>
          );
        } else {
          console.error('ID do vídeo do YouTube não encontrado na URL:', videoUrl);
          return <div className="text-red-500">Não foi possível extrair o ID do vídeo do YouTube.</div>;
        }
      } catch (error) {
        console.error('Erro ao processar URL do YouTube:', error, videoUrl);
        return <div className="text-red-500">Erro ao carregar o vídeo do YouTube. URL inválida.</div>;
      }
    }

    // Vimeo
    if (videoUrl.includes('vimeo.com')) {
      try {
        // Extrair o ID do vídeo do Vimeo
        const vimeoId = videoUrl.split('vimeo.com/')[1]?.split(/[?#]/)[0] || '';
        if (vimeoId) {
          console.log('Renderizando vídeo do Vimeo com ID:', vimeoId);
          return (
            <div className="video-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?dnt=1`}
                title={title}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          );
        } else {
          console.error('ID do vídeo do Vimeo não encontrado na URL:', videoUrl);
          return <div className="text-red-500">Não foi possível extrair o ID do vídeo do Vimeo.</div>;
        }
      } catch (error) {
        console.error('Erro ao processar URL do Vimeo:', error, videoUrl);
        return <div className="text-red-500">Erro ao carregar o vídeo do Vimeo. URL inválida.</div>;
      }
    }

    // Para URLs diretas de vídeo (mp4, webm, etc)
    if (videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
      console.log('Renderizando vídeo direto:', videoUrl);
      return (
        <div className="video-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
          <video
            controls
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            title={title}
            preload="metadata"
          >
            <source src={videoUrl} />
            Seu navegador não suporta a tag de vídeo.
          </video>
        </div>
      );
    }

    // Para outros tipos de URLs, usar iframe como fallback
    console.log('Renderizando vídeo genérico com URL:', videoUrl);
    return (
      <div className="video-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
        <iframe
          src={videoUrl}
          title={title}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          frameBorder="0"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
      </div>
    );
  };

  // Adicionar classes de estilo para melhorar a aparência e responsividade
  return (
    <div className="video-player-container w-full rounded-md overflow-hidden bg-black">
      {renderVideoPlayer()}
    </div>
  );
};

export default VideoPlayer;
