const crypto = require('crypto');
const User = require('../models/User');
const Email = require('../models/Email');

// @desc    Recover Username (tu usuario es: [Nombre])
// @route   POST /api/recovery/username
// @access  Public
const recoverUsername = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'El correo electrónico es obligatorio' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'No existe ninguna cuenta registrada con este correo electrónico' });
    }

    // Create simulated email with user name
    await Email.create({
      to: email,
      subject: 'Tu usuario',
      body: `Tu usuario es: ${user.name}`,
    });

    res.status(200).json({ message: 'Correo enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al recuperar usuario' });
  }
};

// @desc    Request Password Reset Token
// @route   POST /api/recovery/password-request
// @access  Public
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'El correo electrónico es obligatorio' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'No existe ninguna cuenta registrada con este correo electrónico' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set fields
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour validity
    await user.save();

    // Create simulated email with Reset link
    await Email.create({
      to: email,
      subject: 'Restablecer contraseña',
      body: `Hola ${user.name}, haz clic en el siguiente enlace para restablecer tu contraseña.`,
      actionUrl: `/reset-password/${resetToken}`,
      actionText: 'Restablecer',
    });

    res.status(200).json({ message: 'Correo enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al solicitar restablecimiento de contraseña' });
  }
};

// @desc    Reset Password with Token
// @route   POST /api/recovery/password-reset
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    // Find user by valid token and non-expired time
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'El token de restablecimiento de contraseña es inválido o ha expirado' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al restablecer contraseña' });
  }
};

module.exports = {
  recoverUsername,
  requestPasswordReset,
  resetPassword,
};
