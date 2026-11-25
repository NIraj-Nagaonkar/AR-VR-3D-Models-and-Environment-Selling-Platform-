const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const agentRunSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    default: 'New 3D Agent Task'
  },
  status: {
    type: String,
    enum: ['RUNNING', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'RUNNING',
    index: true
  },
  messages: [messageSchema],
  stepCount: {
    type: Number,
    default: 0
  },
  currentStepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentStep',
    default: null
  },
  modelOutput: {
    glbUrl: String,
    imageUrl: String,
    unityProjectPath: String,
    summary: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AgentRun', agentRunSchema);
