const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Email = require('../models/Email');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_key_123', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, faceDescriptor } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Este correo ya está registrado' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      faceDescriptor,
      verificationToken,
      isVerified: false,
    });

    if (user) {
      // Generate simulated email
      await Email.create({
        to: email,
        subject: 'Verifica tu cuenta',
        body: `Hola ${name}, haz clic en el siguiente enlace para verificar tu cuenta.`,
        actionUrl: `/verify/${verificationToken}`,
        actionText: 'Verificar Cuenta',
      });

      res.status(201).json({
        message: 'Usuario registrado exitosamente. Por favor verifica tu cuenta en la bandeja de entrada simulada.',
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al registrar' });
  }
};

// @desc    Verify user account
// @route   GET /api/auth/verify/:token
// @access  Public
const verifyUser = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'El enlace de verificación no es válido o ha expirado' });
    }

    // Verify user
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Cuenta verificada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al verificar cuenta' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor ingrese email y contraseña' });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    // Check verification status
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Debes verificar tu correo antes de iniciar sesión' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      isVerified: user.isVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al iniciar sesión' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // req.user is populated by the auth middleware
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al obtener perfil' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;

      if (req.body.email && req.body.email !== user.email) {
        // Check if new email is already in use
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: 'El correo electrónico ya está en uso por otra cuenta' });
        }
        user.email = req.body.email;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        isVerified: updatedUser.isVerified,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'La nueva contraseña y su confirmación no coinciden' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }

    // Set new password (will be hashed pre-save)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
};

// @desc    Authenticate user using facial recognition descriptor
// @route   POST /api/auth/face-login
// @access  Public
const faceLoginUser = async (req, res) => {
  try {
    const { faceDescriptor, email } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ message: 'Descriptor facial inválido o no detectado.' });
    }

    let matchedUser = null;

    if (email) {
      // 1:1 Matching
      matchedUser = await User.findOne({ email });
      if (!matchedUser) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      if (!matchedUser.faceDescriptor || matchedUser.faceDescriptor.length !== 128) {
        return res.status(400).json({ message: 'El usuario no tiene un rostro registrado.' });
      }

      // Calculate Euclidean Distance
      const dist = Math.sqrt(
        matchedUser.faceDescriptor.reduce((sum, val, idx) => sum + Math.pow(val - faceDescriptor[idx], 2), 0)
      );

      // Match threshold: 0.6 is default for face-api.js
      if (dist > 0.6) {
        return res.status(400).json({ message: 'El rostro no coincide con la cuenta.' });
      }
    } else {
      // 1:N Matching (search all users with registered faces)
      const users = await User.find({ faceDescriptor: { $exists: true } });
      let minDistance = 1.0; // Initialize above threshold

      for (const user of users) {
        if (!user.faceDescriptor || user.faceDescriptor.length !== 128) continue;
        const dist = Math.sqrt(
          user.faceDescriptor.reduce((sum, val, idx) => sum + Math.pow(val - faceDescriptor[idx], 2), 0)
        );
        if (dist < minDistance) {
          minDistance = dist;
          matchedUser = user;
        }
      }

      if (minDistance > 0.6 || !matchedUser) {
        return res.status(400).json({ message: 'Rostro no reconocido o usuario sin rostro registrado.' });
      }
    }

    // Check verification status
    if (!matchedUser.isVerified) {
      return res.status(400).json({ message: 'Debes verificar tu correo antes de iniciar sesión.' });
    }

    // Success: return token and user profile
    res.json({
      _id: matchedUser._id,
      name: matchedUser.name,
      email: matchedUser.email,
      createdAt: matchedUser.createdAt,
      isVerified: matchedUser.isVerified,
      token: generateToken(matchedUser._id),
    });
  } catch (error) {
    console.error('Error en faceLoginUser:', error);
    res.status(500).json({ message: 'Error en el servidor al realizar el inicio de sesión facial.' });
  }
};

module.exports = {
  registerUser,
  verifyUser,
  loginUser,
  faceLoginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
};
