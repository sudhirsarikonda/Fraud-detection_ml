# Project: Smart AI-Powered Fraud Detection System

Build a complete, modern, professional, full-stack web application named **FraudShield AI – Smart Financial Fraud Detection System**.

The application should use Machine Learning and Artificial Intelligence to detect suspicious financial transactions, calculate fraud risk scores, identify abnormal transaction patterns, and help administrators investigate potential fraud.

The UI must look like a premium fintech cybersecurity platform, not a basic college project.

## 1. Design and UI Requirements

Create a premium dark-themed dashboard.

Design preferences:
- Dark navy and charcoal background.
- Electric blue and purple accent colors.
- Red for high-risk fraud alerts.
- Green for legitimate transactions.
- Modern glassmorphism cards.
- Smooth animations and transitions.
- Responsive design for desktop, tablet and mobile.
- Professional typography.
- Interactive charts and tables.
- Modern sidebar navigation.
- Clean spacing and consistent components.

Use React, TypeScript, Tailwind CSS and Recharts.

## 2. Authentication

Create a login page with:
- Email and password authentication.
- Password visibility toggle.
- Remember me.
- Forgot password.
- Form validation.
- Protected dashboard routes.
- Logout functionality.

Create an admin role for managing fraud monitoring and investigations.

## 3. Admin Dashboard

Create a comprehensive analytics dashboard.

Display these KPI cards:

- Total Transactions.
- Fraudulent Transactions.
- Legitimate Transactions.
- Fraud Detection Rate.
- Total Suspicious Amount.
- High-Risk Transactions.

Include:
- Transaction activity line chart.
- Fraud versus legitimate transaction pie chart.
- Daily fraud detection bar chart.
- Fraud trends over time.
- Recent suspicious transactions.
- Latest fraud alerts.
- Fraud risk distribution.

All dashboard metrics should be dynamically calculated from the transaction database.

## 4. Transaction Monitoring

Create a transaction management page.

Display a searchable and filterable table containing:

- Transaction ID.
- User/Account ID.
- Transaction Amount.
- Transaction Type.
- Transaction Location.
- Transaction Date and Time.
- Fraud Probability.
- Risk Score.
- Prediction Status.

Add filters:
- All Transactions.
- Fraudulent.
- Legitimate.
- High Risk.
- Medium Risk.
- Low Risk.

Add pagination and transaction detail views.

Allow administrators to manually enter transaction details and submit them for fraud prediction.

## 5. Machine Learning Fraud Detection

Integrate a Python FastAPI backend for ML predictions.

Use these models:

- Random Forest for fraud classification.
- XGBoost for advanced fraud prediction.
- Isolation Forest for anomaly detection.

The system should analyze:

- Transaction amount.
- Transaction frequency.
- Transaction type.
- Transaction time.
- Previous transaction patterns.
- Account behavior.
- Location changes.
- Device and IP information when available.

Generate:
- Fraud probability between 0 and 100%.
- Risk score between 0 and 100.
- Fraud classification.
- Anomaly detection result.

Risk classification:
- 0–30: Low Risk.
- 31–70: Medium Risk.
- 71–100: High Risk.

Make risk thresholds configurable.

IMPORTANT: Do not fake machine learning predictions. Create a proper API integration layer that sends transaction features to the Python backend and displays actual model predictions. If the backend is unavailable, show a clearly labelled demo mode rather than pretending a real ML model was used.

## 6. AI Fraud Investigation Assistant

Create an AI chatbot named FraudShield Assistant.

The chatbot should help administrators investigate suspicious transactions.

Example questions:

- Why was this transaction marked as fraudulent?
- Explain the risk score of transaction TXN1024.
- Show the top 10 suspicious transactions.
- What are the most common fraud patterns?
- Summarize today's fraud activity.
- Identify unusual transaction behavior.
- Explain why a transaction was flagged.

Display answers in a clean conversational interface.

Use transaction database context and actual ML prediction explanations. Never invent transaction records or investigation results.

## 7. Explainable AI

Integrate SHAP-based explainability.

When an administrator opens a suspicious transaction, display:

- Main factors contributing to fraud prediction.
- Positive and negative feature contributions.
- Risk explanation.
- Feature importance visualization.

Example:
Transaction flagged because:
1. Transaction amount is unusually high.
2. Multiple transactions occurred within a short period.
3. Transaction location differs from normal activity.
4. Account behavior is unusual.

Show the explanation using visual charts.

## 8. Fraud Alerts and Investigation Center

Create a dedicated alert management page.

Features:
- Real-time alert updates through backend events.
- High-risk transaction notifications.
- Suspicious account activity alerts.
- Alert severity classification.
- Investigation status tracking.

Allow admins to:
- Mark alerts as under investigation.
- Mark cases as confirmed fraud.
- Mark cases as legitimate.
- Add investigation notes.
- View previous investigation history.

## 9. Anomaly Detection

Create a separate anomaly monitoring page.

Display:
- Unusual transaction amounts.
- Abnormal transaction frequency.
- Suspicious account behavior.
- Unusual transaction timing.
- Location anomalies.

Use Isolation Forest predictions from the backend.

## 10. Analytics and Reports

Create an advanced fraud analytics page.

Include:
- Fraud detection trends.
- Fraudulent amount by transaction type.
- Fraud by location.
- Fraud detection model performance.
- Precision, recall, F1-score and PR-AUC.
- Confusion matrix.
- Model comparison chart.

Allow exporting reports as CSV and PDF.

## 11. Dataset Upload

Create a dataset management page.

Allow admins to:
- Upload CSV datasets.
- Preview uploaded data.
- Validate column names.
- Detect missing values.
- Process datasets.
- Run batch fraud predictions.
- Download prediction results.

Display total processed records, detected fraud cases and legitimate transactions.

## 12. Database and Backend

Use:
- React + TypeScript.
- Tailwind CSS.
- FastAPI (Python).
- PostgreSQL.
- Scikit-learn.
- XGBoost.
- SHAP.
- Recharts.

Create proper database tables for:
- Admin users.
- Transactions.
- Fraud predictions.
- Fraud alerts.
- Investigation records.
- Dataset uploads.
- Model evaluation results.

Create REST API endpoints for authentication, transaction submission, fraud prediction, analytics, alerts, investigations and dataset uploads.

## 13. Navigation Sidebar

Create these sidebar menu items:

1. Overview
2. Transactions
3. Fraud Detection
4. Anomaly Monitoring
5. Fraud Alerts
6. AI Investigation Assistant
7. Analytics & Reports
8. Dataset Management
9. Model Performance
10. Settings
11. Logout

## 14. Important Functional Requirements

- All buttons must work.
- All pages must have proper navigation.
- All charts must use actual database data.
- All filters and search options must work.
- Forms must have validation.
- Use reusable React components.
- Use loading states and error messages.
- Do not use static placeholder metrics as real results.
- Include realistic sample transactions only in clearly labelled demo mode.
- Ensure API integration is structured and ready for the Python ML backend.

## 15. Final Goal

The final result should look and feel like a real financial cybersecurity product used by a fintech company.

Prioritize:
1. Professional UI/UX.
2. Functional transaction management.
3. Actual ML model integration.
4. Explainable AI.
5. Intelligent fraud investigation.
6. Real-time monitoring.
7. Accurate analytics.

Build the application with a clean, scalable architecture and a polished, presentation-ready interface.