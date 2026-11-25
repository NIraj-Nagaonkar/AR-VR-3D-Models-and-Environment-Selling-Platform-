const mongoose = require('mongoose');

const artifactSchema = new mongoose.Schema({
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentRun',
    required: true,
    index: true
  },
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentStep',
    default: null
  },
  kind: {
    type: String,
    enum: ['manifest', 'glb', 'image', 'log', 'unityAsset'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    default: 'application/octet-stream'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Artifact', artifactSchema);
