const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const User = require('../models/User');
const Budget = require('../models/Budget');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.cookie('token', token, cookieOptions());
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      partnerId: user.partnerId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions());
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      partnerId: user.partnerId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.cookie('token', '', { ...cookieOptions(), maxAge: 0 });
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let partnerName = null;
    if (user.partnerId) {
      const partner = await User.findById(user.partnerId).select('name email');
      partnerName = partner ? partner.name : null;
    }
    res.json({ ...user.toObject(), partnerName });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/generate-invite
const generateInvite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.partnerId)
      return res.status(400).json({ message: 'You are already linked to a partner' });

    const code = nanoid(8).toUpperCase();
    user.inviteCode = code;
    user.inviteCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await user.save({ validateBeforeSave: false });

    res.json({ inviteCode: code, expiresAt: user.inviteCodeExpiry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/link-partner
const linkPartner = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });

    const currentUser = await User.findById(req.user._id);
    if (currentUser.partnerId)
      return res.status(400).json({ message: 'You are already linked to a partner' });

    const partner = await User.findOne({
      inviteCode: inviteCode.toUpperCase(),
      inviteCodeExpiry: { $gt: new Date() },
    });

    if (!partner) return res.status(404).json({ message: 'Invalid or expired invite code' });
    if (partner._id.equals(currentUser._id))
      return res.status(400).json({ message: 'You cannot link with yourself' });
    if (partner.partnerId)
      return res.status(400).json({ message: 'This user is already linked to someone else' });

    // Link both users
    currentUser.partnerId = partner._id;
    partner.partnerId = currentUser._id;
    partner.inviteCode = null;
    partner.inviteCodeExpiry = null;

    await currentUser.save({ validateBeforeSave: false });
    await partner.save({ validateBeforeSave: false });

    // Create a default shared budget for the couple
    const coupleKey = [currentUser._id, partner._id].sort().join('_');
    const existing = await Budget.findOne({ coupleKey });
    if (!existing) {
      await Budget.create({
        coupleKey,
        totalBudget: 3000,
        shares: [
          { userId: currentUser._id, amount: 1500 },
          { userId: partner._id, amount: 1500 },
        ],
        weekStartDay: 1,
      });
    }

    res.json({ message: 'Partner linked successfully', partnerId: partner._id, partnerName: partner.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/unlink-partner
const unlinkPartner = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.partnerId)
      return res.status(400).json({ message: 'You are not linked to a partner' });

    const partner = await User.findById(currentUser.partnerId);
    currentUser.partnerId = null;
    if (partner) {
      partner.partnerId = null;
      await partner.save({ validateBeforeSave: false });
    }
    await currentUser.save({ validateBeforeSave: false });

    res.json({ message: 'Partner unlinked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, logout, getMe, generateInvite, linkPartner, unlinkPartner };
