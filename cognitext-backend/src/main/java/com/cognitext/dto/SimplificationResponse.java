package com.cognitext.dto;

public class SimplificationResponse {
    
    private String simplifiedText;
    private Integer gradeLevel;
    private String status;
    private long timestamp;
    
    // Constructors
    public SimplificationResponse() {
        this.timestamp = System.currentTimeMillis();
    }
    
    public SimplificationResponse(String simplifiedText, Integer gradeLevel, String status) {
        this.simplifiedText = simplifiedText;
        this.gradeLevel = gradeLevel;
        this.status = status;
        this.timestamp = System.currentTimeMillis();
    }
    
    // Getters and Setters
    public String getSimplifiedText() {
        return simplifiedText;
    }
    
    public void setSimplifiedText(String simplifiedText) {
        this.simplifiedText = simplifiedText;
    }
    
    public Integer getGradeLevel() {
        return gradeLevel;
    }
    
    public void setGradeLevel(Integer gradeLevel) {
        this.gradeLevel = gradeLevel;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}