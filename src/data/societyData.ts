import { PillarItem } from '../types';

export const societyInfo = {
  name: 'Code & Compute Society',
  shortName: 'CCS',
  tagline: 'THINK. CODE. CREATE.',
  heroHeadline: 'WE BUILD. WE INNOVATE. WE CREATE.',
  heroDescription: 'Code & Compute Society (CCS) is a premier technical collective of engineers, researchers, and creative technologists. We bridge the frontier between computational theory and real-world system architecture through high-octane hackathons, open-source initiatives, and research incubation.',
  about: {
    heading: 'BEYOND THE CODE.',
    subheading: 'Pioneering technical culture through craft, collaboration, and high-impact computing.',
    story: 'Founded with the conviction that computing is an art form of logic and imagination, Code & Compute Society serves as the beating heart of engineering passion. We cultivate an elite yet accessible environment where students transform from casual programmers into systems builders, competitive problem-solvers, and technical leaders.',
    vision: 'To build a world-class student-led engineering ecosystem that incubates groundbreaking software, sparks intellectual curiosity, and empowers builders to solve society’s hardest computational challenges.',
    mission: 'Empowering future engineers through rigorous peer mentorship, hands-on production codebases, competitive algorithmic training, and multi-disciplinary technical conferences.',
  },
  stats: [
    { value: '1,500+', label: 'Active Community Members', detail: 'Across all engineering disciplines' },
    { value: '35+', label: 'Hackathons & Events Hosted', detail: 'Including national-level symposiums' },
    { value: '120+', label: 'Open-Source Projects', detail: 'Shipped to production repositories' },
    { value: '₹1.5M+', label: 'Prizes & Grants Won', detail: 'By member teams in national hackathons' },
  ],
  pillars: [
    {
      id: 'pillar-1',
      title: 'Algorithmic Mastery & Competitive Coding',
      subtitle: 'Precision Logic',
      description: 'Weekly contests, data structures drill sessions, graph theory masterclasses, and competitive programming bootcamps preparing students for international arenas like ICPC.',
      iconName: 'Terminal',
      metrics: '200+ Solved Challenges / Week'
    },
    {
      id: 'pillar-2',
      title: 'Full-Stack Systems & Cloud Infrastructure',
      subtitle: 'Production Scale',
      description: 'Architecting distributed backends, microservices, reactive frontends, and cloud-native serverless deployments with modern DevOps and continuous integration.',
      iconName: 'Cpu',
      metrics: '99.9% Uptime Cloud Labs'
    },
    {
      id: 'pillar-3',
      title: 'AI, LLMs & Machine Intelligence',
      subtitle: 'Neural Frontiers',
      description: 'Diving deep into transformer architectures, local LLM fine-tuning, computer vision pipelines, and mathematical machine learning foundations.',
      iconName: 'Sparkles',
      metrics: '15+ Machine Learning Workshops'
    },
    {
      id: 'pillar-4',
      title: 'Hackathons & Flagship Symposiums',
      subtitle: 'High-Octane Building',
      description: 'Organizers of Technika and Hack Horizon, bringing together top talent, industry leaders, and visionary venture mentors under one roof.',
      iconName: 'Flame',
      metrics: '36-Hour Sprints & Live Demos'
    }
  ] as PillarItem[],
  socialLinks: {
    github: 'https://github.com/ccs-society',
    linkedin: 'https://linkedin.com/company/code-compute-society',
    instagram: 'https://instagram.com/ccs_society',
    email: 'contact@ccs-society.org',
    discord: 'https://discord.gg/ccs-society'
  }
};

