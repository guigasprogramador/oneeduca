import { Course } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Get enrolled courses for user - versão otimizada para o dashboard
 */
export const getEnrolledCourses = async (userId: string): Promise<Course[]> => {
  try {
    console.time('getEnrolledCourses');
    
    // Buscar todas as matrículas do usuário
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId);

    if (enrollmentsError) throw enrollmentsError;
    if (!enrollmentsData || enrollmentsData.length === 0) return [];

    // Obter os IDs dos cursos em que o usuário está matriculado
    const courseIds = enrollmentsData.map(enrollment => enrollment.course_id);
    
    // Criar um mapa de progresso por curso
    const progressMap = new Map();
    enrollmentsData.forEach(enrollment => {
      progressMap.set(enrollment.course_id, enrollment.progress || 0);
    });

    // Buscar os cursos com apenas os dados necessários para o dashboard
    // Não carregamos módulos e aulas para melhorar a performance
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description, thumbnail, duration, instructor, enrolledcount, rating, created_at, updated_at')
      .in('id', courseIds);

    if (coursesError) throw coursesError;
    if (!coursesData || coursesData.length === 0) return [];

    // Mapear os cursos para o formato desejado - versão simplificada para o dashboard
    const courses = coursesData.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description || '',
      thumbnail: course.thumbnail || '/placeholder.svg',
      duration: course.duration || '',
      instructor: course.instructor,
      enrolledCount: course.enrolledcount || 0,
      rating: course.rating || 0,
      // Não carregamos os módulos e aulas para o dashboard
      modules: [], // Array vazio - módulos serão carregados sob demanda quando necessário
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      isEnrolled: true,
      progress: progressMap.get(course.id) || 0
    }));

    console.timeEnd('getEnrolledCourses');
    return courses;
  } catch (error) {
    console.timeEnd('getEnrolledCourses');
    console.error('Error fetching enrolled courses:', error);
    throw error;
  }
};

/**
 * Get enrolled course details - versão completa com módulos e aulas
 * Usar esta função apenas quando precisar dos detalhes completos do curso
 */
export const getEnrolledCourseDetails = async (userId: string, courseId: string): Promise<Course | null> => {
  try {
    console.time(`getEnrolledCourseDetails-${courseId}`);
    
    // Verificar se o usuário está matriculado
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError || !enrollment) {
      console.log('Usuário não está matriculado neste curso');
      return null;
    }
    
    // Buscar dados do curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('Curso não encontrado');
      return null;
    }
    
    // Buscar módulos, aulas e progresso em paralelo
    const [modulesResult, allLessonsResult, allProgressResult] = await Promise.all([
      // 1. Buscar módulos
      supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number', { ascending: true }),
        
      // 2. Buscar todas as aulas de uma vez
      supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number', { ascending: true }),
        
      // 3. Buscar todo o progresso do usuário de uma vez
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
    ]);
    
    const modules = modulesResult.data || [];
    const allLessons = allLessonsResult.data || [];
    const allProgress = allProgressResult.data || [];
    
    // Criar mapas para acesso rápido
    const lessonsByModule = {};
    allLessons.forEach(lesson => {
      if (!lessonsByModule[lesson.module_id]) {
        lessonsByModule[lesson.module_id] = [];
      }
      lessonsByModule[lesson.module_id].push(lesson);
    });
    
    const progressByLesson = new Map();
    allProgress.forEach(progress => {
      progressByLesson.set(progress.lesson_id, progress.completed);
    });
    
    // Construir a estrutura do curso
    const mappedModules = modules.map(module => {
      const moduleLessons = lessonsByModule[module.id] || [];
      
      const mappedLessons = moduleLessons.map(lesson => ({
        id: lesson.id,
        moduleId: lesson.module_id,
        title: lesson.title,
        description: lesson.description || '',
        duration: lesson.duration || '',
        videoUrl: lesson.video_url || '',
        content: lesson.content || '',
        order: lesson.order_number,
        isCompleted: progressByLesson.get(lesson.id) || false
      }));
      
      return {
        id: module.id,
        courseId: module.course_id,
        title: module.title,
        description: module.description || '',
        order: module.order_number,
        lessons: mappedLessons
      };
    });
    
    // Construir o objeto do curso
    const courseDetails = {
      id: course.id,
      title: course.title,
      description: course.description || '',
      thumbnail: course.thumbnail || '/placeholder.svg',
      duration: course.duration || '',
      instructor: course.instructor,
      enrolledCount: course.enrolledcount || 0,
      rating: course.rating || 0,
      modules: mappedModules,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      isEnrolled: true,
      progress: enrollment.progress || 0
    };
    
    console.timeEnd(`getEnrolledCourseDetails-${courseId}`);
    return courseDetails;
  } catch (error) {
    console.error('Error fetching enrolled course details:', error);
    return null;
  }
};

