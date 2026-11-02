# FinBridge - Next Steps

## Status: COMPLETE ✅
All phases implemented and tested. The application is fully operational.

## How to Start the Application

### Start Backend
```
cd backend
npm run dev    # uses nodemon + tsx
```
OR for quick start:
```
cd backend
npx tsx src/index.ts
```

### Start Frontend (separate terminal)
```
cd frontend
npm run dev
```

## URLs when running
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Swagger Docs: http://localhost:3001/api-docs

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Customer | customer@finbridge.dev | demo1234 |
| FinTech Developer | developer@finbridge.dev | demo1234 |
| Bank Admin | admin@finbridge.dev | demo1234 |

## Demo Workflow for Evaluator
1. Open http://localhost:5173
2. Click "Get Started" → Register a new account OR use demo credentials
3. As **customer**: Connect a bank → view accounts → make a payment → view transactions
4. As **developer**: Generate API key → test sandbox → view logs
5. As **developer**: Go to Consent → click "Request Consent" → enter Customer ID from their dashboard
6. As **customer**: Go to Consent → approve the pending request
7. View Analytics → see charts populated with real data
8. View Security → see architecture explanation

## Customer ID (for consent demo)
Customer user ID: 9929ce61-8008-4b13-b15e-8019b3bbc775
(Visible on Dashboard after login as customer)

## Known Limitations (Academic Demo)
- All payments are sandbox only (no real money)
- Banks are simulated (no real bank APIs)
- OAuth 2.0 flow is simplified (no redirect flows)
- SQLite used instead of PostgreSQL
