// Main API file that re-exports all services

import * as courseQueries from './courses/courseQueries';
import * as enrollmentService from './courses/enrollmentService';
import * as courseAdminService from './courses/courseAdminService';
export { moduleService } from './moduleService';
export { lessonService } from './lessonService';
export { certificateService } from './certificateService';
export { userService } from './userService';
export { profileService } from './profileService';
export { autoEnrollmentService } from './autoEnrollmentService';

export const courseService = {
  ...courseQueries,
  ...enrollmentService,
  ...courseAdminService,
};

// Temporary mock implementation for getMyEndpointData to fix error
export async function getMyEndpointData() {
  // Replace with real API call as needed
  return { data: { message: 'Mock data loaded' } };
}

export { enrollmentService };
