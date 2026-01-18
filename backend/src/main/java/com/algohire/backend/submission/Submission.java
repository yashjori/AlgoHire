package com.algohire.backend.submission;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "submissions")
public class Submission {

    @Id
    private String id;

    private String problemId;
    private String candidateEmail;

    private String language;
    private String code;

    private String verdict;
    private long executionTimeMs;

    // 🔐 Anti-cheat
    private boolean suspicious;
    private String cheatReason;

    private long solveTimeMs;
    private int tabSwitches;
    private int copyEvents;
    private String reviewStatus; 

    private Instant submittedAt = Instant.now();

    // -------- getters & setters --------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }

    public String getCandidateEmail() { return candidateEmail; }
    public void setCandidateEmail(String candidateEmail) {
        this.candidateEmail = candidateEmail;
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getVerdict() { return verdict; }
    public void setVerdict(String verdict) { this.verdict = verdict; }

    public long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }

    public boolean isSuspicious() { return suspicious; }
    public void setSuspicious(boolean suspicious) {
        this.suspicious = suspicious;
    }

    public String getCheatReason() { return cheatReason; }
    public void setCheatReason(String cheatReason) {
        this.cheatReason = cheatReason;
    }

    public long getSolveTimeMs() { return solveTimeMs; }
    public void setSolveTimeMs(long solveTimeMs) {
        this.solveTimeMs = solveTimeMs;
    }

    public int getTabSwitches() { return tabSwitches; }
    public void setTabSwitches(int tabSwitches) {
        this.tabSwitches = tabSwitches;
    }

    public int getCopyEvents() { return copyEvents; }
    public void setCopyEvents(int copyEvents) {
        this.copyEvents = copyEvents;
    }

    public Instant getSubmittedAt() { return submittedAt; }
	public String getReviewStatus() {
		return reviewStatus;
	}
	public void setReviewStatus(String reviewStatus) {
		this.reviewStatus = reviewStatus;
	}
}
