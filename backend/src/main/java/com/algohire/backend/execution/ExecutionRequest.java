package com.algohire.backend.execution;

import java.util.List;

public class ExecutionRequest {

    /** Supported: JAVA, PYTHON, CPP, JAVASCRIPT, TYPESCRIPT, GO, RUST */
    private String language;

    private String problemId;
    private String code;

    private List<TestCaseDTO> testCases;
    private long timeLimitMs = 2000;

    // Anti-cheat signals
    private long solveTimeMs;
    private int tabSwitches;
    private int copyEvents;

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public List<TestCaseDTO> getTestCases() { return testCases; }
    public void setTestCases(List<TestCaseDTO> testCases) { this.testCases = testCases; }

    public long getTimeLimitMs() { return timeLimitMs; }
    public void setTimeLimitMs(long timeLimitMs) { this.timeLimitMs = timeLimitMs; }

    public long getSolveTimeMs() { return solveTimeMs; }
    public void setSolveTimeMs(long solveTimeMs) { this.solveTimeMs = solveTimeMs; }

    public int getTabSwitches() { return tabSwitches; }
    public void setTabSwitches(int tabSwitches) { this.tabSwitches = tabSwitches; }

    public int getCopyEvents() { return copyEvents; }
    public void setCopyEvents(int copyEvents) { this.copyEvents = copyEvents; }
}
