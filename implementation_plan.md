# User Email Verification with OTP Implementation Plan

This plan outlines the steps to add email verification via OTP during user sign-up in the Thikana application.

## User Review Required

> [!IMPORTANT]
> **Email Provider Configuration**
> Setting up real email delivery (e.g., using Gmail, SendGrid, etc.) requires sensitive credentials. For development and testing purposes, we will use **Ethereal Email** (a fake SMTP service provided by Nodemailer) by default if no configuration is provided in your `.env`. You can test the flow fully and view intercepted emails through the Ethereal web interface. Once ready for production, you can simply add `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` to your backend `.env` file.
> 
> **Are you okay with using Ethereal Email for local testing?**

## Proposed Changes

### Database Updates

We'll add two new columns to the `users` table to track the OTP:
- `otp_code` (VARCHAR)
- `otp_expires_at` (DATETIME)

*I will run an `ALTER TABLE` command directly on your MySQL instance without modifying `init.sql` (to avoid data loss), but I'll also update `init.sql` so future setups have the new columns.*

---

### Backend (Node.js/Express)

#### [NEW] `server/config/mail.js`
Create a Nodemailer utility to handle sending emails. It will use `.env` settings if available, or generate a test Ethereal account if not.

#### [MODIFY] `server/routes/authRoutes.js`
Add two new endpoints with input validation:
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-otp`

#### [MODIFY] `server/controllers/authController.js`
- **`signup`**: Update the logic to generate a 6-digit OTP, send it via the new mailer, save it to the database, and return a `requiresVerification` flag instead of immediately returning a login token.
- **`login`**: Update the logic to check `is_verified` before issuing a token. If the user is not verified, it will block login and ask the frontend to redirect to the verification page.
- **`verifyEmail` [New]**: Check the provided OTP against the database and ensure it hasn't expired. If valid, set `is_verified = 1`, clear the OTP fields, and return the login JWT token.
- **`resendOtp` [New]**: Generate a new OTP, send the email again, and update the expiration time.

#### [MODIFY] `server/package.json`
Install `nodemailer`.

---

### Frontend (React/Vite)

#### [NEW] `src/pages/VerifyEmail.jsx`
Create a beautiful new UI for users to enter their 6-digit OTP. It will include:
- A 6-character input field logic for the OTP.
- Error handling for invalid/expired OTPs.
- A "Resend Email" button.
- Redirects to the homepage or login page upon successful verification.

#### [MODIFY] `src/services/api.js`
Add `verifyEmail(email, otp)` and `resendOtp(email)` api helper methods.

#### [MODIFY] `src/pages/Signup.jsx`
Change the success flow: Instead of immediately logging the user in, redirect them to `/verify-email?email=user@email.com` so they can input the OTP.

#### [MODIFY] `src/pages/Login.jsx`
Handle the specific error when a user tries to log in without verifying their email by providing a link or automatic redirect to the `/verify-email` page.

#### [MODIFY] `src/App.jsx`
Add the new `/verify-email` route.

## Verification Plan

### Automated Tests
*N/A* - I will test the endpoints using curl if needed.

### Manual Verification
1. I will ask you to open your browser and navigate to the signup page.
2. Sign up with a test email account.
3. Check the console output in the backend server. If using Ethereal email, a URL will be printed in the terminal showing the generated OTP email!
4. Follow the redirect to the new OTP UI page, enter the OTP from step 3.
5. Watch the dashboard unlock and log you in automatically upon successful verification.
6. Try logging in without verifying to ensure the application intercepts the request properly.
