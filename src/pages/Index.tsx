import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleAccessPlatformClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with logo and login button */}
      <header className="bg-blue-600 dark:bg-gray-900 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="OneEduca Logo" className="h-8 w-8" />
            <div className="text-white dark:text-gray-100 text-2xl font-bold">OneEduca</div>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Alternar tema"
              className="text-blue-600 dark:text-yellow-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
            </Button>
            <Button
              variant="outline"
              className="bg-white text-blue-600 dark:bg-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700"
              onClick={handleLoginClick}
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow bg-blue-600 dark:bg-gray-900 flex items-center">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-8 px-4 md:py-16 md:px-8">
          {/* Left side - Text content */}
          <div className="text-white dark:text-gray-100 flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-5xl font-bold mb-4 leading-tight">
              Plataforma Educacional<br />
              Completa para o Futuro
            </h1>
            <p className="text-base xs:text-lg sm:text-xl mb-8 max-w-md md:max-w-none">
              Ambiente virtual de aprendizagem com trilhas personalizadas,
              conteúdo interativo e certificações oficiais.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-blue-600 dark:bg-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-700 w-full max-w-xs md:max-w-none"
              onClick={handleAccessPlatformClick}
            >
              Acessar Plataforma
            </Button>
          </div>

          {/* Right side - Image (visível apenas em telas md+) */}
          <div className="hidden md:flex justify-center items-center">
            <div className="bg-orange-100 dark:bg-gray-800 rounded-lg p-4 md:p-6 relative overflow-hidden w-full max-w-md">
              <div className="bg-blue-800 dark:bg-gray-700 rounded-lg p-4 md:p-6 text-white absolute top-4 right-4 z-10 shadow-lg">
                <div className="text-center text-xs md:text-base">
                  <p>estudantes</p>
                  <p>aprendendo</p>
                  <p>online</p>
                </div>
              </div>
              <div className="flex justify-around items-center mt-20 md:mt-24">
                <div className="relative z-0">
                  <div className="w-20 h-20 md:w-32 md:h-32 bg-orange-300 dark:bg-gray-600 rounded-full overflow-hidden flex items-center justify-center">
                    {/* Placeholder for student image */}
                    <span className="text-3xl md:text-5xl text-white">👩🏾‍💻</span>
                  </div>
                </div>
                <div className="relative z-0">
                  <div className="w-20 h-20 md:w-32 md:h-32 bg-orange-300 dark:bg-gray-600 rounded-full overflow-hidden flex items-center justify-center">
                    {/* Placeholder for instructor image */}
                    <span className="text-3xl md:text-5xl text-white">🎧</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
