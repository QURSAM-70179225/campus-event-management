const { todayISO, addDays } = require('../utils/date');

/**
 * Realistic University of Lahore events. Dates are relative to the day the
 * seed runs, so the demo always has upcoming events (plus two past ones that
 * show up in registration history).
 */
function buildSampleEvents(today = todayISO()) {
  const d = (offset) => addDays(today, offset);
  return [
    {
      title: 'AI & Machine Learning in Industry Seminar',
      description:
        'Industry experts from Lahore\'s leading tech companies discuss how AI and machine learning are used in production today — from recommendation engines to computer vision in manufacturing. Includes a live Q&A session and networking with speakers. Open to students of all departments.',
      date: d(5), time: '10:00', location: 'Main Auditorium, Main Campus, Defence Road',
      category: 'Seminars', capacity: 250,
    },
    {
      title: 'Full-Stack Web Development Bootcamp',
      description:
        'A hands-on, two-session workshop covering React, Node.js, Express and REST APIs. Participants build and deploy a small project by the end of the day. Bring your own laptop with Node.js and VS Code installed. Basic HTML/CSS/JavaScript knowledge is recommended.',
      date: d(9), time: '09:30', location: 'Computer Lab 3, Faculty of Information Technology',
      category: 'Workshops', capacity: 40,
    },
    {
      title: 'Inter-Department Cricket Tournament 2026',
      description:
        'The annual inter-department T20 cricket championship. Departments compete in a knockout format across two weekends. Spectators welcome — register to secure a seat in the stands and enter the lucky draw for UOL merchandise.',
      date: d(12), time: '14:00', location: 'UOL Sports Complex, Main Campus',
      category: 'Sports', capacity: 300,
    },
    {
      title: 'UOL Hackathon: Code for Pakistan',
      description:
        'A 24-hour hackathon where teams of up to four build solutions for local challenges in education, health and climate. Mentors from industry will guide teams, and the top three projects win cash prizes and incubation support. Meals and refreshments are provided.',
      date: d(18), time: '09:00', location: 'Innovation & Incubation Center, Block D',
      category: 'Competitions', capacity: 120,
    },
    {
      title: 'International Conference on Emerging Technologies',
      description:
        'A two-day international conference featuring keynote talks, paper presentations and panel discussions on IoT, cybersecurity, cloud computing and sustainable engineering. Undergraduate students may attend sessions and the poster exhibition free of charge.',
      date: d(25), time: '09:00', location: 'Convention Center, Main Campus',
      category: 'Conferences', capacity: 500,
    },
    {
      title: 'Literary Society Annual Mushaira & Open Mic',
      description:
        'An evening of Urdu and English poetry, spoken word and storytelling hosted by the UOL Literary Society. Students can sign up on the night to perform their own work. Refreshments will be served after the event.',
      date: d(7), time: '17:30', location: 'Open Air Theatre, Main Campus',
      category: 'Student Society Activities', capacity: 150,
    },
    {
      title: 'Cybersecurity Essentials Workshop',
      description:
        'Learn the fundamentals of securing web applications: authentication, password hashing, common OWASP vulnerabilities and safe coding practices. Includes guided lab exercises on a sandboxed environment. Limited seats to keep the session hands-on.',
      date: d(14), time: '11:00', location: 'Networking Lab, Faculty of Information Technology',
      category: 'Workshops', capacity: 30,
    },
    {
      title: 'Career Pathways in Engineering Seminar',
      description:
        'Alumni working in software, electrical and civil engineering share their career journeys, interview tips and advice on internships. A CV clinic runs alongside the seminar where students can get one-to-one feedback.',
      date: d(3), time: '12:00', location: 'Lecture Theatre 1, Faculty of Engineering',
      category: 'Seminars', capacity: 180,
    },
    {
      title: 'Inter-University Debate Championship',
      description:
        'Teams from universities across Punjab debate current affairs and technology policy in British Parliamentary format. Audience members can vote for the best speaker award. Organised by the UOL Debating Society.',
      date: d(21), time: '10:30', location: 'Seminar Hall B, Main Campus',
      category: 'Competitions', capacity: 200,
    },
    {
      title: 'Futsal League Finals',
      description:
        'Cheer for your department in the final of the UOL Futsal League. The match is followed by the trophy ceremony and a friendly staff vs. students exhibition game.',
      date: d(16), time: '16:00', location: 'Indoor Sports Arena, UOL Sports Complex',
      category: 'Sports', capacity: 220,
    },
    {
      title: 'Welcome Week Society Fair',
      description:
        'Meet more than thirty student societies — from robotics and photography to dramatics and community service. Sign up for societies, enjoy live performances and food stalls, and find your community at UOL.',
      date: d(-10), time: '11:00', location: 'Central Lawn, Main Campus',
      category: 'Student Society Activities', capacity: 600,
    },
    {
      title: 'Research Methods for Undergraduates Seminar',
      description:
        'An introduction to literature reviews, research design and academic writing for undergraduate final-year projects, presented by the Office of Research, Innovation and Commercialization.',
      date: d(-4), time: '10:00', location: 'Lecture Theatre 2, Main Campus',
      category: 'Seminars', capacity: 160,
    },
  ];
}

module.exports = { buildSampleEvents };
