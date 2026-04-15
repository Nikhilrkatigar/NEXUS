// Test script - run this in browser DevTools Console
(async () => {
  try {
    const token = sessionStorage.getItem('nexus_token');
    if (!token) {
      console.log('❌ No token - not logged in');
      return;
    }

    console.log('📡 Fetching users from API...');
    const response = await fetch('/api/cms/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    console.log('✅ API Response:', data);

    if (data.users) {
      console.log(`\n📊 Total users: ${data.users.length}`);
      
      const judges = data.users.filter(u => u.role === 'judge');
      console.log(`\n🏅 Judges (${judges.length}):`);
      
      judges.forEach((judge, i) => {
        console.log(`  ${i+1}. ${judge.name} (${judge.username})`);
        console.log(`     - assignedEvent: ${judge.assignedEvent || '❌ MISSING'}`);
      });

      if (judges.every(j => j.assignedEvent)) {
        console.log('\n✅ All judges have assignedEvent!');
      } else {
        console.log('\n❌ Some judges are missing assignedEvent');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
