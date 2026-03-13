package com.algohire.backend.execution;

public class ExecutionResult {

    private String verdict;
    private long executionTimeMs;
    private String error;
    private String message;
    private int testsPassed;
    private int testsTotal;

    public String getVerdict() { return verdict; }
    public void setVerdict(String verdict) { this.verdict = verdict; }

    public long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(long executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public int getTestsPassed() { return testsPassed; }
    public void setTestsPassed(int testsPassed) { this.testsPassed = testsPassed; }

    public int getTestsTotal() { return testsTotal; }
    public void setTestsTotal(int testsTotal) { this.testsTotal = testsTotal; }
}
