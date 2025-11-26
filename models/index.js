const sequelize = require('../config/database');
const User = require('./User');
const Parent = require('./Parent');
const Student = require('./Student');
const Class = require('./Class');
const Subscription = require('./Subscription');
const ClassRegistration = require('./ClassRegistration');

// Define associations
User.hasMany(Parent, { foreignKey: 'created_by', onDelete: 'RESTRICT' });
Parent.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Class, { foreignKey: 'created_by', onDelete: 'RESTRICT' });
Class.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Parent.hasMany(Student, { foreignKey: 'parent_id', onDelete: 'CASCADE' });
Student.belongsTo(Parent, { foreignKey: 'parent_id' });

Student.hasMany(Subscription, { foreignKey: 'student_id', onDelete: 'CASCADE' });
Subscription.belongsTo(Student, { foreignKey: 'student_id' });

Student.belongsToMany(Class, { through: ClassRegistration, foreignKey: 'student_id' });
Class.belongsToMany(Student, { through: ClassRegistration, foreignKey: 'class_id' });

// Additional associations for ClassRegistration
ClassRegistration.belongsTo(Class, { foreignKey: 'class_id' });
ClassRegistration.belongsTo(Student, { foreignKey: 'student_id' });
Class.hasMany(ClassRegistration, { foreignKey: 'class_id' });
Student.hasMany(ClassRegistration, { foreignKey: 'student_id' });

// Sync database (create tables if they don't exist)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Parent,
  Student,
  Class,
  Subscription,
  ClassRegistration,
  syncDatabase
};
