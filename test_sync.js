(async () => {
  try {
    const response = await fetch('http://localhost:4000/api/public/site');
    const data = await response.json();
    const s = data.settings || {};
    const tl = data.timeline || [];

    let EVENTS = [];
    let TEAM_MEMBERS = [];
    let TIMELINE = [];

    if (Array.isArray(s.events)) {
      EVENTS.splice(0, EVENTS.length, ...s.events.map((event) => ({
        ...event,
        deptColor: event.deptColor || '#f5a623',
        badgeBg: event.badgeBg || 'rgba(245,166,35,0.1)',
        badgeColor: event.badgeColor || '#f5a623',
        imageUrl: event.imageUrl || '',
        rounds: (event.rounds || []).map((round) => ({
          ...round,
          color: round.color || '#f5a623'
        })),
        rules: {
          title: event.rules?.title || `${event.name} - Rules & Regulations`,
          sections: event.rules?.sections || []
        }
      })));
      console.log('Events parsed', EVENTS.length);
    }

    if (Array.isArray(s.teamMembers)) {
      TEAM_MEMBERS.splice(0, TEAM_MEMBERS.length, ...s.teamMembers.map((member) => ({
        ...member,
        initial: member.initial || (member.name || '').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?',
        bg: member.bg || 'linear-gradient(135deg,#f5a623,#e63c5c)',
        deptColor: member.deptColor || '#f5a623',
        imageUrl: member.imageUrl || ''
      })));
      console.log('Teams parsed', TEAM_MEMBERS.length);
    }

    if(tl && tl.length) {
      TIMELINE.splice(0, TIMELINE.length, ...tl.map(item => ({
        time: item.time,
        title: item.title,
        desc: item.desc,
        color: item.color
      })));
      console.log('Timeline parsed', TIMELINE.length);
    }

    console.log('Completed successfully!');
  } catch (err) {
    console.error('FAILED!', err);
  }
})();
