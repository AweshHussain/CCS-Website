import React, { useState } from 'react';
import { Mail, MapPin, Send, MessageSquare, CheckCircle, Github, Linkedin, Instagram, ArrowUpRight } from 'lucide-react';
import { societyInfo } from '../../data/societyData';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Student / Aspiring Member',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ name: '', email: '', role: 'Student / Aspiring Member', message: '' });
      }, 4000);
    }, 1000);
  };

  return (
    <section id="contact" className="relative py-24 sm:py-32 px-4 sm:px-8 lg:px-12 w-full overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E50920]/8 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Direct Info & Social Channels */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-white/10 text-xs font-mono text-[#E50920] mb-4 w-fit">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>COMMUNICATION CHANNELS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-white uppercase mb-6 leading-tight">
              LET'S BUILD <br />
              <span className="text-[#E50920]">SOMETHING</span> TOGETHER.
            </h2>

            <p className="text-zinc-400 font-sans text-sm sm:text-base leading-relaxed mb-8">
              Whether you are an aspiring builder eager to contribute to our codebases, a sponsor interested in partnering for Technika / Hack Horizon, or an alumnus looking to mentor, we would love to connect.
            </p>

            {/* Contact details */}
            <div className="flex flex-col gap-4 mb-8">
              <a
                href={`mailto:${societyInfo.socialLinks.email}`}
                className="group p-4 rounded-2xl glass-panel border border-white/10 hover:border-[#E50920]/40 transition-all flex items-center gap-4 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl glass-panel border border-white/10 flex items-center justify-center text-[#E50920] group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Official Society Email
                  </div>
                  <div className="text-sm font-semibold text-white group-hover:text-[#E50920] transition-colors">
                    {societyInfo.socialLinks.email}
                  </div>
                </div>
              </a>

              <div className="p-4 rounded-2xl glass-panel border border-white/10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl glass-panel border border-white/10 flex items-center justify-center text-[#E50920]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Engineering Campus HQ
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Computer Science & Engineering Hub
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Link Badges */}
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">
                Connect on Social Networks
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href={societyInfo.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl glass-panel border border-white/10 hover:border-[#E50920]/40 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-2 group"
                >
                  <Github className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-[#E50920]" />
                </a>

                <a
                  href={societyInfo.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl glass-panel border border-white/10 hover:border-[#E50920]/40 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-2 group"
                >
                  <Linkedin className="w-4 h-4 text-zinc-400 group-hover:text-[#3B82F6]" />
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-[#E50920]" />
                </a>

                <a
                  href={societyInfo.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl glass-panel border border-white/10 hover:border-[#E50920]/40 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-2 group"
                >
                  <Instagram className="w-4 h-4 text-zinc-400 group-hover:text-[#E1306C]" />
                  <span>Instagram</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-[#E50920]" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Glassmorphism Interactive Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl glass-panel-elevated border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#E50920]/10 rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-xl sm:text-2xl font-bold font-display text-white mb-2">
                Send a Dispatch to CCS
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans mb-6">
                Fill in your details below and our leadership team will respond promptly.
              </p>

              {isSubmitted ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[#E50920]/20 border border-[#E50920]/40 flex items-center justify-center text-[#E50920] mb-4 animate-bounce">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold font-display text-white mb-2">
                    Transmission Received
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-sm font-sans">
                    Thank you for reaching out to Code & Compute Society. Our technical leads have received your dispatch.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Alex Rivera"
                        className="w-full px-4 py-3 rounded-xl glass-panel border border-white/10 text-sm font-sans text-white placeholder-zinc-400 focus:outline-none focus:border-[#E50920]/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. alex@university.edu"
                        className="w-full px-4 py-3 rounded-xl glass-panel border border-white/10 text-sm font-sans text-white placeholder-zinc-400 focus:outline-none focus:border-[#E50920]/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Inquiry Category
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl glass-panel border border-white/10 text-sm font-sans text-white bg-[#101012] focus:outline-none focus:border-[#E50920]/50 transition-colors cursor-pointer"
                    >
                      <option value="Student / Aspiring Member">Student / Aspiring Member</option>
                      <option value="Hackathon Sponsorship / Partner">Hackathon Sponsorship / Partner</option>
                      <option value="Speaker / Workshop Collaboration">Speaker / Workshop Collaboration</option>
                      <option value="Open-Source Project Inquiries">Open-Source Project Inquiries</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Your Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Share your goals, collaboration proposal, or questions with us..."
                      className="w-full px-4 py-3 rounded-xl glass-panel border border-white/10 text-sm font-sans text-white placeholder-zinc-400 focus:outline-none focus:border-[#E50920]/50 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 w-full py-3.5 rounded-xl font-semibold text-xs uppercase tracking-widest text-white bg-gradient-to-r from-[#E50920] to-[#B20718] hover:from-[#FF1E38] hover:to-[#E50920] transition-all duration-300 shadow-[0_0_20px_rgba(229,9,32,0.35)] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="font-mono text-xs">ENCRYPTING & TRANSMITTING...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

