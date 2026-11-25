const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/authenticate');
const {
  createRun,
  listRuns,
  getRunById,
  addMessage,
  submitDecision,
  cancelRunSession,
  streamArtifact,
  getAgentHealth
} = require('./agent.controller');

// All agent routes are restricted to authenticated administrators
router.use(authenticate, requireRole('admin'));

router.get('/health', getAgentHealth);
router.post('/runs', createRun);
router.get('/runs', listRuns);
router.get('/runs/:id', getRunById);
router.post('/runs/:id/messages', addMessage);
router.post('/runs/:id/steps/:stepId/decision', submitDecision);
router.post('/runs/:id/cancel', cancelRunSession);
router.get('/artifacts/:artifactId', streamArtifact);

module.exports = router;
