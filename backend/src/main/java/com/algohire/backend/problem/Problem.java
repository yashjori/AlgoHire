package com.algohire.backend.problem;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Problem stored in MongoDB.
 * testCases are hidden (used for judging only).
 * sampleTestCases are shown to candidates as examples.
 */
@Document(collection = "problems")
public class Problem {

    @Id
    private String id;

    private String title;
    private String description;
    private String difficulty;          // EASY | MEDIUM | HARD

    private String inputFormat;
    private String outputFormat;
    private String constraints;

    private List<String> tags     = new ArrayList<>();
    private List<String> hints    = new ArrayList<>();

    /** Hidden from candidates — used for judging */
    private List<TestCase> testCases       = new ArrayList<>();

    /** Shown to candidates as examples */
    private List<TestCase> sampleTestCases = new ArrayList<>();

    private int timeLimitMs   = 2000;
    private int memoryLimitMb = 256;

    private String createdBy;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getInputFormat() { return inputFormat; }
    public void setInputFormat(String inputFormat) { this.inputFormat = inputFormat; }

    public String getOutputFormat() { return outputFormat; }
    public void setOutputFormat(String outputFormat) { this.outputFormat = outputFormat; }

    public String getConstraints() { return constraints; }
    public void setConstraints(String constraints) { this.constraints = constraints; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public List<String> getHints() { return hints; }
    public void setHints(List<String> hints) { this.hints = hints; }

    public List<TestCase> getTestCases() { return testCases; }
    public void setTestCases(List<TestCase> testCases) { this.testCases = testCases; }

    public List<TestCase> getSampleTestCases() { return sampleTestCases; }
    public void setSampleTestCases(List<TestCase> sampleTestCases) { this.sampleTestCases = sampleTestCases; }

    public int getTimeLimitMs() { return timeLimitMs; }
    public void setTimeLimitMs(int timeLimitMs) { this.timeLimitMs = timeLimitMs; }

    public int getMemoryLimitMb() { return memoryLimitMb; }
    public void setMemoryLimitMb(int memoryLimitMb) { this.memoryLimitMb = memoryLimitMb; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
