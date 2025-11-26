const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  day_of_week: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  time_slot: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  teacher_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  max_students: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20
  }
}, {
  tableName: 'classes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Class;
