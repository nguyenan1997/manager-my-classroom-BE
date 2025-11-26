const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassRegistration = sequelize.define('ClassRegistration', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id'
    },
    unique: 'unique_student_class'
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    },
    unique: 'unique_student_class'
  }
}, {
  tableName: 'class_registrations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'class_id']
    }
  ]
});

module.exports = ClassRegistration;
