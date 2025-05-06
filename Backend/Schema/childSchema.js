const mongoose=require("mongoose")

const childrenSchema = new mongoose.Schema({
    randomId: {
      type: String,
      required: function () {
        return this.role === 'Children'; 
      },
      unique: true,
    },
    childPassword: {
      type: String,
      required: function () {
        return this.role === 'Children'; 
      },
      minlength: 6,
    },
    name: { 
      type: String,
      required: true,
    },
  }, {
    timestamps: true,
  });
 
const Children = mongoose.model('Children', childrenSchema);

module.exports= Children