#!/usr/bin/env node
const { execFileSync } = require('child_process');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptForCredentials() {
  return new Promise((resolve) => {
    rl.question('Enter admin email: ', (email) => {
      rl.question('Enter admin password: ', (password) => {
        rl.close();
        resolve({ email, password });
      });
    });
  });
}

async function main() {
  try {
    console.log('Creating admin user...');
    const { email, password } = await promptForCredentials();

    // Build and run the TypeScript file
    const scriptPath = path.join(__dirname, '..', 'src', 'scripts', 'createAdmin.ts');
    const args = [
      '-r', 'tsconfig-paths/register',
      scriptPath,
      email,
      password
    ];

    execFileSync('ts-node', args, { stdio: 'inherit' });
    
    console.log('\nAdmin user created successfully!');
    console.log('You can now log in with these credentials at /login');
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }
}

main(); 