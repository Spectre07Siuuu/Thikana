# Thikana - System Design Document

## 1. System Architecture Overview

### 1.1 High-Level Architecture
Thikana is a full-stack e-commerce application with the following architecture:

```
┌─────────────────────────────────────────────────────┐
│         Client-Side (React + Vite)                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ Pages | Components | Context API | Services │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
           ↕ (HTTP/WebSocket)
┌─────────────────────────────────────────────────────┐
│    Server-Side (Node.js + Express)                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ Routes | Controllers | Middleware | Utils    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
           ↕
┌─────────────────────────────────────────────────────┐
│         Database (MySQL)                            │
└─────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Frontend:**
- Framework: React (Vite)
- Styling: Tailwind CSS
- State Management: React Context API
- Build Tool: Vite
- Post-processing: PostCSS

**Backend:**
- Runtime: Node.js
- Framework: Express.js
- Database: MySQL
- Real-time: WebSocket (Socket.io)

**File Uploads:**
- Storage: Server-side file system (`server/uploads/`)
- Categories: avatars, products, chat-files, chat-images, chat-voice, nid

---

## 2. Frontend Architecture

### 2.1 Directory Structure
```
src/
├── App.jsx                 # Main application component
├── main.jsx               # Entry point
├── components/            # Reusable UI components
├── context/               # Global state management
├── pages/                 # Page-level components (routes)
├── services/              # API calls and utilities
└── styles/                # Global CSS
```

### 2.2 State Management (Context API)

**AuthContext.jsx**
- Manages user authentication state
- Stores user session data
- Handles login/logout/signup

**CartContext.jsx**
- Manages shopping cart state
- Handles cart operations (add, remove, update)

**NotificationContext.jsx**
- Global notifications/alerts
- Toast messages, success/error notifications

**SocketContext.jsx**
- WebSocket connection management
- Real-time features (messaging, notifications)

**ThemeContext.jsx**
- Application theme settings
- Dark/light mode toggle

### 2.3 Pages

| Page | Purpose | Key Features |
|------|---------|--------------|
| Home.jsx | Landing page | Product showcase, featured items |
| Login.jsx | User authentication | Email/password login |
| Signup.jsx | User registration | Account creation |
| ForgotPassword.jsx | Password recovery | Email-based reset link |
| ResetPassword.jsx | Password reset | Update password with token |
| Profile.jsx | User profile | Edit user information |
| ProductDetails.jsx | Product view | Product info, reviews, purchase |
| UploadProduct.jsx | Sell product | Vendor product creation |
| Cart.jsx | Shopping cart | Review items, adjust quantities |
| Checkout.jsx | Payment & delivery | Order finalization |
| Messages.jsx | Messaging | Buyer-seller communication |
| NidVerify.jsx | ID verification | User document verification |
| Admin.jsx | Admin dashboard | System management |
| OrderDetails.jsx | Order tracking | Order history and status |
| Settings.jsx | User settings | Account preferences |
| Notifications.jsx | Notification center | User alerts |
| Privacy.jsx | Privacy policy | Legal document |
| Terms.jsx | Terms of service | Legal document |
| VerifyEmail.jsx | Email verification | Confirm email ownership |

---

## 3. Backend Architecture

### 3.1 Directory Structure
```
server/
├── index.js              # Express app setup & server start
├── socket.js             # WebSocket configuration
├── package.json          # Dependencies
├── config/               # Configuration files
├── controllers/          # Business logic
├── middleware/           # Custom middleware
├── routes/               # API endpoints
├── db/                   # Database setup & migrations
├── uploads/              # File storage
└── utils/                # Helper functions
```

### 3.2 API Routes

**Authentication Routes** (`authRoutes.js`)
- POST `/auth/login` - User login
- POST `/auth/signup` - User registration
- POST `/auth/forgot-password` - Password recovery
- POST `/auth/reset-password` - Password reset
- POST `/auth/verify-email` - Email verification

**Product Routes** (`productRoutes.js`)
- GET `/products` - List all products
- GET `/products/:id` - Product details
- POST `/products` - Create product
- PUT `/products/:id` - Update product
- DELETE `/products/:id` - Delete product

**Cart Routes** (`cartRoutes.js`)
- GET `/cart` - Get user's cart
- POST `/cart/add` - Add item to cart
- PUT `/cart/:itemId` - Update cart item
- DELETE `/cart/:itemId` - Remove item from cart

**Order Routes** (`orderRoutes.js`)
- GET `/orders` - List user orders
- POST `/orders` - Create order
- GET `/orders/:id` - Order details
- PUT `/orders/:id` - Update order status

**Favorites Routes** (`favouriteRoutes.js`)
- GET `/favorites` - List favorite products
- POST `/favorites/:productId` - Add to favorites
- DELETE `/favorites/:productId` - Remove from favorites

**Review Routes** (`reviewRoutes.js`)
- GET `/reviews/:productId` - Product reviews
- POST `/reviews` - Create review
- PUT `/reviews/:id` - Update review
- DELETE `/reviews/:id` - Delete review

**Message Routes** (`messageRoutes.js`)
- GET `/messages/:conversationId` - Get conversation
- POST `/messages` - Send message
- GET `/conversations` - List conversations

**Profile Routes** (`profileRoutes.js`)
- GET `/profile` - Get user profile
- PUT `/profile` - Update profile
- POST `/profile/avatar` - Upload avatar

**NID Routes** (`nidRoutes.js`)
- POST `/nid/verify` - Submit NID verification
- GET `/nid/status` - Check verification status

**Notification Routes** (`notificationRoutes.js`)
- GET `/notifications` - List notifications
- PUT `/notifications/:id` - Mark as read
- DELETE `/notifications/:id` - Delete notification

**Admin Routes** (`adminRoutes.js`)
- GET `/admin/stats` - Dashboard statistics
- GET `/admin/users` - List all users
- GET `/admin/orders` - List all orders
- PUT `/admin/orders/:id` - Update order status

### 3.3 Controllers

Each controller handles the business logic for its domain:

- **authController** - Authentication logic
- **productController** - Product management
- **cartController** - Cart operations
- **orderController** - Order management
- **favouriteController** - Favorite management
- **reviewController** - Review operations
- **messageController** - Messaging logic
- **profileController** - User profile management
- **nidController** - ID verification
- **notificationController** - Notification management
- **adminController** - Admin operations

### 3.4 Middleware

**authMiddleware.js**
- Verifies JWT tokens
- Checks user authentication
- Role-based access control

### 3.5 File Upload System

Upload categories and storage locations:
```
server/uploads/
├── avatars/         # User profile pictures
├── products/        # Product images
├── chat-images/     # Shared images in messages
├── chat-files/      # Shared documents in messages
├── chat-voice/      # Voice messages
└── nid/             # ID document images
```

---

## 4. Database Design

### 4.1 Schema Overview

**Core Tables:**
- `users` - User accounts
- `products` - Product listings
- `orders` - Customer orders
- `order_items` - Items in orders
- `cart_items` - Shopping cart items
- `reviews` - Product reviews
- `favorites` - Favorite products
- `messages` - Chat messages
- `conversations` - Message conversations
- `notifications` - User notifications
- `nid_verifications` - ID verification records

### 4.2 Database Files

**db/init.sql** - Initial schema creation

**db/migrate.js** - Database migration script

**db/seed.js** - Test data seeding

---

## 5. Real-Time Features (WebSocket)

### 5.1 Socket.io Integration

**File:** `server/socket.js`

Events:
- `connection` - New user connects
- `message:send` - Message sent
- `message:receive` - Message received
- `typing` - User typing indicator
- `notification:new` - New notification
- `order:status` - Order status update
- `disconnect` - User disconnects

---

## 6. Component Architecture

### 6.1 Layout Components
- **Navbar** - Navigation bar
- **Footer** - Footer component
- **Logo** - Application logo

### 6.2 Feature Components
- Product cards
- Cart items
- Message threads
- Order cards
- Review components
- Notification items

---

## 7. API Service Layer

**services/api.js**
- Centralized API calls
- HTTP methods (GET, POST, PUT, DELETE)
- Request/response interceptors
- Error handling
- Authentication header management

---

## 8. Styling Architecture

**styles/index.css**
- Global styles
- CSS custom properties
- Tailwind configuration integration
- PostCSS processing

**tailwind.config.js**
- Theme customization
- Color palette
- Typography settings
- Responsive breakpoints

---

## 9. Build & Deployment

### 9.1 Frontend Build
- Tool: Vite
- Config: `vite.config.js`
- Output: Optimized bundles

### 9.2 Backend Setup
- Config: `server/package.json`
- Entry point: `server/index.js`
- Environment variables: `.env` (server)

### 9.3 Development Setup
- Script: `scripts/setup.js`
- Initializes both frontend and backend

---

## 10. Security Considerations

### 10.1 Authentication
- JWT token-based authentication
- Secure password hashing
- Session management

### 10.2 Authorization
- Role-based access control (RBAC)
- User-specific data isolation

### 10.3 File Upload Security
- File type validation
- Size limits
- Virus scanning (recommended)
- Access control for sensitive files (NID)

### 10.4 Data Protection
- SQL injection prevention (parameterized queries)
- CORS configuration
- Secure headers

---

## 11. Performance Optimization

### 11.1 Frontend
- Code splitting with Vite
- Image optimization
- Lazy loading for routes
- Context API for state (minimal re-renders)

### 11.2 Backend
- Database indexing
- Query optimization
- Caching strategies
- Connection pooling

---

## 12. Error Handling

### 12.1 Frontend
- Try-catch blocks
- Error boundaries
- User-friendly error messages
- Notification context for errors

### 12.2 Backend
- Centralized error handler middleware
- Structured error responses
- Logging system
- HTTP status codes

---

## 13. Data Flow Examples

### 13.1 User Purchase Flow
```
1. User adds product to cart (CartContext)
2. Frontend calls POST /cart/add
3. Backend validates and stores in database
4. Cart updates via CartContext
5. User proceeds to checkout
6. Frontend calls POST /orders
7. Backend creates order and triggers notification
8. WebSocket sends order confirmation to user
```

### 13.2 Real-Time Messaging Flow
```
1. User sends message (Messages page)
2. Frontend emits 'message:send' via Socket.io
3. Backend receives and saves to database
4. Backend broadcasts 'message:receive' to recipient
5. Recipient receives real-time message
6. Notification sent via WebSocket
```

---

## 14. Future Enhancements

- [ ] Payment gateway integration (Stripe, bKash, Nagad)
- [ ] Email notification system
- [ ] SMS notifications
- [ ] Advanced search and filters
- [ ] Product recommendations (ML)
- [ ] Inventory management
- [ ] Seller dashboard analytics
- [ ] Two-factor authentication
- [ ] API rate limiting
- [ ] CDN for static assets
- [ ] Caching layer (Redis)
- [ ] Microservices architecture migration
