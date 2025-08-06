package com.cognitext.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SimplificationRequest {
    
    @NotBlank(message = "Text cannot be empty")
    private String text;
    
    @NotNull(message = "Grade level is required")
    @Min(value = 1, message = "Grade level must be at least 1")
    @Max(value = 12, message = "Grade level must be at most 12")
    private Integer gradeLevel = 4; // Default to 4th grade
    
    // Constructors
    public SimplificationRequest() {}
    
    public SimplificationRequest(String text, Integer gradeLevel) {
        this.text = text;
        this.gradeLevel = gradeLevel;
    }
    
    // Getters and Setters
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
    
    public Integer getGradeLevel() {
        return gradeLevel;
    }
    
    public void setGradeLevel(Integer gradeLevel) {
        this.gradeLevel = gradeLevel;
    }
}