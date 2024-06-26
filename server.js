require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const path = require('path');
const expressLayout = require('express-ejs-layouts');
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('express-flash');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const Emitter = require('events')

// Database connection
//const url = 'mongodb://localhost/pizza';

mongoose.connect(process.env.MONGO_CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const connection = mongoose.connection;

connection.on('error', (err) => {
    console.error('Connection error:', err);
});

connection.once('open', () => {
    console.log('Database connected...');
});

// Set template engine
app.use(expressLayout);
app.set('views', path.join(__dirname, '/resources/views'));
app.set('view engine', 'ejs');

// Session store configuration
const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_CONNECTION_URL,
    collectionName: 'sessions',
    autoRemove: 'interval',
    autoRemoveInterval: 10 // Removes expired sessions every 10 minutes
});
// Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)

// Session middleware
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Session lasts for 24 hours
}));
// Passport config 
const passportInit = require('./app/config/passport');
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());



// Global middleware
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.user = req.user; // Assuming req.user is used by Passport for user authentication
    next();
});

// Flash messages
app.use(flash());

// Assets
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// Routes
require('./routes/web')(app);
app.use((req, res) => {
    res.status(404).render('errors/404')
})
// Start server
const server = app.listen(PORT , () => {
    console.log(`Listening on port ${PORT}`)
})


// Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      socket.on('join', (orderId) => {
        socket.join(orderId)
      })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})
