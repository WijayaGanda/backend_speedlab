const User = require("../model/UserModel");
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const client = new OAuth2Client("220972392486-kf83vi2vioc9n89nps3p2evdire1rotn.apps.googleusercontent.com");

// Register
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Email sudah terdaftar" 
      });
    }

    // Buat user baru (password plain text - di production sebaiknya di-hash)
    const newUser = new User({
      name,
      email,
      password, // Idealnya gunakan bcrypt untuk hash password
      phone,
      address,
      role: role || 'pelanggan'
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          address: newUser.address,
          role: newUser.role,
          avatar: newUser.avatar
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error saat registrasi", 
      error: error.message 
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari user berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Email atau password salah" 
      });
    }

    // Cek password (plain text - di production gunakan bcrypt.compare)
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false,
        message: "Email atau password salah" 
      });
    }

    // Cek apakah user aktif
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: "Akun tidak aktif" 
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error saat login", 
      error: error.message 
    });
  }
};

// Google Login
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body; // Token ID dari client (Flutter/Frontend)

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token Google diperlukan"
      });
    }

    // Verifikasi token Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "220972392486-kf83vi2vioc9n89nps3p2evdire1rotn.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Cari user berdasarkan email atau googleId
    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      // Jika user belum ada, buat user baru
      user = new User({
        name,
        email,
        googleId,
        avatar: picture,
        role: 'pelanggan', // Default role
        isActive: true
      });
      await user.save();
    } else {
      // Jika user sudah ada, update googleId dan avatar jika belum ada
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        updated = true;
      }
      if (updated) await user.save();
    }

     // Cek apakah user aktif
     if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: "Akun tidak aktif" 
      });
    }

    // Generate token JWT aplikasi sendiri
    const appToken = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: "Login Google berhasil",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          avatar: user.avatar
        },
        token: appToken
      }
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal verifikasi dengan Google",
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address,
        role: req.user.role,
        avatar: req.user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error mengambil profile", 
      error: error.message 
    });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        name, 
        phone, 
        address, 
        avatar,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile berhasil diupdate",
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error update profile", 
      error: error.message 
    });
  }
};

// Forgot Password - Generate reset token
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email diperlukan" 
      });
    }

    // Cari user berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Email tidak ditemukan" 
      });
    }

    // Generate OTP (6 digit angka)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set token (OTP) dan expiry (15 menit dari sekarang)
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60000); // 15 menit
    await user.save();

    // Dalam production seharusnya kirim email berisi OTP
    // const message = `Kode OTP reset password Anda adalah: ${otp}`;
    // await sendEmail({ to: user.email, subject: 'OTP Reset Password', text: message });

    res.status(200).json({
      success: true,
      message: "Kode OTP reset password telah dikirim ke email Anda",
      // Untuk development/testing, return OTP (HAPUS di production!)
      data: {
        otp: otp,
        expiresIn: "15 menit"
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error saat forgot password", 
      error: error.message 
    });
  }
};

// Reset Password - Update password dengan OTP
const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "OTP dan password baru diperlukan" 
      });
    }

    // Validasi panjang password
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password minimal 6 karakter" 
      });
    }

    // Cari user dengan OTP yang valid dan belum expired
    const user = await User.findOne({
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Kode OTP tidak valid atau sudah expired" 
      });
    }

    // Update password (plain text - sesuai dengan pattern yang ada)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password berhasil direset, silakan login dengan password baru"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error saat reset password", 
      error: error.message 
    });
  }
};

// Change Password - Update password untuk authenticated user
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validasi input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Password saat ini, password baru, dan konfirmasi diperlukan" 
      });
    }

    // Validasi password baru dan konfirmasi cocok
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Password baru dan konfirmasi tidak cocok" 
      });
    }

    // Validasi panjang password
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password minimal 6 karakter" 
      });
    }

    // Cek password saat ini
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User tidak ditemukan" 
      });
    }

    // Validasi password saat ini (plain text - sesuai dengan pattern yang ada)
    if (user.password !== currentPassword) {
      return res.status(401).json({ 
        success: false,
        message: "Password saat ini tidak benar" 
      });
    }

    // Update password baru
    user.password = newPassword;
    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password berhasil diubah"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error saat mengubah password", 
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword
};
