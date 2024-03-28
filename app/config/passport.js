const LocalStrategy = require('passport-local').Strategy
const User = require('../models/user')
const bcrypt =require('bcrypt')

function init(passport){
passport.use(new LocalStrategy({usernameField:'email' },async(email,password,done)=>{
    //Login's Logic
    //Check if email exists?
 const user = await User.findOne({ email:email})
 if(!user){
    return done(null,false,{message: 'No user with this email exists'})
 }
 bcrypt.compare(password, user.password).then(match=>{
    if(match){
        return done(null,user,{message: 'Logged In Successfully'})
    }
    return done(null,false,{message: 'Wrong Username or password'})
 }).catch(err=>{
    return done(null,false,{message: 'Something went wrong'})
 })
}))

passport.serializeUser((user,done)=>{
  done(null,user._id)
})

passport.deserializeUser((id, done) => {
    User.findById(id).exec()
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            done(err);
        });
});


}

module.exports = init

