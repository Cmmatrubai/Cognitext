package com.cognitext.service;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Map;
import java.util.List;

@Service
public class TextSimplificationService {

    private final WebClient webClient;
    private final String geminiApiKey;
    private final ObjectMapper objectMapper;

    public TextSimplificationService(@Value("${gemini.api.key:}") String apiKey) {
        this.geminiApiKey = apiKey;
        this.webClient = WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                .build();
        this.objectMapper = new ObjectMapper();
        
        if (apiKey == null || apiKey.isEmpty()) {
            System.out.println("⚠️  Gemini API key not configured. Using mock responses.");
        } else {
            System.out.println("✅ Gemini API configured successfully!");
        }
    }

    public String simplifyToGradeLevel(String text, int gradeLevel) {
        // If no API key is configured, return a mock response for testing
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            return getMockSimplification(text, gradeLevel);
        }

        try {
            String prompt = getSystemPrompt(gradeLevel) + "\n\nText to simplify:\n" + text;
            
            // Build request for Gemini API
            Map<String, Object> request = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", prompt)
                    ))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.3,
                    "maxOutputTokens", 500
                )
            );

            String response = webClient.post()
                    .uri("/models/gemini-2.0-flash-exp:generateContent?key=" + geminiApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseGeminiResponse(response);

        } catch (Exception e) {
            System.err.println("Gemini API error: " + e.getMessage());
            // Fallback to mock response
            return getMockSimplification(text, gradeLevel);
        }
    }

    private String parseGeminiResponse(String response) {
        try {
            JsonNode jsonNode = objectMapper.readTree(response);
            JsonNode candidates = jsonNode.get("candidates");
            if (candidates != null && candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).get("content");
                if (content != null) {
                    JsonNode parts = content.get("parts");
                    if (parts != null && parts.isArray() && parts.size() > 0) {
                        JsonNode text = parts.get(0).get("text");
                        if (text != null) {
                            return text.asText().trim();
                        }
                    }
                }
            }
            return "Failed to parse Gemini response";
        } catch (Exception e) {
            System.err.println("Error parsing Gemini response: " + e.getMessage());
            return "Error parsing AI response";
        }
    }

    private String getSystemPrompt(int gradeLevel) {
        return String.format(
            "Simplify this text for a %d-grade reading level. Provide only the simplified text without any introductory sentences or explanations about the reading level. " +
            "Rules: " +
            "1. Use simple, common words " +
            "2. Write shorter sentences " +
            "3. Explain complex concepts in simple terms " +
            "4. Keep the same meaning and important information " +
            "5. Make it engaging and clear " +
            "6. Don't add extra information not in the original text " +
            "7. Start directly with the simplified content - no meta-commentary",
            gradeLevel
        );
    }

    private String buildPrompt(String text, int gradeLevel) {
        return String.format(
            "Please rewrite this text for a %d-grade reading level:\n\n%s",
            gradeLevel, text
        );
    }

    private String getMockSimplification(String text, int gradeLevel) {
        // Simple mock that makes the text shorter and simpler
        String[] sentences = text.split("\\. ");
        StringBuilder simplified = new StringBuilder();
        
        for (String sentence : sentences) {
            // Simulate simplification by making sentences shorter
            if (sentence.length() > 50) {
                simplified.append(sentence.substring(0, 50).replaceAll("[^a-zA-Z0-9\\s]", ""));
                simplified.append("...");
            } else {
                simplified.append(sentence.replaceAll("[^a-zA-Z0-9\\s]", ""));
            }
            simplified.append(". ");
        }
        
        return String.format(
            "%s",
            simplified.toString().trim()
        );
    }
}