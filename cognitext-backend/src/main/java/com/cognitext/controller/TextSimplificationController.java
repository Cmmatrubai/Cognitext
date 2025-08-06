package com.cognitext.controller;

import com.cognitext.dto.SimplificationRequest;
import com.cognitext.dto.SimplificationResponse;
import com.cognitext.service.TextSimplificationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*") // Allow Electron app to connect
public class TextSimplificationController {

    @Autowired
    private TextSimplificationService simplificationService;

    @PostMapping("/simplify")
    public ResponseEntity<SimplificationResponse> simplifyText(
            @Valid @RequestBody SimplificationRequest request) {
        
        try {
            String simplifiedText = simplificationService.simplifyToGradeLevel(
                request.getText(), 
                request.getGradeLevel()
            );
            
            SimplificationResponse response = new SimplificationResponse(
                simplifiedText,
                request.getGradeLevel(),
                "success"
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            SimplificationResponse errorResponse = new SimplificationResponse(
                "Failed to simplify text: " + e.getMessage(),
                request.getGradeLevel(),
                "error"
            );
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Cognitext Backend is running! 🚀");
    }
}