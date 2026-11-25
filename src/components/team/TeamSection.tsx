import React, { useState, useMemo } from 'react';
import { Users, Search } from 'lucide-react';
import { teamData } from '../../data/teamData';
import { TeamCard } from './TeamCard';
import { TeamMember } from '../../types';

const CATEGORIES = ['All', 'Leadership', 'Technical', 'Development', 'Design', 'Operations'] as const;

export const TeamSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Group members for the Tree Hierarchy View
  const executiveMembers = useMemo(
    () => teamData.filter((m) => m.id === 'awesh-hussain' || m.id === 'vice-president'),
    []
  );

  const domainWings = useMemo(() => [
    {
      title: 'Technical & Intelligence',
      badge: 'TECH CORE',
      members: teamData.filter((m) => m.id === 'technical-head' || m.id === 'ai-lead'),
    },
    {
      title: 'Software & Cloud Systems',
      badge: 'ENGINEERING',
      members: teamData.filter((m) => m.id === 'dev-lead' || m.id === 'backend-lead'),
    },
    {
      title: 'UI/UX & Creative Media',
      badge: 'DESIGN & MEDIA',
      members: teamData.filter((m) => m.id === 'design-lead' || m.id === 'motion-designer'),
    },
    {
      title: 'Operations & Community',
      badge: 'OUTREACH',
      members: teamData.filter((m) => m.id === 'community-lead' || m.id === 'pr-lead'),
    },
  ], []);

  // Filtered members for Search or Grid Mode
  const filteredMembers = useMemo(() => {
    return teamData.filter((member) => {
      const matchesCategory =
        selectedCategory === 'All' || member.category === selectedCategory;
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const isTreeActive = !searchQuery && selectedCategory === 'All';

  return (
    <section id="team" className="relative py-24 sm:py-32 px-4 sm:px-8 lg:px-12 w-full overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#E50920]/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#E50920]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-white/10 text-xs font-mono text-[#E50920] mb-4">
              <Users className="w-3.5 h-3.5" />
              <span>THE COLLECTIVE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-white uppercase">
              MEET THE <span className="text-[#E50920]">MINDS</span> BEHIND CCS
            </h2>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl font-sans mt-3">
              An interdisciplinary cohort of student researchers, system architects, and creative visionaries driving technological culture.
            </p>
          </div>

          {/* Right Action Tools: Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or role..."
              className="w-full pl-10 pr-4 py-2 rounded-full glass-panel border border-white/10 text-xs font-sans text-white placeholder-zinc-400 focus:outline-none focus:border-[#E50920]/50 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills (Shown in Grid mode or when searching) */}
        {!isTreeActive && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const count =
                cat === 'All'
                  ? teamData.length
                  : teamData.filter((m) => m.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#E50920] text-white shadow-[0_0_15px_rgba(229,9,32,0.4)] font-semibold'
                      : 'glass-panel text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-black/30 text-white' : 'bg-white/5 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ============================================================== */}
        {/* HIERARCHY VIEW (Executive Leadership -> Domain Leads)          */}
        {/* ============================================================== */}
        {isTreeActive ? (
          <div className="relative flex flex-col items-center w-full gap-12 sm:gap-16">
            {/* ---------------- LEVEL 1: EXECUTIVE LEADERSHIP ---------------- */}
            <div className="w-full flex flex-col items-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full">
                {executiveMembers.map((member) => (
                  <TeamCard key={member.id} member={member} />
                ))}
              </div>
            </div>

            {/* ---------------- LEVEL 3: DOMAIN WINGS & CORE LEADS ---------------- */}
            <div className="w-full flex flex-col items-center">
              {/* 4 Specialized Domain Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {domainWings.map((wing, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-4 p-4 rounded-3xl glass-panel border border-white/10 bg-white/[0.01]"
                  >
                    {/* Wing Header Badge */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 px-1">
                      <span className="text-[11px] font-display font-bold text-white uppercase tracking-wider">
                        {wing.title}
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#E50920]/15 text-[#E50920] border border-[#E50920]/30">
                        {wing.badge}
                      </span>
                    </div>

                    {/* Member Cards in this Wing */}
                    <div className="flex flex-col gap-4">
                      {wing.members.map((member) => (
                        <TeamCard key={member.id} member={member} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* FLAT GRID CATALOG (Fallback for search / filtered categories)   */
          /* ============================================================== */
          filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMembers.map((member) => (
                <TeamCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-3xl glass-panel border border-white/10">
              <p className="text-sm font-mono text-zinc-400">No members found matching your search filter.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-full text-xs font-mono text-[#E50920] hover:text-white glass-panel cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )
        )}
      </div>
    </section>
  );
};

