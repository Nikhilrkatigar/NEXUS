(async () => {
  const response = await fetch('http://localhost:4000/api/public/site');
  const data = await response.json();
  const s = data.settings;
  
  let EVENTS = [];
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

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderRulesContent(event) {
    const rules = event && event.rules ? event.rules : {};
    const sections = Array.isArray(rules.sections) ? rules.sections : [];
    const title = escapeHtml(rules.title || `${event.name} Rules & Regulations`);

    if (!sections.length) {
      return `<h2>${title}</h2><p>No rules added yet.</p>`;
    }

    return `
      <h2>${title}</h2>
      ${sections.map((section) => {
        const heading = escapeHtml(section.heading || 'Rules');
        const items = Array.isArray(section.rules) ? section.rules.filter(Boolean) : [];
        const listMarkup = items.length
          ? `<ul>${items.map((rule) => `<li>${escapeHtml(rule)}</li>`).join('')}</ul>`
          : '<p>No rules added for this section yet.</p>';
        return `<h3>${heading}</h3>${listMarkup}`;
      }).join('')}
    `;
  }

  const firstEvent = EVENTS[0];
  console.log('firstEvent:', firstEvent.id);
  console.log('Rendering rules HTML for first event...');
  try {
    const html = renderRulesContent(firstEvent);
    console.log('HTML Output preview:', html.substring(0, 100));
  } catch (err) {
    console.error('Error rendering:', err);
  }
})();
