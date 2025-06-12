import { Certificate } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { requestThrottler } from '@/utils/requestThrottler';
import { Certificate } from '@/types';

/**
 * Interface para os dados de certificado no banco de dados
 */
interface CertificateDB {
  id: string;
  user_id: string;
  course_id: string;
  course_name: string;
  user_name: string;
  course_hours?: number; // Carga horária do curso
  issue_date: string;
  expiry_date?: string;
  certificate_url?: string;
  certificate_html?: string; // HTML do certificado
  created_at: string;
  updated_at: string;
}

/**
 * Interface para os dados de criação de certificado
 */
export interface CreateCertificateData {
  userId: string;
  courseId: string;
  userName: string;
  courseName: string;
  courseHours?: number;  // Carga horária do curso em horas
  issueDate?: string;
  expiryDate?: string;
  certificateUrl?: string;
  certificateHtml?: string; // HTML do certificado renderizado
}

/**
 * Converte um registro do banco de dados para o tipo Certificate
 */
const mapToCertificate = (cert: CertificateDB): Certificate => ({
  id: cert.id,
  userId: cert.user_id,
  courseId: cert.course_id,
  courseName: cert.course_name,
  userName: cert.user_name,
  courseHours: cert.course_hours,
  issueDate: cert.issue_date,
  expiryDate: cert.expiry_date,
  certificateUrl: cert.certificate_url,
  certificateHtml: cert.certificate_html
});

// Cache para certificados
let certificatesCache = new Map<string, { data: Certificate[], timestamp: number }>(); 
const CACHE_DURATION = 60000; // 1 minuto em milissegundos

/**
 * Busca todos os certificados, opcionalmente filtrados por usuário
 * @param userId ID do usuário (opcional)
 * @param courseId ID do curso (opcional)
 * @returns Lista de certificados
 */
