#!/usr/bin/env node
// send_random_feedback.js
// Simple Node script to POST randomized feedback JSON to a backend endpoint.
// Usage: node scripts/send_random_feedback.js --url http://localhost:3000/feedback --count 50 --delay 200 --concurrency 2

const http = require('http');
const https = require('https');
const { URL } = require('url');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i+1];
      if (!next || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

function randPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function makeRandomFeedback(){
  const names = ['Alice Park','Bob Smith','Carla Jones','Daniel Lee','Eva Kim','Frank Zhao','Grace Lin','Hassan Ali'];
  const courses = ['Math 101','History 201','CS 301','Physics 102','Biology 110'];
  const commentsSamples = [
    'Great course! Learned a lot and enjoyed the projects.',
    'Could use more real-world examples, but instructor was helpful.',
    'Pace was quick but manageable; more office hours would help.',
    'I liked the labs and exercises. Thanks!',
    'The course content was clear and well-structured.'
  ];

  const name = randPick(names);
  const course = randPick(courses);
  const rating = Math.floor(Math.random()*5) + 1;
  const comments = randPick(commentsSamples);

  // Simulate file metadata (no binary upload in this script)
  const includeFile = Math.random() < 0.3; // 30% include file metadata
  const file = includeFile ? { name: 'screenshot.png', size: 123456, type: 'image/png' } : null;

  return { name, course, rating, comments, file, createdAt: new Date().toISOString() };
}

function sendJson(urlString, obj){
  return new Promise((resolve, reject)=>{
    const url = new URL(urlString);
    const body = JSON.stringify(obj);
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + (url.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body, 'utf8')
      }
    };

    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(opts, (res)=>{
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', d=>buf += d);
      res.on('end', ()=>{
        resolve({ statusCode: res.statusCode, body: buf });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run(){
  const args = parseArgs();
  const url = args.url || 'http://localhost:3000/feedback';
  const count = parseInt(args.count || '10', 10);
  const delay = parseInt(args.delay || '200', 10);
  const concurrency = Math.max(1, parseInt(args.concurrency || '1', 10));

  console.log(`Sending ${count} randomized feedback submissions to ${url} (concurrency=${concurrency}, delay=${delay}ms)`);

  let inFlight = 0;
  let sent = 0;
  let succeeded = 0;
  let failed = 0;

  const queue = [];

  function scheduleOne(i){
    return new Promise((resolve)=>{
      const payload = makeRandomFeedback();
      setTimeout(async ()=>{
        try{
          const res = await sendJson(url, payload);
          succeeded++;
          console.log(`#${i+1} -> ${res.statusCode} ${res.body ? (' ' + res.body.slice(0,120)) : ''}`);
        }catch(err){
          failed++;
          console.error(`#${i+1} -> ERROR`, err.message || err);
        }finally{
          sent++;
          resolve();
        }
      }, delay * i);
    });
  }

  // simple concurrency control: start up to concurrency number of parallel chains
  const tasks = [];
  for(let i=0;i<count;i++){
    tasks.push(scheduleOne(i));
    // throttle concurrency - if too many pending, wait for a batch to finish
    if(tasks.length >= 1000){ // avoid unbounded growth
      await Promise.all(tasks);
      tasks.length = 0;
    }
  }

  await Promise.all(tasks);

  console.log(`Done: sent=${sent}, succeeded=${succeeded}, failed=${failed}`);
}

run().catch(err=>{
  console.error('Script failed:', err && err.stack || err);
  process.exit(1);
});
