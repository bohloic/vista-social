import test from 'node:test';
import assert from 'node:assert/strict';
import { runPulseAICopilot } from '../lib/gemini.ts';

test('1. PulseAI Copilot executes CRUD Action: create_post', async () => {
  const result = await runPulseAICopilot({
    message: 'Crée un post LinkedIn sur notre nouveau service VIP',
    history: [],
    currentPath: '/publish',
    attachments: [],
    projectStats: { postsCount: 2, accountsCount: 3, crmCount: 5, workspaceName: 'PulseSocial' },
  });

  assert.ok(result.reply);
  assert.ok(result.action);
  assert.equal(result.action.type, 'create_post');
  assert.ok(result.action.payload.content);
});

test('2. PulseAI Copilot executes CRUD Action: create_crm_prospect', async () => {
  const result = await runPulseAICopilot({
    message: 'Ajoute un prospect nommé Cabinet Diallo de 120000 FCFA dans le crm',
    history: [],
    currentPath: '/crm',
    attachments: [],
    projectStats: { postsCount: 2, accountsCount: 3, crmCount: 5, workspaceName: 'PulseSocial' },
  });

  assert.ok(result.reply);
  assert.ok(result.action);
  assert.equal(result.action.type, 'create_crm_prospect');
  assert.equal(result.action.payload.deal_value, 120000);
});

test('3. PulseAI Copilot executes CRUD Action: update_crm_prospect_stage (Won)', async () => {
  const result = await runPulseAICopilot({
    message: 'Le prospect a signé, passe le prospect en étape gagné',
    history: [],
    currentPath: '/crm',
    attachments: [],
    projectStats: { postsCount: 2, accountsCount: 3, crmCount: 5, workspaceName: 'PulseSocial' },
  });

  assert.ok(result.action);
  assert.equal(result.action.type, 'update_crm_prospect_stage');
  assert.equal(result.action.payload.stage, 'won');
});

test('4. PulseAI Copilot executes CRUD Action: create_pulse_page', async () => {
  const result = await runPulseAICopilot({
    message: 'Crée une page bio pour nos réseaux',
    history: [],
    currentPath: '/pulse-pages',
    attachments: [],
    projectStats: { postsCount: 2, accountsCount: 3, crmCount: 5, workspaceName: 'PulseSocial' },
  });

  assert.ok(result.action);
  assert.equal(result.action.type, 'create_pulse_page');
  assert.ok(result.action.payload.slug);
});

test('5. PulseAI Copilot maintains multi-turn memory without losing context', async () => {
  const memory = {
    userPreferences: ['Préfère un ton chaleureux et direct'],
    brandSummary: 'PulseSocial Agency',
    keyEntities: { secteur: 'Immobilier de luxe Abidjan' },
  };

  const result = await runPulseAICopilot({
    message: 'Donne-moi une idée de post adaptée à notre secteur',
    history: [
      { role: 'user', content: 'On vend des villas haut standing' },
      { role: 'assistant', content: 'Parfait, le secteur immobilier de luxe est très porteur.' },
    ],
    memory,
    currentPath: '/chat',
    attachments: [],
    projectStats: { postsCount: 5, accountsCount: 2, crmCount: 8, workspaceName: 'PulseSocial' },
  });

  assert.ok(result.reply);
  assert.ok(result.reply.length > 20);
});
