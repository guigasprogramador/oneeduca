// Script para configurar corretamente a implantação na Vercel
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtém o __dirname no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garantir que o arquivo vercel.json existe
if (!fs.existsSync(path.join(__dirname, 'vercel.json'))) {
  console.log('Criando arquivo vercel.json...');
  const vercelConfig = {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "s-maxage=1, stale-while-revalidate=59"
          }
        ]
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'vercel.json'),
    JSON.stringify(vercelConfig, null, 2)
  );
}

// Garantir que o arquivo _redirects existe na pasta public
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  console.log('Criando pasta public...');
  fs.mkdirSync(publicDir);
}

const redirectsPath = path.join(publicDir, '_redirects');
if (!fs.existsSync(redirectsPath)) {
  console.log('Criando arquivo _redirects...');
  fs.writeFileSync(redirectsPath, '/* /index.html 200');
}

console.log('Configuração de implantação concluída com sucesso!');
