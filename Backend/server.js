const express=require("express")
const app=express()
app.use(express.json())
const PORT=4001
const mongoose=require("mongoose")
require("dotenv").config()
const parentRoutes=require("./routes/parent")
const childRoutes=require("./routes/child")

const uri=process.env.uri
app.use("/",parentRoutes)
app.use("/",childRoutes)
mongoose.connect(uri)
.then(()=>{
    console.log("successfully connected")
})
.catch((err)=>{
    console.log("Error in connecting")
})

app.listen(PORT,(req,res)=>{
    console.log(`Server is running on http://localhost:${PORT}`)
})