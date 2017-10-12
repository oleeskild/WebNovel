const passport = require('passport'),
  User = require('../models/user'),
  JwtStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt,
  LocalStrategy = require('passport-local')
auth = require('../routes/api/controllers/authentication')

const localOptions = {usernameField: 'email'}

// Setting up local login strategy
const localLogin = new LocalStrategy(localOptions, function (email, password, done) {
  User.findOne({email: email}, function (err, user) {
    if (err) {
      return done(err)
    }
    if (!user) {
      return done(null, false, {error: 'Your login details could not be verified. Please try again.'})
    }

    user.comparePassword(password, function (err, isMatch) {
      if (err) {
        return done(err)
      }
      if (!isMatch) {
        return done(null, false, {error: "Your login details could not be verified. Please try again."})
      }

      return done(null, user)
    })
  })
})

const jwtOptions = {
  // Telling Passport to check authorization headers for JWT
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  // Telling Passport where to find the secret
  secretOrKey: process.env.SECRET
}

// Setting up JWT login strategy
const jwtLogin = new JwtStrategy(jwtOptions, function (payload, done) {
  /*User.findById(payload._id, function(err, user) {
    if (err) { return done(err, false); }

    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  });*/
  /*console.log(payload);
  let secSinceSigned = ((new Date().getTime()/1000) - payload.iat);
  if(secSinceSigned > 2){
    let user = auth.setUserInfo(payload);
    auth.generateToken(user);
  }*/
  if (payload._id) {
    done(null, payload)
  } else {
    done(null, false)
  }
})

passport.use(jwtLogin)
passport.use(localLogin)
