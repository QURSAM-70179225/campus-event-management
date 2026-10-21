import { Mic2, Laptop, Trophy, Medal, Presentation, Sparkles } from 'lucide-react';

/**
 * Visual identity for each event category. Colours are deliberately distinct
 * so students can scan a page of events by category at a glance.
 */
export const CATEGORY_META = {
  Seminars: {
    short: 'Seminar',
    icon: Mic2,
    from: '#1A2C6B',
    to: '#3B6FE0',
    text: 'text-[#2552B8]',
    soft: 'bg-[#E8EFFC]',
    blurb: 'Talks from industry leaders and faculty',
  },
  Workshops: {
    short: 'Workshop',
    icon: Laptop,
    from: '#0B4F57',
    to: '#14A38F',
    text: 'text-[#0B7A6C]',
    soft: 'bg-[#E2F5F1]',
    blurb: 'Hands-on sessions to build real skills',
  },
  Sports: {
    short: 'Sports',
    icon: Trophy,
    from: '#7A2E0E',
    to: '#E0732B',
    text: 'text-[#B5541A]',
    soft: 'bg-[#FDEEE3]',
    blurb: 'Tournaments, leagues and match days',
  },
  Competitions: {
    short: 'Competition',
    icon: Medal,
    from: '#6B1630',
    to: '#D6455D',
    text: 'text-[#B3304A]',
    soft: 'bg-[#FCE8EC]',
    blurb: 'Hackathons, debates and contests',
  },
  Conferences: {
    short: 'Conference',
    icon: Presentation,
    from: '#2A1A7A',
    to: '#6A4CF5',
    text: 'text-[#5536D6]',
    soft: 'bg-[#EFEBFF]',
    blurb: 'Research, panels and keynote sessions',
  },
  'Student Society Activities': {
    short: 'Society',
    icon: Sparkles,
    from: '#5E1556',
    to: '#C2399F',
    text: 'text-[#A0287F]',
    soft: 'bg-[#FBE8F5]',
    blurb: 'Clubs, fairs, performances and meetups',
  },
};

export const CATEGORIES = Object.keys(CATEGORY_META);

export const getCategoryMeta = (category) => CATEGORY_META[category] || CATEGORY_META.Seminars;
