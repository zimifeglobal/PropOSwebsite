import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PropOS Enterprise API',
      version: '1.0.0',
      description:
        'Institutional-grade PropTech & Fintech REST API for real estate portfolio management, automated leasing, and financial reconciliation. Built for the UK market.',
      contact: { name: 'PropOS Enterprise', email: 'api@propos.enterprise' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://proposwebsite.onrender.com', description: 'Production (Render)' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Portfolio: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            currency: { type: 'string', example: 'GBP' },
            total_aum: { type: 'number' },
          },
        },
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            portfolio_id: { type: 'string' },
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                postcode: { type: 'string' },
              },
            },
            esg_score: { type: 'number', minimum: 0, maximum: 100 },
            total_value: { type: 'number' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            direction: { type: 'string', enum: ['in', 'out'] },
            reconciled: { type: 'boolean' },
            aml_flagged: { type: 'boolean' },
            bank_ref: { type: 'string' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & identity' },
      { name: 'Portfolios', description: 'Portfolio management' },
      { name: 'Assets', description: 'Property assets' },
      { name: 'Units', description: 'Individual units within assets' },
      { name: 'Tenancies', description: 'Lease and tenancy management' },
      { name: 'Finance', description: 'Transactions & reconciliation' },
      { name: 'Compliance', description: 'AML, GDPR, KYC, statutory alerts' },
      { name: 'Insurance', description: 'Insurance policies & quotes' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
