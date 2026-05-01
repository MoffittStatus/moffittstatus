require('dotenv').config()

const express = require("express")
const app=express()

const jwt=require("jsonwebtoken")

app.use(express.json())


let refreshTokens=[]

posts=[
    {
        username:"pain",
        title:"post1"
    },
    {
        username:"pin1",
        title:"post2"
    }
]
app.delete('/logout',(req,res)=>{
    refreshTokens=refreshTokens.filter(token=>token!==req.body.token)
    res.sendStatus(204)
})

app.post("/login",(req,res)=>{
    //Check password or something to authenticate
    const username=req.body.username
    const user ={name:username}
    const accessToken=generateAccessToken(user)
    const refreshToken=jwt.sign(user,process.env.REFRESH_TOKEN_SECRET,{expiresIn:"15d"})
    refreshTokens.push(refreshToken)
    res.json({accessToken: accessToken,refreshToken:refreshToken})
})

//Get Access Token from Sending Refresh Token
app.post('/token',(req,res)=>{
    const refreshToken=req.body.token
    if (refreshToken==null) return res.sendStatus(401)
    if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
    jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,(err,user)=>{
        if(err) return res.sendStatus(403)
        const accessToken=generateAccessToken({name:user.name})
        res.json({accessToken:accessToken})
    })
})


app.get("/posts",authenticateToken,(req,res)=>{
    res.json(posts.filter(posts=>posts.username===req.user.name))
})

// Generte an Access Token
function generateAccessToken(user){
    return jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"})
}


// Authenticate the Token that is passed in the header by frontend(middleware)
function authenticateToken(req,res,next){
    const authHeader=req.headers["authorization"]
    const token=authHeader && authHeader.split(' ')[1]
    if(token == null) return res.sendStatus(401)

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) return res.sendStatus(403)
        req.user=user
        next()
    })
}

app.listen(4000)