
-- Create Row Level Security Policies

-- Profiles policies
CREATE POLICY "Users can view their own profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profiles"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Courses policies (public readable)
CREATE POLICY "Courses are viewable by everyone"
  ON public.courses
  FOR SELECT
  USING (true);

-- Modules policies (public readable)
CREATE POLICY "Modules are viewable by everyone"
  ON public.modules
  FOR SELECT
  USING (true);

-- Lessons policies (public readable)
CREATE POLICY "Lessons are viewable by everyone"
  ON public.lessons
  FOR SELECT
  USING (true);

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments"
  ON public.enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Lesson progress policies
CREATE POLICY "Users can view their own lesson progress"
  ON public.lesson_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson progress"
  ON public.lesson_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own lesson progress"
  ON public.lesson_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Certificates policies
CREATE POLICY "Users can view their own certificates"
  ON public.certificates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Course creation and management policies
CREATE POLICY "Professors can create courses"
  ON public.courses
  FOR INSERT
  WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Professors can update their own courses"
  ON public.courses
  FOR UPDATE
  USING (auth.uid() = professor_id);

CREATE POLICY "Professors can delete their own courses"
  ON public.courses
  FOR DELETE
  USING (auth.uid() = professor_id);

-- Module management policies
CREATE POLICY "Professors can create modules for their courses"
  ON public.modules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND professor_id = auth.uid()
    )
  );

CREATE POLICY "Professors can update modules of their courses"
  ON public.modules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND professor_id = auth.uid()
    )
  );

CREATE POLICY "Professors can delete modules of their courses"
  ON public.modules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND professor_id = auth.uid()
    )
  );

-- Lesson management policies
CREATE POLICY "Professors can create lessons for their modules"
  ON public.lessons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      WHERE m.id = module_id AND c.professor_id = auth.uid()
    )
  );

CREATE POLICY "Professors can update lessons of their modules"
  ON public.lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      WHERE m.id = module_id AND c.professor_id = auth.uid()
    )
  );

CREATE POLICY "Professors can delete lessons of their modules"
  ON public.lessons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      WHERE m.id = module_id AND c.professor_id = auth.uid()
    )
  );
