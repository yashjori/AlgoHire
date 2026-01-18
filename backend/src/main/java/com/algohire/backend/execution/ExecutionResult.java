package com.algohire.backend.execution;

import lombok.Data;

@Data
public class ExecutionResult {

    private String verdict;   // ACCEPTED, WA, TLE, ERROR
    private long executionTimeMs;
    public String getVerdict() {
		return verdict;
	}
	public void setVerdict(String verdict) {
		this.verdict = verdict;
	}
	public long getExecutionTimeMs() {
		return executionTimeMs;
	}
	public void setExecutionTimeMs(long executionTimeMs) {
		this.executionTimeMs = executionTimeMs;
	}
	public String getError() {
		return error;
	}
	public void setError(String error) {
		this.error = error;
	}
	private String error;
}
