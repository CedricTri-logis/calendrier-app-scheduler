# Page snapshot

```yaml
- text: Login Enter your email below to login to your account Email
- textbox "Email"
- text: Password
- link "Forgot your password?":
  - /url: /auth/forgot-password
- textbox "Password"
- button "Login"
- text: Don't have an account?
- link "Sign up":
  - /url: /auth/sign-up
- alert
```