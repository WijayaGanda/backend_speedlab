const User = require("../model/UserModel");

// Get all users (untuk admin)
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;
    
    let query = {};
    if (role) {
      query.role = role;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data user", 
      error: err.message 
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil data user", 
      error: error.message 
    });
  }
};

// Create user (untuk admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, role, avatar } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Email sudah terdaftar" 
      });
    }

    const newUser = new User({
      name,
      email,
      password,
      phone,
      address,
      role: role || 'pelanggan',
      avatar
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User berhasil ditambahkan",
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menambahkan user", 
      error: error.message 
    });
  }
};

// Update user (untuk admin)
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, address, role, avatar, isActive } = req.body;

    // Cek jika email diubah dan sudah ada yang pakai
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User tidak ditemukan" 
      });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ 
          success: false,
          message: "Email sudah terdaftar" 
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        email, 
        phone, 
        address, 
        role, 
        avatar, 
        isActive,
        updatedAt: Date.now() 
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: "User berhasil diupdate",
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error update user", 
      error: error.message 
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User tidak ditemukan" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "User berhasil dihapus" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error menghapus user", 
      error: error.message 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};