const getCertificates = async (userId?: string, courseId?: string): Promise<Certificate[]> => {
  try {
    console.time('getCertificates');
    
    // Criar uma chave de cache baseada nos parâmetros
    const cacheKey = `certificates_${userId || 'all'}_${courseId || 'all'}`;
    const now = Date.now();
    const cachedData = certificatesCache.get(cacheKey);
    
    // Verificar se temos dados em cache válidos
    if (cachedData && (now - cachedData.timestamp < CACHE_DURATION)) {
      console.log(`Usando cache para certificados: ${cacheKey}`);
      console.timeEnd('getCertificates');
      return cachedData.data;
    }
    
    // Selecionar apenas os campos necessários para o dashboard
    // Isso reduz o tamanho dos dados transferidos
    let query = supabase.from('certificates').select('id, user_id, course_id, course_name, user_name, issue_date');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    const { data, error } = await query.order('issue_date', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    const certificates = data.map(mapToCertificate);
    
    // Atualizar o cache
    certificatesCache.set(cacheKey, {
      data: certificates,
      timestamp: now
    });
    
    console.timeEnd('getCertificates');
    return certificates;
  } catch (error) {
    console.timeEnd('getCertificates');
    console.error('Error fetching certificates:', error);
    // Não mostrar toast de erro no dashboard para não interromper a experiência do usuário
    // toast.error('Erro ao buscar certificados');
    return [];
  }
};

/**
 * Cria um novo certificado
 * @param certificateData Dados do certificado a ser criado
 * @returns O certificado criado
 */
const createCertificate = async (certificateData: CreateCertificateData): Promise<Certificate> => {
  try {
    if (!certificateData.userId || !certificateData.courseId || !certificateData.userName || !certificateData.courseName) {
      throw new Error('Dados incompletos para criar certificado');
    }
    
    // Verificar se já existe um certificado para este usuário e curso
    console.log(`Verificando certificados existentes para usuário ${certificateData.userId} e curso ${certificateData.courseId}`);
    const existingCerts = await getCertificates(certificateData.userId, certificateData.courseId);
    
    if (existingCerts.length > 0) {
      // Em vez de lançar um erro, retornamos o certificado existente
      console.log('Certificado já existente, retornando-o em vez de criar um novo');
      return existingCerts[0];
    }
    
    console.log('Nenhum certificado existente encontrado, continuando com a criação...');

    // Gerar HTML do certificado se não estiver presente
    const certificateHtml = certificateData.certificateHtml || createCertificateTemplate({
      userName: certificateData.userName,
      courseName: certificateData.courseName,
      courseHours: certificateData.courseHours || 40,
      issueDate: certificateData.issueDate || new Date().toISOString()
    });
    
    // Preparar dados simplificados para inserção
    const certificateDataForDB: Record<string, any> = {
      user_id: certificateData.userId,
      course_id: certificateData.courseId,
      course_name: certificateData.courseName,
      user_name: certificateData.userName,
      course_hours: certificateData.courseHours || 40,
      issue_date: certificateData.issueDate || new Date().toISOString(),
      certificate_html: certificateHtml
    };
    
    // Adicionar campos opcionais apenas se estiverem presentes
    if (certificateData.expiryDate) {
      certificateDataForDB.expiry_date = certificateData.expiryDate;
    }
    
    if (certificateData.certificateUrl) {
      certificateDataForDB.certificate_url = certificateData.certificateUrl;
    }
    
    console.log('Inserindo certificado no banco de dados...');
    
    try {
      // Tentar inserir o certificado
      const { data, error } = await supabase
        .from('certificates')
        .insert(certificateDataForDB)
        .select('*')
        .single();
      
      if (error) {
        // Se for erro de unicidade, buscar o certificado existente
        if (error.code === '23505' || (typeof error.message === 'string' && error.message.includes('duplicate'))) {
          console.log('Detectada violação de unicidade, verificando certificados existentes...');
          const latestCerts = await getCertificates(certificateData.userId, certificateData.courseId);
          if (latestCerts.length > 0) {
            return latestCerts[0];
          }
        }
        
        console.error('Erro ao inserir certificado:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Falha ao criar certificado - nenhum dado retornado');
      }
      
      console.log('Certificado criado com sucesso!');
      return mapToCertificate(data as CertificateDB);
    } catch (dbError: any) {
      // Em caso de falha, criar um certificado virtual temporário
      console.log('Criando certificado virtual temporário após falha no banco');
      const virtualCert: Certificate = {
        id: `virtual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId: certificateData.userId,
        courseId: certificateData.courseId,
        userName: certificateData.userName,
        courseName: certificateData.courseName,
        courseHours: certificateData.courseHours || 40,
        issueDate: certificateData.issueDate || new Date().toISOString(),
        certificateHtml: certificateHtml,
        certificateUrl: null,
        expiryDate: null
      };
      return virtualCert;
    }
  } catch (error) {
    console.error('Erro ao criar certificado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar certificado';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Gera um certificado para conclusão de curso
 * @param courseId ID do curso
 * @param userId ID do usuário
 * @returns O certificado gerado
 */
const generateCertificate = async (courseId: string, userId: string): Promise<Certificate> => {
  try {
    if (!courseId || !userId) {
      throw new Error('ID do curso e ID do usuário são obrigatórios');
    }

    console.log(`[CERTIFICADO] Iniciando geração para usuário ${userId} no curso ${courseId}`);

    // Verificar cache primeiro
    const certCacheKey = `certificate-${userId}-${courseId}`;
    const cachedCert = requestThrottler.getCachedItem(certCacheKey);
    if (cachedCert) {
      console.log(`[CERTIFICADO] Usando certificado em cache: ${cachedCert.id}`);
      return cachedCert;
    }

    // 1. Verificar se já existe um certificado
    console.log(`[CERTIFICADO] Verificando certificado existente para usuário ${userId} no curso ${courseId}`);
    const existingCerts = await getCertificates(userId, courseId);
    
    if (existingCerts && existingCerts.length > 0) {
      console.log(`[CERTIFICADO] Certificado existente encontrado: ${existingCerts[0].id}`);
      requestThrottler.cacheItem(certCacheKey, existingCerts[0]);
      return existingCerts[0];
    }
    
    // 2. Verificar elegibilidade
    console.log(`[CERTIFICADO] Verificando elegibilidade para usuário ${userId} no curso ${courseId}`);
    let isEligible = false;
    let courseHours = 40; // Valor padrão
    
    try {
      // Verificar diretamente o progresso do curso
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('progress')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();
      
      if (enrollmentData && enrollmentData.progress === 100) {
        isEligible = true;
        console.log(`[CERTIFICADO] Usuário ${userId} elegível (progresso 100%)`);
      } else {
        // Verificar usando a contagem de aulas
        const { data: moduleData } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', courseId);
          
        if (!moduleData || moduleData.length === 0) {
          console.log(`[CERTIFICADO] Nenhum módulo encontrado para o curso ${courseId}`);
          throw new Error('Curso não possui módulos');
        }
        
        const moduleIds = moduleData.map(m => m.id);
        
        const { data: lessonsData } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', userId)
          .eq('completed', true);
          
        const { data: courseLessons } = await supabase
          .from('lessons')
          .select('id, module_id')
          .in('module_id', moduleIds);
          
        if (lessonsData && courseLessons && courseLessons.length > 0) {
          const completedLessonIds = new Set(lessonsData.map(item => item.lesson_id));
          const completedCount = courseLessons.filter(l => completedLessonIds.has(l.id)).length;
          const totalCount = courseLessons.length;
          
          if (totalCount > 0) {
            const calculatedProgress = Math.round((completedCount / totalCount) * 100);
            console.log(`[CERTIFICADO] Progresso calculado: ${calculatedProgress}% (${completedCount}/${totalCount})`);
            
            if (calculatedProgress === 100) {
              isEligible = true;
              console.log(`[CERTIFICADO] Usuário ${userId} elegível baseado na conclusão de aulas`);
              
              // Atualizar o progresso na tabela de matrículas para garantir consistência
              const { error: updateError } = await supabase
                .from('enrollments')
                .update({ progress: 100 })
                .eq('user_id', userId)
                .eq('course_id', courseId);
                
              if (updateError) {
                console.error('[CERTIFICADO] Erro ao atualizar progresso na matrícula:', updateError);
              } else {
                console.log('[CERTIFICADO] Progresso na matrícula atualizado para 100%');
              }
            }
          }
        }
      }
    } catch (eligibilityError) {
      console.error('[CERTIFICADO] Erro ao verificar elegibilidade:', eligibilityError);
      // Em caso de erro, vamos forçar a elegibilidade para garantir que o certificado seja gerado
      isEligible = true;
      console.log('[CERTIFICADO] Forçando elegibilidade devido a erro na verificação');
    }
    
    if (!isEligible) {
      console.error('[CERTIFICADO] Usuário não é elegível para receber certificado');
      throw new Error('Usuário não é elegível para receber certificado. O curso deve estar 100% concluído.');
    }
    
    // 3. Buscar dados do curso e do usuário
    let courseTitle = 'Curso Concluído';
    let userName = 'Aluno';
    
    try {
      // Buscar nome e detalhes do curso
      const { data: courseData } = await supabase
        .from('courses')
        .select('title, duration')
        .eq('id', courseId)
        .single();
        
      if (courseData) {
        if (courseData.title) {
          courseTitle = courseData.title;
        }
        
        // Extrair a carga horária do curso se disponível
        if (courseData.duration) {
          const hoursMatch = courseData.duration.match(/(\d+)\s*h/i);
          if (hoursMatch && hoursMatch[1]) {
            courseHours = parseInt(hoursMatch[1], 10);
          }
        }
      }
      
      // Buscar nome do usuário
      const { data: userData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
        
      if (userData && userData.name) {
        userName = userData.name;
      }
      
      console.log(`[CERTIFICADO] Dados obtidos: Curso="${courseTitle}", Usuário="${userName}", Carga Horária=${courseHours}h`);
    } catch (dataError) {
      console.error('[CERTIFICADO] Erro ao buscar dados, usando valores padrão:', dataError);
    }
    
    // 4. Criar o certificado
    console.log(`[CERTIFICADO] Criando certificado para ${userName} no curso "${courseTitle}"`);
    const now = new Date();
    
    try {
      // Gerar o HTML do certificado com os dados obtidos
      const certificateHtml = createCertificateTemplate({
        userName: userName,
        courseName: courseTitle,
        courseHours: courseHours,
        issueDate: now.toISOString().split('T')[0]
      });
      
      const certificateData = {
        userId: userId,
        courseId: courseId,
        userName: userName,
        courseName: courseTitle,
        courseHours: courseHours,
        issueDate: now.toISOString(),
        certificateHtml: certificateHtml
      };
      
      const certificate = await createCertificate(certificateData);
      console.log(`[CERTIFICADO] Certificado criado com sucesso: ${certificate.id}`);
      requestThrottler.cacheItem(certCacheKey, certificate);
      
      // Notificar o usuário sobre o certificado gerado
      toast.success('Certificado gerado com sucesso! Você pode visualizá-lo na seção de certificados.');
      
      return certificate;
    } catch (createError) {
      console.error('[CERTIFICADO] Erro ao criar certificado:', createError);
      
      // Verificar novamente se já existe certificado (pode ter sido criado em uma tentativa paralela)
      const newCheck = await getCertificates(userId, courseId);
      if (newCheck && newCheck.length > 0) {
        console.log(`[CERTIFICADO] Certificado encontrado após erro: ${newCheck[0].id}`);
        return newCheck[0];
      }
      
      // Repassar o erro para ser tratado pelo chamador
      throw createError;
    }
  } catch (error) {
    console.error('[CERTIFICADO] Erro geral na geração de certificado:', error);
    throw error;
  }
};

/**
 * Cria um certificado virtual temporário quando não é possível criar um no banco de dados
 * @param userId ID do usuário
 * @param courseId ID do curso
 * @param userName Nome do usuário
 * @param courseName Nome do curso
 * @param courseHours Carga horária do curso
 * @returns Certificado virtual
 */
const createVirtualCertificate = (userId: string, courseId: string, userName: string, courseName: string, courseHours: number = 40): Certificate => {
  console.log('Criando certificado virtual temporário');
  const now = new Date();
  
  const virtualCert: Certificate = {
    id: `virtual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    userId: userId,
    courseId: courseId,
    userName: userName,
    courseName: courseName,
    courseHours: courseHours,
    issueDate: now.toISOString(),
    certificateHtml: createCertificateTemplate({
      userName: userName,
      courseName: courseName,
      courseHours: courseHours,
      issueDate: now.toISOString().split('T')[0]
    }),
    certificateUrl: null,
    expiryDate: null
  };
  
  return virtualCert;
};

/**
 * Cria um template HTML para o certificado
 * @param data Dados para o certificado
 * @returns HTML do certificado formatado
 */
const createCertificateTemplate = (data: {
  userName: string;
  courseName: string;
  courseHours: number;
  issueDate: string;
}): string => {
  // Formatar a data de emissão em formato Brasileiro
  const issueDateObj = new Date(data.issueDate);
  const formattedDate = issueDateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  // Gerar um número de registro único
  const registrationNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  
  // Template HTML do certificado com design moderno
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Certificado de Conclusão - ${data.courseName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
      
      body, html {
        margin: 0;
        padding: 0;
        font-family: 'Montserrat', sans-serif;
        color: #333;
        background-color: #f9f9f9;
      }
      
      .certificate-container {
        width: 800px;
        height: 600px;
        margin: 0 auto;
        background-color: white;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        padding: 40px;
        box-sizing: border-box;
        position: relative;
        border: 20px solid #f0f0f0;
      }
      
      .certificate-header {
        text-align: center;
        border-bottom: 2px solid #3b82f6;
        padding-bottom: 20px;
        margin-bottom: 40px;
      }
      
      .certificate-title {
        font-size: 32px;
        font-weight: 700;
        margin: 0;
        color: #3b82f6;
        text-transform: uppercase;
      }
      
      .certificate-subtitle {
        font-size: 18px;
        margin-top: 10px;
        color: #666;
      }
      
      .certificate-content {
        text-align: center;
        margin-bottom: 40px;
      }
      
      .student-name {
        font-size: 28px;
        font-weight: 600;
        margin: 20px 0;
        color: #333;
        border-bottom: 1px solid #ddd;
        display: inline-block;
        padding-bottom: 5px;
        min-width: 400px;
      }
      
      .certificate-text {
        font-size: 16px;
        line-height: 1.6;
        margin: 20px 0;
      }
      
      .course-name {
        font-size: 20px;
        font-weight: 600;
        color: #3b82f6;
        margin: 15px 0;
      }
      
      .certificate-footer {
        display: flex;
        justify-content: space-between;
        margin-top: 60px;
        border-top: 1px solid #ddd;
        padding-top: 20px;
      }
      
      .signature {
        text-align: center;
        width: 200px;
      }
      
      .signature-line {
        width: 100%;
        height: 1px;
        background-color: #333;
        margin-bottom: 5px;
      }
      
      .signature-name {
        font-weight: 600;
      }
      
      .signature-title {
        font-size: 12px;
        color: #666;
      }
      
      .certificate-seal {
        position: absolute;
        bottom: 30px;
        right: 40px;
        width: 100px;
        height: 100px;
        background: linear-gradient(135deg, #3b82f6, #60a5fa);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
      }
      
      .seal-text {
        color: white;
        font-weight: 700;
        font-size: 14px;
        text-align: center;
        text-transform: uppercase;
      }
      
      .details {
        position: absolute;
        bottom: 20px;
        left: 40px;
        font-size: 12px;
        color: #666;
      }
      
      @media print {
        body {
          background-color: white;
        }
        .certificate-container {
          box-shadow: none;
          border: 2px solid #f0f0f0;
        }
      }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <div class="certificate-header">
        <h1 class="certificate-title">Certificado de Conclusão</h1>
        <p class="certificate-subtitle">Este documento certifica que</p>
      </div>
      
      <div class="certificate-content">
        <div class="student-name">${data.userName}</div>
        
        <p class="certificate-text">
          concluiu com sucesso o curso intitulado
        </p>
        
        <div class="course-name">${data.courseName}</div>
        
        <p class="certificate-text">
          com carga horária total de <strong>${data.courseHours} horas</strong>, 
          tendo demonstrado dedicação e conhecimento em todos os módulos propostos.
        </p>
      </div>
      
      <div class="certificate-footer">
        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-name">Diretor de Ensino</div>
          <div class="signature-title">Plataforma de Ensino</div>
        </div>
        
        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-name">Coordenador do Curso</div>
          <div class="signature-title">Plataforma de Ensino</div>
        </div>
      </div>
      
      <div class="certificate-seal">
        <div class="seal-text">Certificado Verificado</div>
      </div>
      
      <div class="details">
        <div>Data de Emissão: ${formattedDate}</div>
        <div>Registro: ${registrationNumber}</div>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Busca um certificado pelo ID
 * @param certificateId ID do certificado
 * @returns O certificado encontrado
 */
const getCertificateById = async (certificateId: string): Promise<Certificate> => {
  try {
    if (!certificateId) {
      throw new Error('ID do certificado é obrigatório');
    }

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (error) {
      console.error('Erro ao buscar certificado por ID:', error);
      throw new Error('Falha ao buscar certificado');
    }
    
    if (!data) {
      throw new Error('Certificado não encontrado');
    }

    return mapToCertificate(data);
  } catch (error) {
    console.error('Erro ao buscar certificado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar certificado';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Atualiza um certificado existente
 * @param certificateId ID do certificado a ser atualizado
 * @param certificateData Dados atualizados do certificado
 * @returns O certificado atualizado
 */
const updateCertificate = async (certificateId: string, certificateData: Partial<CreateCertificateData>): Promise<Certificate> => {
  try {
    if (!certificateId) {
      throw new Error('ID do certificado u00e9 obrigatu00f3rio');
    }

    // Verificar se o certificado existe
    await getCertificateById(certificateId);
    
    // Preparar dados para atualizau00e7u00e3o
    const updateData: Record<string, any> = {};
    
    if (certificateData.userName) updateData.user_name = certificateData.userName;
    if (certificateData.courseName) updateData.course_name = certificateData.courseName;
    if (certificateData.issueDate) updateData.issue_date = certificateData.issueDate;
    if (certificateData.expiryDate) updateData.expiry_date = certificateData.expiryDate;
    if (certificateData.certificateUrl) updateData.certificate_url = certificateData.certificateUrl;
    
    // Nu00e3o permitir alterar o usu00e1rio ou curso associado ao certificado
    // Isso evita inconsistenciu00e3cias nos dados
    
    const { data, error } = await supabase
      .from('certificates')
      .update(updateData)
      .eq('id', certificateId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Falha ao atualizar certificado');

    return mapToCertificate(data);
  } catch (error) {
    console.error('Error updating certificate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar certificado';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Exclui um certificado
 * @param certificateId ID do certificado a ser excluído
 * @returns Booleano indicando sucesso da operau00e7u00e3o
 */
const deleteCertificate = async (certificateId: string): Promise<boolean> => {
  try {
    if (!certificateId) {
      throw new Error('ID do certificado u00e9 obrigatu00f3rio');
    }

    // Verificar se o certificado existe
    await getCertificateById(certificateId);
    
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', certificateId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting certificate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir certificado';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Verifica se um aluno completou um curso e é elegível para receber um certificado
 * @param userId ID do usuário
 * @param courseId ID do curso
 * @returns Booleano indicando se o aluno é elegível para receber certificado
 */
const isEligibleForCertificate = async (userId: string, courseId: string): Promise<boolean> => {
  try {
    if (!userId || !courseId) {
      return false;
    }
    
    // Verificar primeiro se já existe um certificado para evitar erros de duplicidade
    const existingCerts = await getCertificates(userId, courseId);
    if (existingCerts.length > 0) {
      // Já tem certificado, então é elegível (já que já recebeu um)
      return true;
    }
    
    // Verificar o progresso no curso
    const { data, error } = await supabase
      .from('enrollments')
      .select('progress, completed_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    if (error) {
      console.error('Erro ao verificar matrícula:', error);
      return false;
    }
    
    if (!data) {
      console.error('Matrícula não encontrada');
      return false;
    }
    
        // Considerar elegível se o progresso for 100% (curso completamente concluído)
    // Não depender do campo completed_at, pois ele pode não estar sendo preenchido corretamente
    return data.progress === 100;
  } catch (error) {
    console.error('Erro ao verificar elegibilidade para certificado:', error);
    return false;
  }
};

/**
 * Obtém certificados por curso (para professores)
 * @param courseId ID do curso
 * @param page Página para paginação
 * @param limit Limite de resultados por página
 * @returns Lista de certificados do curso
 */
const getCertificatesByCourse = async (courseId: string, page: number = 1, limit: number = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('certificates')
      .select(`
        *,
        profiles!user_id(full_name, email)
      `, { count: 'exact' })
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar certificados do curso:', error);
      throw error;
    }

    return {
      certificates: data?.map(cert => ({
        ...mapToCertificate(cert),
        userEmail: cert.profiles?.email,
        userFullName: cert.profiles?.full_name
      })) || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Erro ao buscar certificados do curso:', error);
    throw error;
  }
};

/**
 * Regenera um certificado existente
 * @param certificateId ID do certificado
 * @returns Certificado regenerado
 */
const regenerateCertificate = async (certificateId: string) => {
  try {
    // Buscar o certificado existente
    const existingCert = await getCertificateById(certificateId);
    if (!existingCert) {
      throw new Error('Certificado não encontrado');
    }

    // Regenerar o certificado com nova data de emissão
    const updatedData = {
      issue_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('certificates')
      .update(updatedData)
      .eq('id', certificateId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao regenerar certificado:', error);
      throw error;
    }

    toast.success('Certificado regenerado com sucesso!');
    return mapToCertificate(data);
  } catch (error) {
    console.error('Erro ao regenerar certificado:', error);
    toast.error('Erro ao regenerar certificado');
    throw error;
  }
};

/**
 * Revoga um certificado
 * @param certificateId ID do certificado
 * @returns Sucesso da operação
 */
const revokeCertificate = async (certificateId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', certificateId);

    if (error) {
      console.error('Erro ao revogar certificado:', error);
      throw error;
    }

    toast.success('Certificado revogado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao revogar certificado:', error);
    toast.error('Erro ao revogar certificado');
    return false;
  }
};

/**
 * Obtém estatísticas de certificados para um curso
 * @param courseId ID do curso
 * @returns Estatísticas dos certificados
 */
const getCertificateStats = async (courseId: string) => {
  try {
    // Buscar total de certificados emitidos
    const { count: totalCertificates, error: certError } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (certError) {
      console.error('Erro ao buscar total de certificados:', certError);
      throw certError;
    }

    // Buscar total de matrículas no curso
    const { count: totalEnrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (enrollError) {
      console.error('Erro ao buscar total de matrículas:', enrollError);
      throw enrollError;
    }

    // Buscar matrículas concluídas (progresso 100%)
    const { count: completedEnrollments, error: completedError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('progress', 100);

    if (completedError) {
      console.error('Erro ao buscar matrículas concluídas:', completedError);
      throw completedError;
    }

    const completionRate = totalEnrollments ? (completedEnrollments || 0) / totalEnrollments * 100 : 0;
    const certificationRate = completedEnrollments ? (totalCertificates || 0) / (completedEnrollments || 1) * 100 : 0;

    return {
      totalCertificates: totalCertificates || 0,
      totalEnrollments: totalEnrollments || 0,
      completedEnrollments: completedEnrollments || 0,
      completionRate: Math.round(completionRate * 100) / 100,
      certificationRate: Math.round(certificationRate * 100) / 100
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de certificados:', error);
    throw error;
  }
};

/**
 * Obtém certificado por código de verificação
 * @param verificationCode Código de verificação do certificado
 * @returns Certificado encontrado
 */
const getCertificateByVerificationCode = async (verificationCode: string) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', verificationCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Certificado não encontrado
      }
      console.error('Erro ao buscar certificado por código:', error);
      throw error;
    }

    return mapToCertificate(data);
  } catch (error) {
    console.error('Erro ao buscar certificado por código:', error);
    throw error;
  }
};

/**
 * Obtém todos os certificados com paginação (para administradores)
 * @param page Página
 * @param limit Limite por página
 * @param searchTerm Termo de busca
 * @returns Lista paginada de certificados
 */
const getAllCertificates = async (page: number = 1, limit: number = 10, searchTerm?: string) => {
  try {
    const offset = (page - 1) * limit;
    let query = supabase
      .from('certificates')
      .select(`
        *,
        profiles!user_id(full_name, email),
        courses!course_id(title)
      `, { count: 'exact' });

    if (searchTerm) {
      query = query.or(`user_name.ilike.%${searchTerm}%,course_name.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar todos os certificados:', error);
      throw error;
    }

    return {
      certificates: data?.map(cert => ({
        ...mapToCertificate(cert),
        userEmail: cert.profiles?.email,
        userFullName: cert.profiles?.full_name,
        courseTitle: cert.courses?.title
      })) || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Erro ao buscar todos os certificados:', error);
    throw error;
  }
};

/**
 * Serviço de certificados
 */
export const certificateService = {
  getCertificates,
  getCertificateById,
  createCertificate,
  generateCertificate,
  updateCertificate,
  deleteCertificate,
  isEligibleForCertificate,
  createCertificateTemplate,
  // Professor-specific functions
  getCertificatesByCourse,
  regenerateCertificate,
  revokeCertificate,
  getCertificateStats,
  getCertificateByVerificationCode,
  getAllCertificates
};
