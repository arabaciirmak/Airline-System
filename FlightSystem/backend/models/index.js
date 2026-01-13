const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Flight Model
const Flight = sequelize.define('Flight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  flightCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  fromCity: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  toCity: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  flightDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in minutes'
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  availableSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  isDirect: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'flights',
  timestamps: true
});

// Member Model (Miles&Smiles)
const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  memberNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  cognitoUserId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  middleName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  milesPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'members',
  timestamps: true
});

// Booking Model
const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookingNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  flightId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Flight,
      key: 'id'
    }
  },
  memberId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Member,
      key: 'id'
    }
  },
  cognitoUserId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  passengerFirstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  passengerMiddleName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  passengerLastName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  passengerDateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  numberOfPassengers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paidWithMiles: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  milesUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
    defaultValue: 'confirmed'
  },
  flightCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'bookings',
  timestamps: true
});

// MilesTransaction Model
const MilesTransaction = sequelize.define('MilesTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  memberId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Member,
      key: 'id'
    }
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Booking,
      key: 'id'
    }
  },
  miles: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transactionType: {
    type: DataTypes.ENUM('earned', 'used', 'external'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'miles_transactions',
  timestamps: true
});

// Define relationships
Flight.hasMany(Booking, { foreignKey: 'flightId', as: 'Bookings' });
Booking.belongsTo(Flight, { foreignKey: 'flightId', as: 'Flight' });

Member.hasMany(Booking, { foreignKey: 'memberId', as: 'Bookings' });
Booking.belongsTo(Member, { foreignKey: 'memberId', as: 'Member' });

Member.hasMany(MilesTransaction, { foreignKey: 'memberId', as: 'MilesTransactions' });
MilesTransaction.belongsTo(Member, { foreignKey: 'memberId', as: 'Member' });

Booking.hasMany(MilesTransaction, { foreignKey: 'bookingId', as: 'MilesTransactions' });
MilesTransaction.belongsTo(Booking, { foreignKey: 'bookingId', as: 'Booking' });

module.exports = {
  Flight,
  Member,
  Booking,
  MilesTransaction,
  sequelize
};
