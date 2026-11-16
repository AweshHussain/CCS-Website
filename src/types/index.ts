export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'Faculty' | 'Leadership' | 'Technical' | 'Development' | 'Design' | 'Operations';
  bio: string;
  image?: string;
  avatarFallback: string;
  skills: string[];
  linkedin?: string;
  github?: string;
  email?: string;
  badge?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Technical Events' | 'Workshops' | 'Hackathons' | 'Team Activities';
  date: string;
  description: string;
  image: string;
  featured?: boolean;
  tags: string[];
  stats?: {
    participants?: string;
    duration?: string;
  };
}

export interface PillarItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  metrics: string;
}

