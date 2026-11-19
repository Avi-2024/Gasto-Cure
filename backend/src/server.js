require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ClinixPulse™ SaaS API server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/v1/health`);
});
