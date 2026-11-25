const mongoose = require('mongoose');

const agentStepSchema = new mongoose.Schema({
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentRun',
    required: true,
    index: true
  },
  index: {
    type: Number,
    required: true
  },
  tool: {
    type: String,
    required: true
  },
  args: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  reason: {
    type: String,
    required: true
  },
  risk: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  command: {
    type: String,
    required: true
  },
  commandHash: {
    type: String,
    required: true
  },
  cwd: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PROPOSED', 'APPROVED', 'DENIED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT', 'EXPIRED'],
    default: 'PROPOSED',
    index: true
  },
  decidedAt: {
    type: Date,
    default: null
  },
  decisionNote: {
    type: String,
    default: ''
  },
  exitCode: {
    type: Number,
    default: null
  },
  outputTail: {
    type: String,
    default: ''
  },
  artifacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artifact'
  }],
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 mins TTL
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AgentStep', agentStepSchema);
