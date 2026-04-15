#!/usr/bin/env node
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./server/models/User');
const Settings = require('./server/models/Settings');

async function fixJudges() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Get events from settings
    const settings = await Settings.findOne({ key: 'default' });
    const events = settings?.values?.events || [];
    
    if (events.length === 0) {
      console.log('No events found in settings');
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${events.length} events:`, events.map(e => `${e.name} (${e.id})`).join(', '));

    // Find judges without assigned events
    const judges = await User.find({ role: 'judge', assignedEvent: { $in: [null, ''] } });
    console.log(`Found ${judges.length} judges without assigned events`);

    if (judges.length === 0) {
      console.log('All judges already have assigned events!');
      await mongoose.disconnect();
      return;
    }

    // Assign first event to judges who don't have one
    const firstEventId = String(events[0].id);
    console.log(`Assigning first event (${events[0].name}) to judges...`);

    const result = await User.updateMany(
      { role: 'judge', assignedEvent: { $in: [null, ''] } },
      { assignedEvent: firstEventId }
    );

    console.log(`Updated ${result.modifiedCount} judges`);
    console.log('Done!');
    
    // Show updated judges
    const updated = await User.find({ role: 'judge' });
    console.log('\nUpdated judges:');
    updated.forEach(j => {
      const event = events.find(e => String(e.id) === String(j.assignedEvent));
      console.log(`  - ${j.name} (${j.username}): ${event?.name || j.assignedEvent}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixJudges();
