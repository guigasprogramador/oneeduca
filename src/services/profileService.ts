
import { Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Get all profiles
const getProfiles = async (): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
      
    if (error) throw error;
    
    return data?.map(profile => ({
      id: profile.id,
      userId: profile.id,  // In our schema, profile.id is the user's id
      fullName: profile.name || '',
      bio: profile.bio || '',
      avatar: profile.avatar_url,
      jobTitle: profile.job_title || '',
      company: profile.company || '',
      location: profile.location || '',
      website: profile.website || '',
      social: {}
    })) || [];
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
};

// Create a profile
const createProfile = async (profileData: { 
  userId: string, 
  fullName: string,
  bio?: string,
  jobTitle?: string,
  company?: string,
  location?: string,
  website?: string
}): Promise<Profile> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profileData.userId,
        name: profileData.fullName,
        bio: profileData.bio,
        job_title: profileData.jobTitle,
        company: profileData.company,
        location: profileData.location,
        website: profileData.website,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    return {
      id: profileData.userId,
      userId: profileData.userId,
      fullName: profileData.fullName,
      bio: profileData.bio,
      jobTitle: profileData.jobTitle,
      company: profileData.company,
      location: profileData.location,
      website: profileData.website,
      social: {}
    };
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

// Update a profile
const updateProfile = async (profileId: string, profileData: { 
  userId?: string, 
  fullName?: string,
  bio?: string,
  jobTitle?: string,
  company?: string,
  location?: string,
  website?: string
}): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profileData.fullName,
        bio: profileData.bio,
        job_title: profileData.jobTitle,
        company: profileData.company,
        location: profileData.location,
        website: profileData.website,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Delete a profile
const deleteProfile = async (profileId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
};

export const profileService = {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile
};
