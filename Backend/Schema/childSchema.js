const mongoose=require("mongoose")

const childrenSchema = new mongoose.Schema({
    randomId: {
      type: String,
      required: true,
      unique: true,
    },
    childPassword: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: { 
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: false,
      min: 1,
    },
    gender: {
      type: String,
      required: false,
      enum: ['Male', 'Female', 'Other','male', 'female', 'other','-'],
      default: '-',
    },
  }, {
    timestamps: true,
  });
 
const Children = mongoose.model('Children', childrenSchema);

module.exports= Children