/**
 * Enroll in a course (optimized)
 */
export const enrollCourse = async (courseId: string, userId: string): Promise<{ success: boolean; message: string; enrollment?: any }> => {
  try {
    // Validar parâmetros de entrada
    if (!courseId || !userId) {
      console.error('Parâmetros inválidos para matrícula:', { courseId, userId });
      return { success: false, message: 'ID do curso ou usuário inválido.' };
    }
    
    // Verificar se o curso existe
    try {
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .maybeSingle();
        
      if (courseError) {
        console.error('Erro ao verificar curso:', courseError);
      } else if (!course) {
        console.error('Curso não encontrado:', courseId);
        return { success: false, message: 'Curso não encontrado.' };
      }
    } catch (courseCheckError) {
      console.error('Erro ao verificar curso (capturado):', courseCheckError);
      // Continuar mesmo com erro para tentar a matrícula
    }
    
    // Verificar se o usuário existe, mas não falhar se não encontrar
    try {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', userId)
        .maybeSingle();
        
      if (userError) {
        console.error('Erro ao verificar usuário:', userError);
        // Continuar mesmo com erro
      } else if (!user) {
        console.log('Perfil do usuário não encontrado na tabela profiles:', userId);
        console.log('Tentando criar perfil automaticamente...');
        
        // Tentar criar o perfil do usuário automaticamente
        try {
          // Buscar dados do usuário na autenticação
          const { data: authUser } = await supabase.auth.getUser();
          
          if (authUser?.user) {
            // Criar perfil do usuário
            const { error: createError } = await supabase
              .from('profiles')
              .upsert({
                id: userId,
                name: authUser.user.user_metadata?.name || authUser.user.user_metadata?.full_name || 'Usuário',
                email: authUser.user.email,
                role: authUser.user.user_metadata?.role || 'student',
                created_at: new Date().toISOString()
              });
              
            if (createError) {
              console.error('Erro ao criar perfil do usuário:', createError);
            } else {
              console.log('Perfil do usuário criado automaticamente');
            }
          } else {
            console.log('Não foi possível obter dados do usuário autenticado');
          }
        } catch (createError) {
          console.error('Erro ao criar perfil do usuário:', createError);
        }
        
        // Continuar com a matrícula mesmo sem perfil
      }
    } catch (userCheckError) {
      console.error('Erro ao verificar usuário (capturado):', userCheckError);
      // Continuar mesmo com erro para tentar a matrícula
    }
    
    // Verifica se já existe matrícula - com tratamento de erro
    try {
      const { data: existing, error: checkError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
        
      if (checkError) {
        console.error('Erro ao verificar matrícula existente:', checkError);
        // Continuar mesmo com erro
      } else if (existing) {
        console.log(`Usuário ${userId} já está matriculado no curso ${courseId}`);
        return { success: true, message: 'Usuário já está matriculado neste curso.', enrollment: existing };
      }
    } catch (checkError) {
      console.error('Erro ao verificar matrícula existente (capturado):', checkError);
      // Continuar mesmo com erro
    }

    // Cria matrícula - com tratamento de erro aprimorado
    try {
      // Criar objeto de matrícula apenas com os campos que existem no esquema
      const enrollmentData = {
        user_id: userId,
        course_id: courseId,
        progress: 0,
        enrolled_at: new Date().toISOString(),
        status: 'active'
        // Removido campo last_accessed_at que não existe no esquema
      };
      
      const { data, error } = await supabase
        .from('enrollments')
        .insert(enrollmentData)
        .select()
        .single();
        
      if (error) {
        // Verificar se é erro de permissão
        if (error.code === '401' || error.message?.includes('401') || error.message?.includes('não autorizado') || error.message?.includes('unauthorized')) {
          console.error('Erro de permissão ao criar matrícula:', error);
          return { success: false, message: 'Erro de permissão ao realizar matrícula. Tente novamente mais tarde.' };
        }
        
        // Outros erros
        console.error('Erro ao criar matrícula:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('Matrícula criada, mas sem dados retornados');
        return { success: true, message: 'Matrícula realizada, mas sem confirmação completa.' };
      }

      console.log(`Matrícula criada com sucesso: usuário ${userId} no curso ${courseId}`);
      return { success: true, message: 'Matrícula realizada com sucesso!', enrollment: data };
    } catch (insertError) {
      console.error('Erro ao inserir matrícula (capturado):', insertError);
      
      // Tentar abordagem alternativa - inserção sem retornar dados
      try {
        console.log('Tentando abordagem alternativa para matrícula...');
        const { error: altError } = await supabase
          .from('enrollments')
          .insert({
            user_id: userId,
            course_id: courseId,
            progress: 0,
            enrolled_at: new Date().toISOString(),
            status: 'active'
          });
          
        if (altError) {
          console.error('Erro na abordagem alternativa:', altError);
          throw altError;
        }
        
        return { success: true, message: 'Matrícula realizada com abordagem alternativa.' };
      } catch (altError) {
        console.error('Erro na abordagem alternativa (capturado):', altError);
        throw insertError; // Lançar o erro original
      }
    }
  } catch (error: any) {
    console.error('Error enrolling in course:', error);
    return { 
      success: false, 
      message: `Erro ao realizar matrícula: ${error.message || error.details || 'Erro desconhecido'}` 
    };
  }
};

/**
 * Update course progress
 */
export const updateCourseProgress = async (courseId: string, userId: string, progress: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('enrollments')
      .update({ progress })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating course progress:', error);
    throw error;
  }
};

/**
 * Check if a user is enrolled in a specific course
 */
export const checkEnrollment = async (courseId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();
    
    return { data, error };
  } catch (error) {
    console.error('Error checking enrollment:', error);
    throw error;
  }
};

