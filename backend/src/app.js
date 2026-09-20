const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const { router: authRoutes } = require('./routes/auth.routes');
const metaRoutes = require('./routes/meta.routes');
const providersRoutes = require('./routes/providers.routes');
const profileRoutes = require('./routes/profile.routes');
const servicesRoutes = require('./routes/services.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const requestsRoutes = require('./routes/requests.routes');
const offersRoutes = require('./routes/offers.routes');
const projectsRoutes = require('./routes/projects.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const savedRoutes = require('./routes/saved.routes');
const conversationsRoutes = require('./routes/conversations.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadsRoutes = require('./routes/uploads.routes');

const app = express();

app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api', metaRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/offers', offersRoutes); // includes POST /api/offers/requests/:requestId/offers
app.use('/api/projects', projectsRoutes);
app.use('/api', reviewsRoutes); // /api/projects/:id/reviews, /api/users/:id/reviews
app.use('/api/saved', savedRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
