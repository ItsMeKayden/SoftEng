import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  email: {  // Changed from userId to email
    type: String,
    required: true,
    index: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  hazards: {
    type: [String],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const SubmissionModel = mongoose.model('Submission', submissionSchema);
export default SubmissionModel;