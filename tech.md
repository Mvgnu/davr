# Report: Step-by-Step Implementation of a Full-Stack React-Based Website for Aluminum Recycling in Germany

This report provides a detailed, step-by-step guide to creating a full-stack React-based website focused on aluminum recycling in Germany. The site will emphasize user engagement through interactive features and community building while generating revenue through advertising, subscriptions, affiliate marketing, and event sponsorships. Leveraging Germany’s strong recycling culture, the implementation uses modern technologies: React for the frontend, Node.js with Express for the backend, and MongoDB for the database. Below is a definitive specification with exact code instructions, ensuring a scalable, interactive platform tailored to the German market as of March 14, 2025.

---

## Step 1: Project Setup

### Objective
Establish the foundational structure for the full-stack application.

### Actions
- **Initialize Frontend:** Use `create-react-app` to set up the React frontend.
- **Initialize Backend:** Create a Node.js server with Express.
- **Organize Structure:** Separate the project into `client` (frontend) and `server` (backend) directories.
- **Install Dependencies:** Add required packages for both frontend and backend.

### Instructions
1. **Create Project Directory:**
   ```bash
   mkdir aluminum-recycling-germany
   cd aluminum-recycling-germany
   ```

2. **Set Up Frontend:**
   ```bash
   npx create-react-app client
   cd client
   npm install react-router-dom axios styled-components
   cd ..
   ```

3. **Set Up Backend:**
   ```bash
   mkdir server
   cd server
   npm init -y
   npm install express mongoose cors dotenv jsonwebtoken bcryptjs stripe
   cd ..
   ```

4. **Final Directory Structure:**
   ```
   aluminum-recycling-germany/
   ├── client/          # React frontend
   └── server/          # Node.js backend
   ```

---

## Step 2: Database Design

### Objective
Design a MongoDB schema to store user data, recycling centers, blog posts, forum content, and subscription details.

### Actions
- **Set Up MongoDB:** Use MongoDB Atlas for a cloud-hosted database.
- **Define Schemas:** Create models for Users, RecyclingCenters, BlogPosts, ForumThreads, ForumPosts, and Subscriptions.

