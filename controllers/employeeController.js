const Employee = require("../model/EmployeeModel");

// Create - Tambah karyawan
const createEmployee = async (req, res) => {
  try {
    const { name, email, phone, address, position, salary, hireDate } = req.body;

    // Cek apakah email sudah terdaftar
    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: "Email sudah terdaftar" 
      });
    }

    const employee = new Employee({
      name,
      email,
      phone,
      address,
      position,
      salary,
      hireDate: hireDate || Date.now()
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: "Karyawan berhasil ditambahkan",
      data: employee
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menambahkan karyawan", 
      error: error.message 
    });
  }
};

// Read - Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const { isActive, position } = req.query;
    
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (position) {
      query.position = position;
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data karyawan", 
      error: error.message 
    });
  }
};

// Read - Get single employee
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "Karyawan tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data karyawan", 
      error: error.message 
    });
  }
};

// Update - Update employee
const updateEmployee = async (req, res) => {
  try {
    const { name, email, phone, address, position, salary, isActive } = req.body;

    // Cek jika email diubah dan sudah ada yang pakai
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "Karyawan tidak ditemukan" 
      });
    }

    if (email && email !== employee.email) {
      const existing = await Employee.findOne({ email });
      if (existing) {
        return res.status(400).json({ 
          success: false,
          message: "Email sudah terdaftar" 
        });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        email, 
        phone, 
        address, 
        position, 
        salary, 
        isActive,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Data karyawan berhasil diupdate",
      data: updatedEmployee
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error update karyawan", 
      error: error.message 
    });
  }
};

// Delete - Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "Karyawan tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Karyawan berhasil dihapus"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menghapus karyawan", 
      error: error.message 
    });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
