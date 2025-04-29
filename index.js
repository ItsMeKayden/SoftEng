import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import UserModel from './User.js';
import bcrypt from 'bcryptjs';
import AdminModel from './Admin.js';
import SubmissionModel from './Submission.js';

const app = express();
const PORT = process.env.PORT || 5000;
const router = express.Router();

app.use(cors());
app.use(express.json());

// Connect to MongoDB 
mongoose.connect("mongodb+srv://tagleseanandrei:QsIO8e1RvPqDDpwS@cluster0.tphbs0m.mongodb.net/" + "test?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
})

app.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;
  
  // Example validation
  const admin = await AdminModel.findOne({ username });
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Admin not found' });
  }

  // Compare password (assuming you are hashing passwords)
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }

  // If valid, send response
  res.json({ success: true, username: admin.username, password: admin.password });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: 'This user does not exist!' });
    }

    // If the user is suspended, prevent login
    if (user.status === "Suspended") {
      return res.json({ success: false, message: 'Account suspended. Please contact the administrator.' });
    }

    // Check for inactivity (30+ days)
    const now = new Date();
    const lastLoginDate = new Date(user.lastLogin);
    const daysInactive = Math.floor((now - lastLoginDate) / (1000 * 60 * 60 * 24));

    if (daysInactive >= 30 && user.status !== "Inactive") {
      user.status = "Inactive";
      await user.save();
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Password incorrect!' });
    }

    // Reactivate user if login successful
    if (user.status === "Inactive") {
      user.status = "Active";
    }

    user.lastLogin = now;
    await user.save();

    res.json({
      success: true,
      email: user.email,
      username: user.email.split('@')[0],
      role: user.role,
      status: user.status
    });

  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Route for handling weather requests
app.get('/weather', async (req, res) => {
  const location = req.query.location;  // Get the location from query params
  
  try {
    // Assuming you're using an external weather API like Visual Crossing or OpenWeather
    const weatherData = await axios.get(`https://api.weatherapi.com/v1/current.json?key=KWSMMFCN6WSP7JTU45KYV5BJV&q=${location}`);
    const weather = weatherData.data;

    res.json({
      location: weather.location.name,
      temperature: weather.current.temp_c,
      conditions: weather.current.condition.text
    });
  } catch (error) {
    console.error("Error fetching weather data:", error);
    res.json({ error: "Could not retrieve weather data" });
  }
});

// Route for handling chatbot messages
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;  // Get the user's message from the request body

  // You could integrate an AI model here, for example
  let botResponse = "I'm not sure how to respond to that.";
  
  if (userMessage.toLowerCase().includes("weather")) {
    botResponse = "Sure! I can help you with weather info.";
  }
  // Add more rules or AI logic as needed

  res.json({ response: botResponse });
});

app.post('/api/check-email', (req, res) => {
  const { email } = req.body;
  
  UserModel.findOne({ email: email })
    .then(user => {
      if (user) {
        res.json({ exists: true });
      } else {
        res.json({ exists: false });
      }
    })
    .catch(err => {
      console.error("Error checking email:", err);
      res.status(500).json({ message: 'Server error' });
    });
});

// Reset password after OTP verification
app.post('/api/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await UserModel.findOneAndUpdate(
      { email: email },
      { password: hashedPassword },  // Store the hashed password
      { new: true }
    );

    if (user) {
      res.json({ message: 'Password reset successfully!' });
    } else {
      res.status(400).json({ message: 'Email not found.' });
    }
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);  // 10 is the salt rounds

  const userData = {
    email,
    password: hashedPassword,  // Store the hashed password
    role
  };

  try {
    const newUser = await UserModel.create(userData);
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await UserModel.find();
    console.log(users); // Log the users data to ensure it's an array
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

  
  app.post('/auth/google', async (req, res) => {
    const { email, name, picture, sub } = req.body;
  
    try {
      let user = await UserModel.findOne({ googleId: sub });
  
      if (!user) {
        user = new UserModel({
          googleId: sub,
          email,
          name,
          picture,
          role: "Others"
        });
        await user.save();
      }
  
      res.status(200).json(user);
    } catch (err) {
      console.error('Error saving Google user:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  app.post('/users/update-status', async (req, res) => {
    const { userId, newStatus } = req.body;
    console.log('Received update request for:', userId, newStatus);
  
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        console.log('User not found with ID:', userId);
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.status = newStatus;
      await user.save();
  
      console.log('Status updated for user:', user.email);
      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;
  
    try {
      const deletedUser = await UserModel.findByIdAndDelete(userId);
  
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Save a new submission
app.get('/submissions', async (req, res) => {
  const { location, hazards } = req.query;

  try {
    const hazardArray = hazards ? hazards.split(',') : [];

    const query = {
      location: location,
      hazards: { $in: hazardArray }
    };

    const submissions = await SubmissionModel.find(query);
    res.status(200).json(submissions);
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ message: 'Server error fetching submissions' });
  }
});
// POST submissions route
app.post('/submissions', async (req, res) => {
  const { location, hazards, timestamp } = req.body;

  try {
    const submission = new SubmissionModel({
      location,
      hazards,
      timestamp,
    });

    const savedSubmission = await submission.save();
    res.status(201).json(savedSubmission);
  } catch (err) {
    console.error('Error saving submission:', err);
    res.status(500).json({ message: 'Server error saving submission' });
  }
});
  
  
// Test Route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend' });
});

app.get('/', (req, res) => {
  res.send('Welcome to the backend server!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});