### Instructions
1. **MongoDB Atlas Setup:**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a cluster, configure it for free tier, and obtain the connection URI (e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/aluminum_recycling?retryWrites=true&w=majority`).

2. **Backend Configuration:**
   - Create a `.env` file in the `server` directory:
     ```plaintext
     PORT=5000
     MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/aluminum_recycling?retryWrites=true&w=majority
     JWT_SECRET=your_jwt_secret_key
     STRIPE_SECRET_KEY=your_stripe_secret_key
     ```

3. **Define Schemas:**
   - **User Model (`server/models/User.js`):**
     ```javascript
     const mongoose = require('mongoose');
     const userSchema = new mongoose.Schema({
       username: { type: String, required: true, unique: true },
       email: { type: String, required: true, unique: true },
       password: { type: String, required: true },
       role: { type: String, enum: ['user', 'admin'], default: 'user' },
       isPremium: { type: Boolean, default: false },
       createdAt: { type: Date, default: Date.now }
     });
     module.exports = mongoose.model('User', userSchema);
     ```

   - **RecyclingCenter Model (`server/models/RecyclingCenter.js`):**
     ```javascript
     const mongoose = require('mongoose');
     const recyclingCenterSchema = new mongoose.Schema({
       name: { type: String, required: true },
       address: { type: String, required: true },
       city: { type: String, required: true },
       postalCode: { type: String, required: true },
       latitude: { type: Number, required: true },
       longitude: { type: Number, required: true },
       contact: { type: String },
       createdAt: { type: Date, default: Date.now }
     });
     module.exports = mongoose.model('RecyclingCenter', recyclingCenterSchema);
     ```

   - **BlogPost Model (`server/models/BlogPost.js`):**
     ```javascript
     const mongoose = require('mongoose');
     const blogPostSchema = new mongoose.Schema({
       title: { type: String, required: true },
       content: { type: String, required: true },
       author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
       isPremium: { type: Boolean, default: false },
       createdAt: { type: Date, default: Date.now }
     });
     module.exports = mongoose.model('BlogPost', blogPostSchema);
     ```

   - **ForumThread Model (`server/models/ForumThread.js`):**
     ```javascript
     const mongoose = require('mongoose');
     const forumThreadSchema = new mongoose.Schema({
       title: { type: String, required: true },
       content: { type: String, required: true },
       author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
       createdAt: { type: Date, default: Date.now }
     });
     module.exports = mongoose.model('ForumThread', forumThreadSchema);
     ```

   - **ForumPost Model (`server/models/ForumPost.js`):**
     ```javascript
     const mongoose = require('mongoose');
     const forumPostSchema = new mongoose.Schema({
       content: { type: String, required: true },
       author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
       thread: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread', required: true },
       createdAt: { type: Date, default: Date.now }
     });
     module.exports = mongoose.model('ForumPost', forumPostSchema);
     ```

   - **Subscription Model (`server/models/Subscription.js`):**
     ```javascript
     const mongoose = require('mongoose');
     const subscriptionSchema = new mongoose.Schema({
       user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
       stripeSubscriptionId: { type: String, required: true },
       status: { type: String, enum: ['active', 'canceled'], default: 'active' },
       createdAt: { type: Date, default: Date.now }
     });
     module.exports = mongoose.model('Subscription', subscriptionSchema);
     ```

4. **Connect to MongoDB (`server/index.js`):**
   ```javascript
   const express = require('express');
   const mongoose = require('mongoose');
   const cors = require('cors');
   const dotenv = require('dotenv');

   dotenv.config();
   const app = express();

   app.use(cors());
   app.use(express.json());

   mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
     .then(() => console.log('MongoDB connected'))
     .catch(err => console.error(err));

   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
   ```

---

## Step 3: Authentication and Authorization

### Objective
Implement secure user authentication and role-based access control using JWT and password hashing.

### Actions
- **Register and Login Routes:** Create endpoints for user registration and login.
- **Protect Routes:** Use middleware to secure routes based on authentication and roles.

### Instructions
1. **Authentication Routes (`server/routes/auth.js`):**
   ```javascript
   const express = require('express');
   const router = express.Router();
   const bcrypt = require('bcryptjs');
   const jwt = require('jsonwebtoken');
   const User = require('../models/User');

   router.post('/register', async (req, res) => {
     const { username, email, password } = req.body;
     try {
       let user = await User.findOne({ email });
       if (user) return res.status(400).json({ message: 'User already exists' });

       const hashedPassword = await bcrypt.hash(password, 10);
       user = new User({ username, email, password: hashedPassword });
       await user.save();

       const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
       res.status(201).json({ token });
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   router.post('/login', async (req, res) => {
     const { email, password } = req.body;
     try {
       const user = await User.findOne({ email });
       if (!user) return res.status(404).json({ message: 'User not found' });

       const isValid = await bcrypt.compare(password, user.password);
       if (!isValid) return res.status(401).json({ message: 'Invalid password' });

       const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
       res.json({ token });
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   module.exports = router;
   ```

2. **Authentication Middleware (`server/middleware/auth.js`):**
   ```javascript
   const jwt = require('jsonwebtoken');

   const authMiddleware = (req, res, next) => {
     const token = req.header('Authorization')?.replace('Bearer ', '');
     if (!token) return res.status(401).json({ message: 'No token provided' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded;
       next();
     } catch (error) {
       res.status(401).json({ message: 'Invalid token' });
     }
   };

   const adminMiddleware = (req, res, next) => {
     if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
     next();
   };

   module.exports = { authMiddleware, adminMiddleware };
   ```

3. **Update Server (`server/index.js`):**
   ```javascript
   const express = require('express');
   const mongoose = require('mongoose');
   const cors = require('cors');
   const dotenv = require('dotenv');
   const authRoutes = require('./routes/auth');

   dotenv.config();
   const app = express();

   app.use(cors());
   app.use(express.json());

   mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
     .then(() => console.log('MongoDB connected'))
     .catch(err => console.error(err));

   app.use('/api/auth', authRoutes);

   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
   ```

---

## Step 4: API Development

### Objective
Create RESTful APIs for core functionalities: user management, recycling centers, blog posts, and forum content.

### Instructions
1. **Recycling Centers Routes (`server/routes/recyclingCenters.js`):**
   ```javascript
   const express = require('express');
   const router = express.Router();
   const RecyclingCenter = require('../models/RecyclingCenter');
   const { authMiddleware, adminMiddleware } = require('../middleware/auth');

   router.get('/', async (req, res) => {
     try {
       const centers = await RecyclingCenter.find();
       res.json(centers);
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
     try {
       const center = new RecyclingCenter(req.body);
       await center.save();
       res.status(201).json(center);
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   module.exports = router;
   ```

2. **Blog Posts Routes (`server/routes/blogPosts.js`):**
   ```javascript
   const express = require('express');
   const router = express.Router();
   const BlogPost = require('../models/BlogPost');
   const { authMiddleware, adminMiddleware } = require('../middleware/auth');

   router.get('/', async (req, res) => {
     try {
       const posts = await BlogPost.find().populate('author', 'username');
       res.json(posts);
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
     try {
       const post = new BlogPost({ ...req.body, author: req.user.id });
       await post.save();
       res.status(201).json(post);
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   module.exports = router;
   ```

3. **Forum Routes (`server/routes/forum.js`):**
   ```javascript
   const express = require('express');
   const router = express.Router();
   const ForumThread = require('../models/ForumThread');
   const ForumPost = require('../models/ForumPost');
   const { authMiddleware } = require('../middleware/auth');

   router.get('/threads', async (req, res) => {
     try {
       const threads = await ForumThread.find().populate('author', 'username');
       res.json(threads);
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   router.post('/threads', authMiddleware, async (req, res) => {
     try {
       const thread = new ForumThread({ ...req.body, author: req.user.id });
       await thread.save();
       res.status(201).json(thread);
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   router.get('/threads/:id/posts', async (req, res) => {
     try {
       const posts = await ForumPost.find({ thread: req.params.id }).populate('author', 'username');
       res.json(posts);
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   router.post('/threads/:id/posts', authMiddleware, async (req, res) => {
     try {
       const post = new ForumPost({ content: req.body.content, author: req.user.id, thread: req.params.id });
       await post.save();
       res.status(201).json(post);
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   module.exports = router;
   ```

4. **Update Server (`server/index.js`):**
   ```javascript
   const express = require('express');
   const mongoose = require('mongoose');
   const cors = require('cors');
   const dotenv = require('dotenv');
   const authRoutes = require('./routes/auth');
   const recyclingCentersRoutes = require('./routes/recyclingCenters');
   const blogPostsRoutes = require('./routes/blogPosts');
   const forumRoutes = require('./routes/forum');

   dotenv.config();
   const app = express();

   app.use(cors());
   app.use(express.json());

   mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
     .then(() => console.log('MongoDB connected'))
     .catch(err => console.error(err));

   app.use('/api/auth', authRoutes);
   app.use('/api/recycling-centers', recyclingCentersRoutes);
   app.use('/api/blog-posts', blogPostsRoutes);
   app.use('/api/forum', forumRoutes);

   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
   ```

---

## Step 5: Frontend Development

### Objective
Build a responsive React frontend with navigation, reusable components, and styled interfaces.

### Instructions
1. **Main App (`client/src/App.js`):**
   ```javascript
   import React from 'react';
   import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
   import Header from './components/Header';
   import Footer from './components/Footer';
   import Home from './pages/Home';
   import Login from './pages/Login';
   import Register from './pages/Register';
   import RecyclingCenters from './pages/RecyclingCenters';
   import Blog from './pages/Blog';
   import Forum from './pages/Forum';
   import RecyclingTracker from './pages/RecyclingTracker';

   function App() {
     return (
       <Router>
         <Header />
         <Switch>
           <Route exact path="/" component={Home} />
           <Route path="/login" component={Login} />
           <Route path="/register" component={Register} />
           <Route path="/recycling-centers" component={RecyclingCenters} />
           <Route path="/blog" component={Blog} />
           <Route path="/forum" component={Forum} />
           <Route path="/recycling-tracker" component={RecyclingTracker} />
         </Switch>
         <Footer />
       </Router>
     );
   }

   export default App;
   ```

2. **Header Component (`client/src/components/Header.js`):**
   ```javascript
   import React from 'react';
   import { Link } from 'react-router-dom';
   import styled from 'styled-components';

   const Nav = styled.nav`
     background: #2c3e50;
     padding: 1rem;
     display: flex;
     justify-content: space-between;
     color: white;
   `;

   const Header = () => {
     const token = localStorage.getItem('token');
     const handleLogout = () => {
       localStorage.removeItem('token');
       window.location.href = '/login';
     };

     return (
       <Nav>
         <div>
           <Link to="/" style={{ color: 'white', marginRight: '1rem' }}>Home</Link>
           <Link to="/recycling-centers" style={{ color: 'white', marginRight: '1rem' }}>Recycling Centers</Link>
           <Link to="/blog" style={{ color: 'white', marginRight: '1rem' }}>Blog</Link>
           <Link to="/forum" style={{ color: 'white', marginRight: '1rem' }}>Forum</Link>
           <Link to="/recycling-tracker" style={{ color: 'white' }}>Tracker</Link>
         </div>
         <div>
           {token ? (
             <button onClick={handleLogout} style={{ color: 'white', background: 'none', border: 'none' }}>Logout</button>
           ) : (
             <>
               <Link to="/login" style={{ color: 'white', marginRight: '1rem' }}>Login</Link>
               <Link to="/register" style={{ color: 'white' }}>Register</Link>
             </>
           )}
         </div>
       </Nav>
     );
   };

   export default Header;
   ```

3. **Footer Component (`client/src/components/Footer.js`):**
   ```javascript
   import React from 'react';
   import styled from 'styled-components';

   const Foot = styled.footer`
     background: #2c3e50;
     color: white;
     text-align: center;
     padding: 1rem;
     position: fixed;
     bottom: 0;
     width: 100%;
   `;

   const Footer = () => (
     <Foot>
       <p>&copy; 2025 Aluminum Recycling Germany</p>
     </Foot>
   );

   export default Footer;
   ```

---

## Step 6: Interactive Features (Recycling Tracker)

### Objective
Implement a recycling tracker for users to log activities and view their impact.

### Instructions
1. **Backend Route (`server/routes/recyclingLog.js`):**
   ```javascript
   const express = require('express');
   const router = express.Router();
   const { authMiddleware } = require('../middleware/auth');
   const RecyclingLog = require('../models/RecyclingLog');

   const recyclingLogSchema = new mongoose.Schema({
     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     amount: { type: Number, required: true },
     date: { type: Date, required: true },
     createdAt: { type: Date, default: Date.now }
   });
   const RecyclingLog = mongoose.model('RecyclingLog', recyclingLogSchema);

   router.post('/', authMiddleware, async (req, res) => {
     try {
       const log = new RecyclingLog({ ...req.body, user: req.user.id });
       await log.save();
       res.status(201).json(log);
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   router.get('/', authMiddleware, async (req, res) => {
     try {
       const logs = await RecyclingLog.find({ user: req.user.id });
       res.json(logs);
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   module.exports = router;
   ```

2. **Update Server (`server/index.js`):**
   ```javascript
   const recyclingLogRoutes = require('./routes/recyclingLog');
   app.use('/api/recycling-log', recyclingLogRoutes);
   ```

3. **Frontend Page (`client/src/pages/RecyclingTracker.js`):**
   ```javascript
   import React, { useState, useEffect } from 'react';
   import axios from 'axios';
   import styled from 'styled-components';

   const Container = styled.div`
     padding: 2rem;
   `;

   const RecyclingTracker = () => {
     const [amount, setAmount] = useState('');
     const [date, setDate] = useState('');
     const [logs, setLogs] = useState([]);

     useEffect(() => {
       const fetchLogs = async () => {
         const response = await axios.get('http://localhost:5000/api/recycling-log', {
           headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
         });
         setLogs(response.data);
       };
       fetchLogs();
     }, []);

     const handleSubmit = async (e) => {
       e.preventDefault();
       await axios.post('http://localhost:5000/api/recycling-log', { amount, date }, {
         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
       });
       setAmount('');
       setDate('');
       const response = await axios.get('http://localhost:5000/api/recycling-log', {
         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
       });
       setLogs(response.data);
     };

     return (
       <Container>
         <h1>Recycling Tracker</h1>
         <form onSubmit={handleSubmit}>
           <input
             type="number"
             value={amount}
             onChange={(e) => setAmount(e.target.value)}
             placeholder="Amount recycled (kg)"
             required
           />
           <input
             type="date"
             value={date}
             onChange={(e) => setDate(e.target.value)}
             required
           />
           <button type="submit">Log Recycling</button>
         </form>
         <h2>Your Logs</h2>
         <ul>
           {logs.map(log => (
             <li key={log._id}>{log.amount} kg on {new Date(log.date).toLocaleDateString()}</li>
           ))}
         </ul>
       </Container>
     );
   };

   export default RecyclingTracker;
   ```

---

## Step 7: Community Forum

### Objective
Build a forum for user discussions with thread creation and replies.

### Instructions
1. **Frontend Forum Page (`client/src/pages/Forum.js`):**
   ```javascript
   import React, { useState, useEffect } from 'react';
   import axios from 'axios';
   import styled from 'styled-components';

   const Container = styled.div`
     padding: 2rem;
   `;

   const Forum = () => {
     const [threads, setThreads] = useState([]);
     const [title, setTitle] = useState('');
     const [content, setContent] = useState('');

     useEffect(() => {
       const fetchThreads = async () => {
         const response = await axios.get('http://localhost:5000/api/forum/threads');
         setThreads(response.data);
       };
       fetchThreads();
     }, []);

     const handleSubmit = async (e) => {
       e.preventDefault();
       await axios.post('http://localhost:5000/api/forum/threads', { title, content }, {
         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
       });
       setTitle('');
       setContent('');
       const response = await axios.get('http://localhost:5000/api/forum/threads');
       setThreads(response.data);
     };

     return (
       <Container>
         <h1>Forum</h1>
         <form onSubmit={handleSubmit}>
           <input
             type="text"
             value={title}
             onChange={(e) => setTitle(e.target.value)}
             placeholder="Thread Title"
             required
           />
           <textarea
             value={content}
             onChange={(e) => setContent(e.target.value)}
             placeholder="Thread Content"
             required
           />
           <button type="submit">Create Thread</button>
         </form>
         <h2>Threads</h2>
         {threads.map(thread => (
           <div key={thread._id}>
             <h3>{thread.title}</h3>
             <p>{thread.content}</p>
             <p>By: {thread.author.username}</p>
           </div>
         ))}
       </Container>
     );
   };

   export default Forum;
   ```

---

## Step 8: Premium Features and Subscriptions

### Objective
Implement subscription-based access to premium content using Stripe.

### Instructions
1. **Stripe Setup:**
   - Sign up at [Stripe](https://stripe.com), get your secret key, and add it to `.env`.

2. **Subscription Route (`server/routes/subscriptions.js`):**
   ```javascript
   const express = require('express');
   const router = express.Router();
   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
   const { authMiddleware } = require('../middleware/auth');
   const Subscription = require('../models/Subscription');
   const User = require('../models/User');

   router.post('/create', authMiddleware, async (req, res) => {
     try {
       const session = await stripe.checkout.sessions.create({
         payment_method_types: ['card'],
         line_items: [{
           price: 'price_1YourStripePriceId', // Replace with your Stripe Price ID
           quantity: 1,
         }],
         mode: 'subscription',
         success_url: 'http://localhost:3000/success',
         cancel_url: 'http://localhost:3000/cancel',
       });

       res.json({ id: session.id });
     } catch (error) {
       res.status(500).json({ message: 'Server error' });
     }
   });

   router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
     const sig = req.headers['stripe-signature'];
     let event;

     try {
       event = stripe.webhooks.constructEvent(req.body, sig, 'your_stripe_webhook_secret');
     } catch (err) {
       return res.status(400).send(`Webhook Error: ${err.message}`);
     }

     if (event.type === 'checkout.session.completed') {
       const session = event.data.object;
       const user = await User.findOne({ email: session.customer_email });
       if (user) {
         const subscription = new Subscription({
           user: user._id,
           stripeSubscriptionId: session.subscription,
         });
         await subscription.save();
         user.isPremium = true;
         await user.save();
       }
     }

     res.json({ received: true });
   });

   module.exports = router;
   ```

3. **Update Server (`server/index.js`):**
   ```javascript
   const subscriptionRoutes = require('./routes/subscriptions');
   app.use('/api/subscriptions', subscriptionRoutes);
   ```

4. **Frontend Blog Page (`client/src/pages/Blog.js`):**
   ```javascript
   import React, { useState, useEffect } from 'react';
   import axios from 'axios';
   import styled from 'styled-components';
   import StripeCheckout from 'react-stripe-checkout';

   const Container = styled.div`
     padding: 2rem;
   `;

   const Blog = () => {
     const [posts, setPosts] = useState([]);
     const [isPremium, setIsPremium] = useState(false);

     useEffect(() => {
       const fetchPosts = async () => {
         const response = await axios.get('http://localhost:5000/api/blog-posts');
         setPosts(response.data);
       };
       fetchPosts();

       const checkPremium = async () => {
         const response = await axios.get('http://localhost:5000/api/auth/me', {
           headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
         });
         setIsPremium(response.data.isPremium);
       };
       if (localStorage.getItem('token')) checkPremium();
     }, []);

     const handleToken = async (token) => {
       await axios.post('http://localhost:5000/api/subscriptions/create', { token }, {
         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
       });
       setIsPremium(true);
     };

     return (
       <Container>
         <h1>Blog</h1>
         {!isPremium && (
           <StripeCheckout
             stripeKey="your_stripe_publishable_key"
             token={handleToken}
             amount={999} // $9.99
             name="Premium Subscription"
           />
         )}
         {posts.map(post => (
           <div key={post._id}>
             <h2>{post.title}</h2>
             {post.isPremium && !isPremium ? (
               <p>Premium content. Subscribe to access.</p>
             ) : (
               <p>{post.content}</p>
             )}
             <p>By: {post.author.username}</p>
           </div>
         ))}
       </Container>
     );
   };

   export default Blog;
   ```

---

## Step 9: Deployment

### Objective
Deploy the application to production using Vercel for the frontend and Heroku for the backend.

### Instructions
1. **Frontend Deployment (Vercel):**
   - Install Vercel CLI:
     ```bash
     npm install -g vercel
     ```
   - Deploy:
     ```bash
     cd client
     vercel
     ```

2. **Backend Deployment (Heroku):**
   - Install Heroku CLI, then:
     ```bash
     cd server
     heroku create aluminum-recycling-api
     git init
     git add .
     git commit -m "Initial commit"
     git push heroku master
     heroku config:set MONGO_URI=your_mongo_uri JWT_SECRET=your_jwt_secret STRIPE_SECRET_KEY=your_stripe_key
     ```

---

## Step 10: Testing and Maintenance

### Objective
Ensure the application is robust with unit and integration tests.

### Instructions
1. **Frontend Test (`client/src/components/Header.test.js`):**
   ```javascript
   import React from 'react';
   import { render, screen } from '@testing-library/react';
   import Header from './components/Header';
   import { BrowserRouter } from 'react-router-dom';

   test('renders header with navigation links', () => {
     render(
       <BrowserRouter>
         <Header />
       </BrowserRouter>
     );
     expect(screen.getByText(/Home/i)).toBeInTheDocument();
     expect(screen.getByText(/Recycling Centers/i)).toBeInTheDocument();
   });
   ```

2. **Run Tests:**
   ```bash
   cd client
   npm test
   ```

---

## Conclusion
This comprehensive guide outlines the creation of a full-stack React-based website for aluminum recycling in Germany. By integrating interactive features like a recycling tracker, a community forum, and premium content with Stripe subscriptions, the site meets user engagement goals while leveraging revenue streams tailored to Germany’s recycling culture. The use of React, Node.js, and MongoDB ensures a modern, scalable platform, deployable via Vercel and Heroku, with testing to maintain quality. This implementation positions the site as a leading resource in the niche as of March 14, 2025.