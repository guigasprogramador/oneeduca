
-- Insert sample course data
INSERT INTO public.courses (title, description, thumbnail, duration, instructor, enrolledCount, rating)
VALUES 
  ('Introduction to Web Development', 'Learn the basics of HTML, CSS, and JavaScript to build modern websites.', '/placeholder.svg', '10 hours', 'John Doe', 0, 4.5),
  ('Advanced JavaScript Programming', 'Master JavaScript concepts like closures, promises, and async/await.', '/placeholder.svg', '12 hours', 'Jane Smith', 0, 4.7),
  ('React Fundamentals', 'Learn to build dynamic UIs with React.js, the popular JavaScript library.', '/placeholder.svg', '8 hours', 'Mike Johnson', 0, 4.8);

-- Insert sample modules for the first course
INSERT INTO public.modules (course_id, title, description, order_number)
VALUES 
  ((SELECT id FROM public.courses WHERE title = 'Introduction to Web Development' LIMIT 1), 'HTML Basics', 'Learn the fundamentals of HTML markup', 1),
  ((SELECT id FROM public.courses WHERE title = 'Introduction to Web Development' LIMIT 1), 'CSS Styling', 'Master CSS for beautiful websites', 2),
  ((SELECT id FROM public.courses WHERE title = 'Introduction to Web Development' LIMIT 1), 'JavaScript Intro', 'Get started with JavaScript programming', 3);

-- Insert sample lessons for the first module
INSERT INTO public.lessons (module_id, title, description, duration, video_url, content, order_number)
VALUES 
  ((SELECT id FROM public.modules WHERE title = 'HTML Basics' LIMIT 1), 'Introduction to HTML', 'Learn what HTML is and why it matters', '15 min', 'https://example.com/video1', 'HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.', 1),
  ((SELECT id FROM public.modules WHERE title = 'HTML Basics' LIMIT 1), 'HTML Document Structure', 'Understanding the basic structure of an HTML document', '20 min', 'https://example.com/video2', 'Every HTML document has a basic structure including the DOCTYPE declaration, html, head, and body elements.', 2),
  ((SELECT id FROM public.modules WHERE title = 'HTML Basics' LIMIT 1), 'HTML Elements and Tags', 'Learn about the building blocks of HTML', '25 min', 'https://example.com/video3', 'HTML elements are represented by tags. Tags are enclosed in angle brackets.', 3);
