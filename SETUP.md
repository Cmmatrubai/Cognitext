# Cognitext Setup Guide

## Security Setup: Environment Variables

Your `application.yml` file now references environment variables instead of hard-coded API keys. Here's how to set them up:

### 1. Create Environment File

In the `cognitext-backend` directory, create a `.env` file:

```bash
cd cognitext-backend
cp ../env.example .env
```

### 2. Add Your API Key

Edit the `.env` file and replace `your_actual_api_key_here` with your real Gemini API key:

```env
# Get your Gemini API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSy...your_real_key_here
```

### 3. Verify Setup

The `.env` file is automatically ignored by Git (check `.gitignore`), so your API key will never be committed to the repository.

### 4. Running the Application

Now you can run the backend safely:

```bash
cd cognitext-backend
./mvnw spring-boot:run
```

To change production or local, go to main.js and search for the the line (const config) and switch to each one depeneding on what env you
are using
