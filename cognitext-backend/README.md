# Cognitext Backend

AI-powered text simplification service built with Spring Boot.

## Features

- **Text Simplification**: Converts complex text to specified grade levels (1-12)
- **Gemini AI Integration**: Uses Google's Gemini 2.0 Flash Experimental for intelligent text rewriting
- **Mock Mode**: Falls back to mock responses when API key is not configured
- **CORS Enabled**: Ready for Electron frontend integration

## Quick Start

### Prerequisites

- Java 17+
- Maven 3.6+
- (Optional) Google Gemini API key

### Running the Service

1. **Start the server:**

   ```bash
   cd cognitext-backend
   ./mvnw spring-boot:run
   ```

2. **Test the health endpoint:**

   ```bash
   curl http://localhost:8080/api/v1/health
   ```

3. **Test text simplification:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/simplify \
     -H "Content-Type: application/json" \
     -d '{
       "text": "The utilization of sophisticated technological methodologies can significantly enhance operational efficiency.",
       "gradeLevel": 4
     }'
   ```

### Configuration

Set your Gemini API key as an environment variable:

```bash
export GEMINI_API_KEY=your-api-key-here
```

To get a free Gemini API key:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and set it as an environment variable

Without an API key, the service will use mock responses for testing.

## API Endpoints

### POST `/api/v1/simplify`

Simplifies text to a specified grade level.

**Request Body:**

```json
{
  "text": "Complex text to simplify",
  "gradeLevel": 4
}
```

**Response:**

```json
{
  "simplifiedText": "Easy text that kids can read",
  "gradeLevel": 4,
  "status": "success",
  "timestamp": 1234567890
}
```

### GET `/api/v1/health`

Returns service health status.
