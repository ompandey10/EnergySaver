const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Home',
    required: true,
  },
  kWh: {
    type: Number,
    required: [true, 'Please provide kWh reading'],
    min: [0, 'kWh cannot be negative'],
  },
  watts: {
    type: Number,
    min: [0, 'Watts cannot be negative'],
  },
  voltage: {
    type: Number,
    min: [0, 'Voltage cannot be negative'],
  },
  current: {
    type: Number,
    min: [0, 'Current cannot be negative'],
  },
  powerFactor: {
    type: Number,
    min: [0, 'Power factor cannot be negative'],
    max: [1, 'Power factor cannot exceed 1'],
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  isSimulated: {
    type: Boolean,
    default: true,
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
  },
}, {
  timestamps: true,
});

// Calculate cost before saving
readingSchema.pre('save', async function(next) {
  if (!this.cost) {
    const Home = mongoose.model('Home');
    const home = await Home.findById(this.home);
    if (home) {
      this.cost = this.kWh * home.electricityRate;
    }
  }
  next();
});

// Indexes for efficient queries
readingSchema.index({ device: 1, timestamp: -1 });
readingSchema.index({ home: 1, timestamp: -1 });
readingSchema.index({ timestamp: -1 });

// Static method to get aggregated readings for a home
readingSchema.statics.getHomeAggregation = async function(homeId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        home: new mongoose.Types.ObjectId(homeId),
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
        },
        totalKWh: { $sum: '$kWh' },
        totalCost: { $sum: '$cost' },
        avgWatts: { $avg: '$watts' },
        readingCount: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
    },
  ]);
};

// Static method to get device aggregation
readingSchema.statics.getDeviceAggregation = async function(deviceId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        device: new mongoose.Types.ObjectId(deviceId),
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
        },
        totalKWh: { $sum: '$kWh' },
        totalCost: { $sum: '$cost' },
        avgWatts: { $avg: '$watts' },
        maxWatts: { $max: '$watts' },
        minWatts: { $min: '$watts' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 },
    },
  ]);
};

module.exports = mongoose.model('Reading', readingSchema);
