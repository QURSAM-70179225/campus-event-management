/**
 * Creates the first admin account (or promotes an existing user to admin).
 *
 * Interactive (recommended locally):
 *   npm run create-admin
 *
 * Non-interactive (e.g. a hosting provider's shell) — values come from env vars
 * that you set for this one command only, so no credentials live in the code:
 *   PowerShell:  $env:ADMIN_NAME="Your Name"; $env:ADMIN_EMAIL="you@uol.edu.pk"; $env:ADMIN_PASSWORD="..."; npm run create-admin
 *   bash:        ADMIN_NAME="Your Name" ADMIN_EMAIL=you@uol.edu.pk ADMIN_PASSWORD=... npm run create-admin
 */
const readline = require('readline');
const { initFromConfig, closeDatabase, getDb } = require('../database/db');
const UserModel = require('../models/userModel');
const { validateSignup, hasErrors } = require('../utils/validators');
const { hashPassword } = require('../utils/auth');

function ask(rl, question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    rl.muted = hidden;
    rl.mutedPrompt = question;
    rl.question(question, (answer) => {
      if (hidden) process.stdout.write('\n');
      rl.muted = false;
      resolve(hidden ? answer : answer.trim());
    });
  });
}

/** readline interface that hides typed characters (like `sudo`) while `muted`. */
function createPrompt() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = function writeToOutput(text) {
    if (!rl.muted || text === rl.mutedPrompt) rl.output.write(text);
  };
  return rl;
}

async function collectInput() {
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    return {
      name: process.env.ADMIN_NAME || 'Administrator',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      confirmPassword: process.env.ADMIN_PASSWORD,
    };
  }
  const rl = createPrompt();
  console.log('\n🔐 Create an administrator account\n');
  const name = await ask(rl, 'Full name: ');
  const email = await ask(rl, 'Email: ');
  const password = await ask(rl, 'Password (min 8 chars, letters + numbers, input hidden): ', { hidden: true });
  const confirmPassword = await ask(rl, 'Confirm password: ', { hidden: true });
  rl.close();
  return { name, email, password, confirmPassword };
}

async function main() {
  await initFromConfig();
  console.log(`📦 Using ${getDb().describe()}`);
  const input = await collectInput();
  const { value, errors } = validateSignup(input);

  const existing = await UserModel.findByEmailWithHash(value.email || '');
  if (existing) {
    // Promote an existing account instead of creating a duplicate.
    if (errors.email) throw new Error(errors.email);
    await UserModel.setRole(existing.id, 'admin');
    if (input.password && !errors.password && !errors.confirmPassword) {
      await UserModel.updatePassword(existing.id, await hashPassword(value.password));
    }
    console.log(`✅ ${existing.email} is now an admin.`);
    return;
  }

  if (hasErrors(errors)) {
    throw new Error(Object.values(errors).join(' '));
  }
  const user = await UserModel.create({
    name: value.name,
    email: value.email,
    passwordHash: await hashPassword(value.password),
    role: 'admin',
  });
  console.log(`✅ Admin account created for ${user.email}. Log in at the frontend /login page.`);
}

main()
  .catch((err) => {
    console.error(`❌ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
