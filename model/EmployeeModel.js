const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    unique: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String 
  },
  position: { 
    type: String, 
    required: true,
    enum: ['Mekanik', 'Admin', 'Supervisor']
  },
  salary: { 
    type: Number 
  },
  hireDate: { 
    type: Date, 
    default: Date.now 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Employee", employeeSchema);
