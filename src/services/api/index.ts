import * as courseQueries from '../courses/courseQueries';
import * as enrollmentService from '../courses/enrollmentService';
import * as courseAdminService from '../courses/courseAdminService';
import { moduleService } from '../moduleService';

export const courseService = {
  ...courseQueries,
  ...enrollmentService,
  ...courseAdminService,
};

export { moduleService };
