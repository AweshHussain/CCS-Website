import { GalleryItem } from '../types';

export const galleryData: GalleryItem[] = [
  {
    id: 'technika-annual-symposium',
    title: 'Technika 6.0: The Flagship Technical Symposium',
    category: 'Technical Events',
    date: 'October 2026',
    description: 'CCS’s annual flagship multi-track technical conference uniting over 1,500 builders, keynote speakers, live competitive coding, and hardware demos.',
    image: '/assets/gallery/technika_poster.png',
    featured: true,
    tags: ['Flagship Fest', 'Keynote', '1500+ Attendees', 'Code Wars'],
    stats: {
      participants: '1,500+',
      duration: '3 Days'
    }
  },
  {
    id: 'hack-horizon-edition',
    title: 'Hack Horizon: 36-Hour National Innovation Hackathon',
    category: 'Hackathons',
    date: 'February 2026',
    description: 'Round-the-clock national hackathon where teams built distributed AI solutions, Web3 primitives, and real-time civic systems.',
    image: '/assets/gallery/hackhorizon.png',
    featured: true,
    tags: ['Hackathon', 'Non-Stop Sprint', 'AI / Web3 Track', 'Prize Pool'],
    stats: {
      participants: '650+ Hackers',
      duration: '36 Hours'
    }
  },
  {
    id: 'sih-innovation-sprint',
    title: 'Smart India Hackathon (SIH) Internal Grand Finale',
    category: 'Hackathons',
    date: 'September 2026',
    description: 'Intense mentorship and internal evaluation round selecting university finalist teams for high-stakes governmental problem statements.',
    image: '/assets/gallery/sih.png',
    featured: false,
    tags: ['National Selection', 'GovTech', 'System Prototyping'],
    stats: {
      participants: '45 Teams',
      duration: '24 Hours'
    }
  },
  {
    id: 'technika-experience',
    title: 'Technika 5.0 Visual Showcase & Code Arena',
    category: 'Technical Events',
    date: '2025',
    description: 'Auditorium keynote sessions and speed algorithm battles under crimson ambient stage illumination.',
    image: '/assets/gallery/technika.png',
    featured: true,
    tags: ['Symposium', 'Auditorium Keynote', 'Exhibition'],
    stats: {
      participants: '1,200+',
      duration: '48 Hours'
    }
  },
  {
    id: 'cyber-night-showcase',
    title: 'Technika Dark Edition: Cyber Security & Reverse Engineering',
    category: 'Workshops',
    date: 'March 2026',
    description: 'Midnight Capture The Flag (CTF) tournament, binary exploitation clinics, and network telemetry analysis workshops.',
    image: '/assets/gallery/technika_dark.jpg',
    featured: false,
    tags: ['CTF', 'Cybersecurity', 'Binary Exploitation', 'Late Night'],
    stats: {
      participants: '320 Hackers',
      duration: '12 Hours'
    }
  },
  {
    id: 'community-circle',
    title: 'CCS Core Induction & Collaborative Code Camp',
    category: 'Team Activities',
    date: 'November 2026',
    description: 'Onboarding new cohort contributors, pair programming sessions, lightning talks, and open-source project roadmaps.',
    image: '/assets/gallery/community_post.png',
    featured: false,
    tags: ['Induction', 'Team Spirit', 'Open Source', 'Mentorship'],
    stats: {
      participants: '120+ Members',
      duration: 'Full Day'
    }
  }
];

