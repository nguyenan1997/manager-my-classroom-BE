const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Parent = sequelize.define('Parent', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true // Allow null initially, will be set when parent registers
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false, // Always assigned to a staff/admin
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'parents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Parent;
