# Vocaid - Frontend

<p align="center">
  <img src="public/Main.png" alt="Vocaid Logo" width="200"/>
</p>

<p align="center">
  <strong>AI-Powered Mock Interview Platform</strong><br>
  Practice interviews with an intelligent AI interviewer and receive instant, actionable feedback.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## Features

### 🎯 AI Mock Interviews
- **Voice-based interviews** powered by Retell AI with real-time conversation
- **Field-specific interviews** for Engineering, Marketing, AI/ML, Agriculture, and Physics
- **15-minute timed sessions** with automatic warnings and graceful endings
- **Resume congruency detection** - AI verifies your resume matches the job description

### 🔐 Authentication
- First-party, cookie-based sessions managed by the backend
- Sign-up/sign-in via the app’s auth flow

### 💳 Payment System (MercadoPago)
- **Three credit packages**: Starter (5), Intermediate (10), Professional (15)
- Prices displayed in USD, processed in BRL
- Secure popup checkout flow
- Automatic credit addition via webhooks
- Payment status polling for real-time updates

### 📊 Credit System
- Credits required to start interviews
- Automatic deduction when interview begins
- Credit restoration for technical issues (mic failures)
- Real-time credit display in UI

### 📈 Feedback & Reports
- **AI-generated feedback** analyzing interview performance
- **Star rating** visualization (1-5 scale)
- **Structured feedback**: Strengths, Areas for Improvement, Recommendations
- **PDF download** of complete feedback report
- Markdown rendering for rich text display

### 🎨 Audio Visualizer
- Real-time 3D audio visualization using Three.js
- Separate visualizations for agent and user audio
- Responsive design with animated bars

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (for interviews)

### Installation

```bash
# Clone repository
git clone https://github.com/alefnsc/Vocaid-frontend.git
cd Vocaid-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys (see below)

# Start development server
npm start
```

App runs at http://localhost:3000

### Environment Variables

Create a `.env` file in the project root:

```env
# Google reCAPTCHA v3
# Get keys at: https://www.google.com/recaptcha/admin
REACT_APP_RECAPTCHA_SITE_KEY=your_site_key_here

# MercadoPago (Required for Payments)
# Get keys at: https://www.mercadopago.com/developers/panel/credentials
REACT_APP_MERCADOPAGO_PUBLIC_KEY=APP_USR-your_key_here

# Backend URL (Required for Interviews)
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_API_URL=http://localhost:3001
```

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 with TypeScript |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Authentication | First-party sessions (cookies) |
| Payments | MercadoPago SDK |
| Voice Calls | Retell Web Client |
| 3D Graphics | Three.js + React Three Fiber |
| PDF Generation | jsPDF |
| Testing | Jest + Cypress |

### Project Structure

```
src/
├── components/
│   ├── audio-visualizer/     # 3D audio visualization
│   ├── credit-packages/      # Payment packages UI
│   ├── credits-modal/        # Credits purchase modal
│   ├── input-form/           # Interview setup form
│   ├── interview-content/    # Interview UI components
│   ├── mic-permission-modal/ # Microphone access modal
│   ├── quit-interview-modal/ # Interview exit confirmation
│   └── ui/                   # Reusable UI components
├── hooks/
│   ├── use-auth-check/       # Authentication & credits
│   ├── use-call-manager/     # Retell call management
│   ├── use-credits-restoration/ # Credit recovery
│   ├── use-interview-timer/  # 15-min timer
│   └── use-token-validation/ # Session validation
├── pages/
│   ├── Home/                 # Landing page + form
│   ├── Interview/            # Live interview page
│   ├── Feedback/             # AI feedback results
│   ├── PaymentResult/        # Payment status
│   └── ContactThankYou/      # Contact confirmation
├── services/
│   ├── APIService.ts         # Backend API calls
│   └── MercadoPagoService.ts # Payment processing
└── App.tsx                   # Main app + routing
```

### Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOME PAGE                                │
│  ┌─────────────────┐    ┌─────────────────────────────────┐    │
│  │   Body Copy     │    │        Input Form               │    │
│  │   - Features    │    │  - Company, Job Title           │    │
│  │   - CTA Button  │    │  - Job Description              │    │
│  └─────────────────┘    │  - Resume Upload (PDF)          │    │
│                         │  - Credit Check → Payment Modal  │    │
│                         └─────────────────────────────────┘    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INTERVIEW PAGE                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Mic Permission → Retell Connection → AI Conversation   │   │
│  │  - Audio Visualizer (3D bars)                           │   │
│  │  - Timer (15 min max)                                   │   │
│  │  - Quit button                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FEEDBACK PAGE                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  - Star Rating (1-5)                                    │   │
│  │  - Summary                                              │   │
│  │  - Strengths / Areas for Improvement / Recommendations  │   │
│  │  - PDF Download                                         │   │
│  │  - Retry Interview button                               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Features Deep Dive

### Interview System

1. **Form Submission**: User fills company, job title, job description, uploads resume
2. **Credit Check**: System verifies user has available credits
3. **Call Registration**: Backend registers call with Retell, returns access token
4. **Voice Connection**: Retell Web Client connects via WebSocket
5. **AI Conversation**: Custom LLM (backend) processes responses with field-specific prompts
6. **Auto-termination**: Interview ends at 15 minutes or on congruency mismatch
7. **Feedback Generation**: AI analyzes transcript and generates structured feedback

### Payment Flow

```
User selects package → Backend creates MercadoPago preference
       ↓
Popup opens with MercadoPago checkout
       ↓
User completes payment → Webhook notifies backend
       ↓
Backend adds credits via internal credits ledger
       ↓
Frontend polls for credit update → UI refreshes
```

### Credit Packages

| Package | Credits | Price (USD) | Price (BRL) | Per Interview |
|---------|---------|-------------|-------------|---------------|
| Starter | 5 | $3.99 | R$ 23.94 | $0.80 |
| Intermediate | 10 | $5.99 | R$ 35.94 | $0.60 |
| Professional | 15 | $7.99 | R$ 47.94 | $0.53 |

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests (Cypress)

```bash
# Interactive mode
npm run cypress:open

# Headless mode
npm run cypress:run
```

### Test Coverage

```bash
npm test -- --coverage
```

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - `REACT_APP_RECAPTCHA_SITE_KEY`
   - `REACT_APP_MERCADOPAGO_PUBLIC_KEY`
   - `REACT_APP_BACKEND_URL`
   - `REACT_APP_API_URL`
3. Deploy

```bash
# Manual deploy
vercel --prod
```

---

## Configuration

### reCAPTCHA Setup

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create a new site with reCAPTCHA v3
3. Add domains:
   - `localhost` (for development)
   - Your production domain
4. Copy Site Key to `REACT_APP_RECAPTCHA_SITE_KEY`

---

## Troubleshooting

### Interview Not Starting

1. Check backend is running and accessible
2. Verify `REACT_APP_BACKEND_URL` is correct
3. Ensure user has available credits
4. Check browser microphone permissions

### Payment Not Completing

1. Verify MercadoPago credentials
2. Check backend webhook endpoint is accessible
3. Look for errors in browser console
4. Verify ngrok tunnel (if using for webhooks)

### Credits Not Updating

1. Ensure backend webhook received payment notification
2. Try refreshing the page or signing out/in

---

## Security Notes

- Never commit `.env` files
- Use test keys for development, live keys for production
- All payments processed securely via MercadoPago
- User sessions are managed server-side

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT

---

## Support

For issues or questions:
- Open a GitHub issue
- Use the in-app Contact Us form
