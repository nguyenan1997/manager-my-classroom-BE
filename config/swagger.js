const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PV LMS Backend API',
      version: '1.0.0',
      description: 'API documentation for Student-Parent Management System with Classes and Subscriptions',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'admin@example.com' },
            role: { type: 'string', enum: ['admin', 'staff'], example: 'admin' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Parent: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Nguyễn Văn A' },
            phone: { type: 'string', example: '0123456789' },
            email: { type: 'string', format: 'email', example: 'parent@example.com' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            parent_id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Nguyễn Văn B' },
            dob: { type: 'string', format: 'date', example: '2010-05-15' },
            gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
            current_grade: { type: 'string', example: '5' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Class: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Lớp Toán 5' },
            subject: { type: 'string', example: 'Toán' },
            day_of_week: { type: 'string', example: 'Monday' },
            time_slot: { type: 'string', example: '18:00-19:30' },
            teacher_name: { type: 'string', example: 'Cô Lan' },
            max_students: { type: 'integer', example: 20 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            student_id: { type: 'integer', example: 1 },
            package_name: { type: 'string', example: 'Gói 20 buổi' },
            start_date: { type: 'string', format: 'date', example: '2024-01-01' },
            end_date: { type: 'string', format: 'date', example: '2024-06-30' },
            total_sessions: { type: 'integer', example: 20 },
            used_sessions: { type: 'integer', example: 5 },
            remaining_sessions: { type: 'integer', example: 15 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success message' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

