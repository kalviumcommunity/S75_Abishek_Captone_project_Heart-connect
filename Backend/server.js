const express=require("express")
const app=express()
app.use(express.json())
const PORT=4001




app.listen(PORT,(req,res)=>{
    console.log(`Server is running on http://localhost:${PORT}`)
})