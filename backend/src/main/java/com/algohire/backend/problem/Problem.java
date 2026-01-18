package com.algohire.backend.problem;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Document(collection = "problems")
public class Problem {

    @Id
    private String id;

    private String title;
    private String description;
    private String difficulty; // EASY, MEDIUM, HARD

    private List<TestCase> testCases;

    public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getDifficulty() {
		return difficulty;
	}

	public void setDifficulty(String difficulty) {
		this.difficulty = difficulty;
	}

	public List<TestCase> getTestCases() {
		return testCases;
	}

	public void setTestCases(List<TestCase> testCases) {
		this.testCases = testCases;
	}

	public int getTimeLimitMs() {
		return timeLimitMs;
	}

	public void setTimeLimitMs(int timeLimitMs) {
		this.timeLimitMs = timeLimitMs;
	}

	public int getMemoryLimitMb() {
		return memoryLimitMb;
	}

	public void setMemoryLimitMb(int memoryLimitMb) {
		this.memoryLimitMb = memoryLimitMb;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

	private int timeLimitMs;
    private int memoryLimitMb;

    private String createdBy; // recruiter email
}