/**
 * Busca alunos matriculados em um curso específico
 * Implementação robusta que verifica múltiplas tabelas e estruturas de dados
 */
export const getEnrolledUsers = async (courseId: string) => {
  try {
    console.log('Buscando alunos matriculados para o curso:', courseId);
    
    if (!courseId) {
      console.error('ID do curso não fornecido');
      toast.error('ID do curso não fornecido');
      return [];
    }

    // NOVA ABORDAGEM PRINCIPAL: Buscar diretamente da tabela de matrículas e garantir que todos os alunos sejam exibidos
    try {
      console.log('ABORDAGEM PRINCIPAL: Buscando matrículas e garantindo exibição de todos os alunos...');
      
      // Buscar matrículas para este curso
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('user_id, course_id, progress, enrolled_at')
        .eq('course_id', courseId);
      
      if (enrollmentsError) {
        console.error('Erro ao buscar matrículas:', enrollmentsError);
        // Continuar com outras abordagens se esta falhar
      } else if (enrollments && enrollments.length > 0) {
        console.log(`Encontradas ${enrollments.length} matrículas para o curso ${courseId}`);
        
        // Extrair IDs de usuários únicos
        const userIds = [...new Set(enrollments.map(e => e.user_id).filter(Boolean))];
        console.log(`IDs de usuários matriculados: ${userIds.join(', ')}`);
        
        if (userIds.length === 0) {
          console.log('Nenhum ID de usuário válido encontrado nas matrículas');
          // Continuar com outras abordagens
        } else {
          // Criar mapa de matrículas para associar com os usuários
          const enrollmentMap = new Map();
          enrollments.forEach(enrollment => {
            if (!enrollment.user_id) return;
            
            enrollmentMap.set(enrollment.user_id, {
              enrolledAt: enrollment.enrolled_at || new Date().toISOString(),
              progress: enrollment.progress || 0
            });
          });
          
          // Buscar perfis dos usuários na tabela profiles
          const { data: initialProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
          
          // Variável para armazenar os perfis, inicialmente com os perfis encontrados
          let profiles = initialProfiles || [];
          
          if (profilesError || profiles.length === 0) {
            console.error('Erro ao buscar perfis de usuários ou nenhum perfil encontrado:', profilesError);
            // Tentar criar perfis para os usuários que não existem
            for (const userId of userIds) {
              try {
                // Verificar se o usuário existe na autenticação
                const { data: authData } = await supabase.auth.getUser(userId);
                
                if (authData?.user) {
                  console.log(`Criando perfil para o usuário ${userId}...`);
                  
                  // Criar perfil do usuário automaticamente
                  await supabase
                    .from('profiles')
                    .upsert({
                      id: userId,
                      name: authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || `Aluno ${userId.substring(0, 6)}`,
                      email: authData.user.email,
                      role: authData.user.user_metadata?.role || 'student',
                      created_at: new Date().toISOString()
                    });
                }
              } catch (createProfileError) {
                console.error(`Erro ao criar perfil para usuário ${userId}:`, createProfileError);
              }
            }
            
            // Buscar perfis novamente após tentativa de criação
            const { data: updatedProfiles } = await supabase
              .from('profiles')
              .select('*')
              .in('id', userIds);
              
            if (updatedProfiles && updatedProfiles.length > 0) {
              // Substituir a variável profiles com os novos dados
              profiles = updatedProfiles;
            }
          }
          
          // Se ainda não temos perfis, criar usuários fictícios com os IDs das matrículas
          if (!profiles || profiles.length === 0) {
            console.log('Nenhum perfil de usuário encontrado, criando usuários fictícios...');
            
            const dummyUsers = userIds.map(userId => {
              const enrollmentData = enrollmentMap.get(userId) || {};
              return {
                id: userId,
                name: `Aluno ${userId.substring(0, 6)}`,
                email: '',
                role: 'student',
                avatarUrl: '',
                createdAt: new Date().toISOString(),
                enrolledAt: enrollmentData.enrolledAt,
                progress: enrollmentData.progress || 0
              };
            });
            
            console.log(`Criados ${dummyUsers.length} usuários fictícios baseados nos IDs das matrículas`);
            toast.warning('Informações completas dos usuários não encontradas');
            return dummyUsers;
          }
          
          console.log(`Encontrados ${profiles.length} perfis de usuários`);
          
          // Mapear para o formato esperado
          const enrolledUsers = profiles.map(profile => {
            const enrollmentData = enrollmentMap.get(profile.id) || {};
            return {
              id: profile.id,
              name: profile.name || profile.username || profile.full_name || profile.fullName || 'Usuário',
              email: profile.email || '',
              role: profile.role || 'student',
              avatarUrl: profile.avatar_url || profile.avatarUrl || '',
              createdAt: profile.created_at || profile.createdAt || new Date().toISOString(),
              enrolledAt: enrollmentData.enrolledAt || new Date().toISOString(),
              progress: enrollmentData.progress || 0
            };
          });
          
          console.log(`ABORDAGEM PRINCIPAL: Retornando ${enrolledUsers.length} usuários matriculados`);
          
          if (enrolledUsers.length > 0) {
            toast.success(`${enrolledUsers.length} alunos matriculados encontrados`);
            return enrolledUsers;
          }
        }
      }
    } catch (mainApproachError) {
      console.error('Erro na ABORDAGEM PRINCIPAL:', mainApproachError);
    }
    
    // Abordagem 1: Buscar diretamente todos os usuários e depois filtrar os matriculados
    try {
      console.log('ABORDAGEM 1: Buscando todos os usuários primeiro...');
      
      // Buscar todos os usuários do sistema
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*');
      
      if (usersError) {
        console.error('Erro ao buscar todos os usuários:', usersError);
        // Continuar com a próxima abordagem
      } else if (allUsers && allUsers.length > 0) {
        console.log(`Encontrados ${allUsers.length} usuários no sistema`);
        
        // Buscar matrículas para este curso
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('course_id', courseId);
        
        if (enrollmentsError) {
          console.error('Erro ao buscar matrículas:', enrollmentsError);
        } else if (enrollments && enrollments.length > 0) {
          console.log(`Encontradas ${enrollments.length} matrículas para o curso ${courseId}`);
          
          // Criar um conjunto com os IDs dos usuários matriculados
          const enrolledUserIds = new Set(enrollments.map(e => e.user_id));
          console.log(`IDs de usuários matriculados: ${Array.from(enrolledUserIds).join(', ')}`);
          
          // Criar mapa de matrículas para associar com os usuários
          const enrollmentMap = new Map();
          enrollments.forEach(enrollment => {
            if (!enrollment.user_id) return;
            
            enrollmentMap.set(enrollment.user_id, {
              enrolledAt: enrollment.enrolled_at || new Date().toISOString(),
              progress: enrollment.progress || 0
            });
          });
          
          // Filtrar apenas os usuários que estão matriculados neste curso
          const enrolledUsers = allUsers
            .filter(user => enrolledUserIds.has(user.id))
            .map(user => {
              const enrollmentData = enrollmentMap.get(user.id) || {};
              return {
                id: user.id,
                name: user.name || user.username || user.full_name || user.fullName || 'Usuário',
                email: user.email || '',
                role: user.role || 'student',
                avatarUrl: user.avatar_url || user.avatarUrl || '',
                createdAt: user.created_at || user.createdAt || new Date().toISOString(),
                enrolledAt: enrollmentData.enrolledAt || new Date().toISOString(),
                progress: enrollmentData.progress || 0
              };
            });
          
          console.log(`ABORDAGEM 1: Encontrados ${enrolledUsers.length} usuários matriculados`);
          
          if (enrolledUsers.length > 0) {
            toast.success(`${enrolledUsers.length} alunos matriculados encontrados`);
            return enrolledUsers;
          }
        }
      }
    } catch (approach1Error) {
      console.error('Erro na ABORDAGEM 1:', approach1Error);
    }
    
    // Abordagem 2: Método tradicional - buscar matrículas e depois os perfis dos usuários
    try {
      console.log('ABORDAGEM 2: Buscando matrículas na tabela enrollments...');
      
      // Buscar matrículas para este curso
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId);
      
      if (enrollmentsError) {
        console.error('Erro ao buscar matrículas:', enrollmentsError);
        throw enrollmentsError;
      }
      
      if (!enrollments || enrollments.length === 0) {
        console.log('Nenhuma matrícula encontrada para este curso');
        toast.warning('Nenhum aluno matriculado neste curso');
        return [];
      }
      
      console.log(`Encontradas ${enrollments.length} matrículas para o curso ${courseId}`);
      
      // Extrair IDs de usuários
      const userIds = enrollments.map(enrollment => enrollment.user_id).filter(Boolean);
      
      if (userIds.length === 0) {
        console.log('Nenhum ID de usuário válido encontrado nas matrículas');
        toast.warning('Dados de matrícula incompletos');
        return [];
      }
      
      console.log(`Buscando informações de ${userIds.length} usuários...`);
      console.log('IDs de usuários:', userIds);
      
      // Criar mapa de matrículas para associar com os usuários
      const enrollmentMap = new Map();
      enrollments.forEach(enrollment => {
        if (!enrollment.user_id) return;
        
        enrollmentMap.set(enrollment.user_id, {
          enrolledAt: enrollment.enrolled_at || new Date().toISOString(),
          progress: enrollment.progress || 0
        });
      });
      
      // Buscar perfis dos usuários na tabela profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Erro ao buscar perfis de usuários:', profilesError);
        throw profilesError;
      }
      
      if (!profiles || profiles.length === 0) {
        console.log('Nenhum perfil de usuário encontrado');
        
        // Tentar criar usuários fictícios com os IDs das matrículas
        const dummyUsers = userIds.map(userId => {
          const enrollmentData = enrollmentMap.get(userId) || {};
          return {
            id: userId,
            name: `Aluno ${userId.substring(0, 6)}`,
            email: '',
            role: 'student',
            avatarUrl: '',
            createdAt: new Date().toISOString(),
            enrolledAt: enrollmentData.enrolledAt,
            progress: enrollmentData.progress || 0
          };
        });
        
        console.log(`Criados ${dummyUsers.length} usuários fictícios baseados nos IDs das matrículas`);
        toast.warning('Informações completas dos usuários não encontradas');
        return dummyUsers;
      }
      
      console.log(`Encontrados ${profiles.length} perfis de usuários`);
      
      // Mapear para o formato esperado
      const enrolledUsers = profiles.map(profile => {
        const enrollmentData = enrollmentMap.get(profile.id) || {};
        return {
          id: profile.id,
          name: profile.name || profile.username || profile.full_name || profile.fullName || 'Usuário',
          email: profile.email || '',
          role: profile.role || 'student',
          avatarUrl: profile.avatar_url || profile.avatarUrl || '',
          createdAt: profile.created_at || profile.createdAt || new Date().toISOString(),
          enrolledAt: enrollmentData.enrolledAt,
          progress: enrollmentData.progress || 0
        };
      });
      
      console.log(`ABORDAGEM 2: Retornando ${enrolledUsers.length} usuários matriculados`);
      
      if (enrolledUsers.length > 0) {
        toast.success(`${enrolledUsers.length} alunos matriculados encontrados`);
        return enrolledUsers;
      }
    } catch (approach2Error) {
      console.error('Erro na ABORDAGEM 2:', approach2Error);
    }
    
    // Abordagem 3: Último recurso - buscar todos os usuários com role='student'
    try {
      console.log('ABORDAGEM 3: Buscando todos os alunos do sistema...');
      
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');
      
      if (studentsError) {
        console.error('Erro ao buscar alunos:', studentsError);
        throw studentsError;
      }
      
      if (!students || students.length === 0) {
        console.log('Nenhum aluno encontrado no sistema');
        toast.warning('Nenhum aluno encontrado no sistema');
        return [];
      }
      
      console.log(`Encontrados ${students.length} alunos no sistema`);
      
      // Assumir que todos os alunos estão matriculados no curso
      const enrolledUsers = students.map(student => ({
        id: student.id,
        name: student.name || student.username || student.full_name || student.fullName || 'Aluno',
        email: student.email || '',
        role: 'student',
        avatarUrl: student.avatar_url || student.avatarUrl || '',
        createdAt: student.created_at || student.createdAt || new Date().toISOString(),
        enrolledAt: new Date().toISOString(),
        progress: 0
      }));
      
      console.log(`ABORDAGEM 3: Retornando ${enrolledUsers.length} alunos como matriculados`);
      toast.info(`Mostrando ${enrolledUsers.length} alunos do sistema. Alguns podem não estar matriculados neste curso específico.`);
      
      return enrolledUsers;
    } catch (approach3Error) {
      console.error('Erro na ABORDAGEM 3:', approach3Error);
    }
    
    // Se todas as abordagens falharem
    toast.error('Não foi possível buscar alunos matriculados. Tente novamente mais tarde.');
    return [];
  } catch (error) {
    console.error('Erro ao buscar alunos matriculados:', error);
    toast.error(`Erro ao buscar alunos matriculados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    
    // Retornar array vazio em caso de erro
    return [];
  }
};

/**
 * Função auxiliar para buscar matrículas de uma tabela específica
 */
async function getEnrollmentsFromTable(tableName: string, courseId: string) {
  try {
    // Verificar se a tabela existe antes de tentar buscar dados
    const { data: tableCheck, error: tableError } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
      
    if (tableError) {
      console.error(`Erro ao verificar tabela ${tableName}:`, tableError);
      return [];
    }
    
    if (!tableCheck) {
      console.log(`Tabela ${tableName} não existe ou não está acessível`);
      return [];
    }
    
    console.log(`Tabela ${tableName} existe, buscando matrículas...`);
    
    // Tentar diferentes nomes de coluna para o ID do curso
    const possibleCourseIdColumns = ['course_id', 'courseId', 'courseid', 'course'];
    
    for (const columnName of possibleCourseIdColumns) {
      try {
        console.log(`Tentando buscar matrículas com coluna ${columnName}...`);
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq(columnName, courseId);
          
        if (error) {
          console.log(`Erro ao buscar com coluna ${columnName}:`, error.message);
          continue; // Tentar próxima coluna
        }
        
        if (data && data.length > 0) {
          console.log(`Encontradas ${data.length} matrículas usando coluna ${columnName}`);
          return data;
        } else {
          console.log(`Nenhuma matrícula encontrada usando coluna ${columnName}`);
        }
      } catch (columnError) {
        console.log(`Coluna ${columnName} não existe na tabela ${tableName}`);
      }
    }
    
    // Se não encontrar com nenhuma coluna específica, tentar buscar todas as matrículas
    // e filtrar manualmente (útil para tabelas com estrutura desconhecida)
    console.log(`Tentando buscar todas as matrículas da tabela ${tableName}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(100); // Limitar para evitar carregar muitos dados
      
    if (error) {
      console.error(`Erro ao buscar todas as matrículas da tabela ${tableName}:`, error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log(`Tabela ${tableName} está vazia`);
      return [];
    }
    
    console.log(`Encontradas ${data.length} matrículas no total, filtrando manualmente...`);
    
    // Tentar filtrar manualmente por diferentes possíveis nomes de coluna
    const filteredData = data.filter(item => {
      return (
        item.course_id === courseId ||
        item.courseId === courseId ||
        item.courseid === courseId ||
        item.course === courseId
      );
    });
    
    if (filteredData.length > 0) {
      console.log(`Encontradas ${filteredData.length} matrículas após filtragem manual`);
      return filteredData;
    }
    
    console.log(`Nenhuma matrícula encontrada na tabela ${tableName} para o curso ${courseId}`);
    return [];
  } catch (error) {
    console.error(`Erro ao buscar matrículas da tabela ${tableName}:`, error);
    return [];
  }
}
