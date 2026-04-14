#!/usr/bin/env node
/**
 * Integration test for registration endpoint
 */

const http = require('http');

async function testRegistration() {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      college: "Global College Of Management, IT & Commerce",
      email: "test@example.com",
      teamName: "Test Team",
      event: "NEXUS_TEAM",
      faculty: "Coordinator",
      facultyPhone: "+918197773999",
      address: "Test Address",
      participants: [
        { name: "P1", phone: "+919876543210", department: "PEOPLE PULSE", isTeamLeader: true },
        { name: "P2", phone: "+919876543210", department: "PEOPLE PULSE" },
        { name: "P3", phone: "+919876543210", department: "BRAND BLITZ" },
        { name: "P4", phone: "+919876543210", department: "BRAND BLITZ" },
        { name: "P5", phone: "+919876543210", department: "FINANCE FRONTIER" }
      ]
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/public/registrations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    console.log('Testing registration endpoint...\n');
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2));
          
          if (res.statusCode === 201) {
            console.log('\n✓ Registration successful!');
          } else if (json.message && json.message.includes('Invalid team composition')) {
            console.log('\n✗ Registration failed - department mapping issue:');
            console.log('  Error:', json.message);
          }
        } catch (e) {
          console.log('Raw Response:', data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('Connection error - server not running:', e.message);
      console.log('\nTo test the fix:');
      console.log('1. Start the server: npm start');
      console.log('2. Run this test: node test_registration.js');
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

testRegistration();
