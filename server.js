const express=require('express');
const app=express();
const session=require("express-session");
const mongoDbSession=require("connect-mongodb-session")(session);
const mongoose=require('mongoose')
const mongoURI='mongodb://localhost:27017/sessions'
const User=require('./models/userModels')
const bcrypt=require('bcrypt')


//database connection
mongoose.connect(mongoURI)
.then(()=>{
    console.log("MongoDb Connected");
})
.catch((err)=>{
    console.log(err);
})

const store=new mongoDbSession({
    uri:mongoURI,
    collection:"mySessions"
})

//middleware
app.use(express.urlencoded({extended:false}))
//express session
app.use(session({
    secret:"My secret key",
    resave:true,  //resave the session id even it is not modified 
    saveUninitialized:false,
    rolling:true, //rolling true sets after each requesh the maxAge is added to the current time
    store:store,
    cookie:{
        maxAge:1000*60   //cookie expires in every 60 sec of inactivity
    }
}))


const isAuth=(req,res,next)=>{
    if(req.session.isAuth){
        next();
    }else{
        res.redirect('/api/login')
    }
}

//view engine
app.set('view engine','ejs');

//routes
app.get('/',(req,res)=>{
    res.status(200).render('home')
})

app.get('/api/login',(req,res)=>{
    res.render('login')
})

app.get('/api/signup',(req,res)=>{
    res.render('signup')
})

app.post('/api/login',async(req,res)=>{
   const {email,password}=req.body;
   try {
    const user=await User.findOne({email})
    if(!user){
       return res.redirect('/')
    }
     const isMatch=await bcrypt.compare(password,user.password);
     console.log(isMatch);
     if(!isMatch){
        return res.json({msg:"please enter correct password"})
     }
     req.session.isAuth=true
   res.redirect('/dashboard');
   } catch (error) {
    console.log(error);
   }
})

app.post('/api/signup',async(req,res)=>{
const {username,email,password}=req.body;
let user;
try {
     user=await User.findOne({email})
     if(user){
        return res.json({msg:"User already exist"})
     }
     const salt=await bcrypt.genSalt();
     const hashPassword=await bcrypt.hash(password,salt)
    user=await User.create({username,email,password:hashPassword})
    res.redirect('/')
} catch (error) {
    console.log(error);
}
})

app.get('/dashboard',isAuth,(req,res)=>{
 res.render('dashboard')
})

//logout
app.post('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err) throw err;
        else return res.redirect('/api/login')
    })
})

app.listen(3000,()=>{
    console.log("Listening on port 3000");
})