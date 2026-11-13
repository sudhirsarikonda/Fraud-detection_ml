# AGENTS.md

# FraudShield AI – Smart Financial Fraud Detection System

## 1. Project Overview

FraudShield AI is a machine-learning-powered financial fraud detection and investigation platform.

The application analyzes financial transactions, detects suspicious patterns, calculates fraud risk scores, and provides administrators with actionable insights through an interactive dashboard.

The system combines:
- Machine Learning
- Artificial Intelligence
- Anomaly Detection
- Explainable AI
- Financial Transaction Analytics
- Automated Fraud Alerts

The primary objective is to identify potentially fraudulent transactions accurately while minimizing false positives.

## 2. Project Objectives

1. Detect fraudulent financial transactions using machine learning.
2. Calculate transaction risk scores and fraud probabilities.
3. Identify abnormal transaction patterns.
4. Provide explainable fraud predictions.
5. Generate alerts for suspicious transactions.
6. Provide an AI-powered fraud investigation assistant.
7. Display real-time transaction analytics.
8. Support CSV dataset uploads and batch predictions.

## 3. Technology Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Vite
- Recharts
- Lucide React

### Backend
- Python 3.12+
- FastAPI
- Uvicorn
- Pydantic

### Machine Learning
- Scikit-learn
- Random Forest
- XGBoost
- Isolation Forest
- SHAP
- Pandas
- NumPy

### Database
- PostgreSQL

### Development Tools
- Git
- GitHub
- VS Code
- Postman

## 4. Application Architecture

Follow a modular architecture.

Frontend responsibilities:
- User interface
- Authentication screens
- Transaction management
- Dashboard analytics
- Fraud alerts
- AI assistant interface
- Dataset management

Backend responsibilities:
- API routing
- Request validation
- Authentication and authorization
- Database operations
- ML prediction integration
- Fraud alert generation
- Analytics processing

Machine learning responsibilities:
- Dataset preprocessing
- Feature engineering
- Model training
- Model evaluation
- Fraud classification
- Anomaly detection
- Explainability

Never mix frontend UI logic with machine learning model implementation.

## 5. Frontend Development Rules

- Use reusable React components.
- Use TypeScript for all new frontend components.
- Follow consistent naming conventions.
- Use Tailwind CSS for styling.
- Maintain responsive layouts.
- Use Lucide React for icons.
- Use Recharts for analytics visualizations.
- Implement loading, error and empty states.
- Avoid unnecessary dependencies.
- Maintain consistent colors, typography and spacing.

### Design Guidelines

Use a premium fintech dashboard design.

Theme:
- Dark navy background.
- Charcoal panels.
- Electric blue and purple accents.
- Red for fraudulent transactions.
- Green for legitimate transactions.
- Yellow/orange for medium-risk transactions.

Maintain professional visual consistency across every page.

## 6. Backend Development Rules

- Use FastAPI.
- Implement modular routers.
- Use Pydantic schemas for request validation.
- Separate database, services, models and routes.
- Use environment variables for sensitive configuration.
- Implement structured exception handling.
- Use appropriate HTTP status codes.
- Add API documentation through Swagger.
- Never hardcode API credentials.
- Never expose database credentials in frontend code.

Suggested backend structure:

backend/
- main.py
- routes/
- schemas/
- services/
- database/
- ml/
- utils/
- requirements.txt

## 7. Machine Learning Guidelines