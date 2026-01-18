package com.algohire.backend.execution;

import java.util.List;

public class ExecutionRequest {

    private String language;      // JAVA
    private String problemId;
    private String code;
    private List<TestCaseDTO> testCases;
    private int timeLimitMs;

    // 🔐 Anti-cheat signals (B & D)
    private long solveTimeMs;     // frontend measured
    private int tabSwitches;
    private int copyEvents;

    // ---------- getters & setters ----------

    public String getLanguage() {
        return language;
    }
    public void setLanguage(String language) {
        this.language = language;
    }

    public String getProblemId() {
        return problemId;
    }
    public void setProblemId(String problemId) {
        this.problemId = problemId;
    }

    public String getCode() {
        return code;
    }
    public void setCode(String code) {
        this.code = code;
    }

    public List<TestCaseDTO> getTestCases() {
        return testCases;
    }
    public void setTestCases(List<TestCaseDTO> testCases) {
        this.testCases = testCases;
    }

    public int getTimeLimitMs() {
        return timeLimitMs;
    }
    public void setTimeLimitMs(int timeLimitMs) {
        this.timeLimitMs = timeLimitMs;
    }

    // 🕵️ Anti-cheat getters
    public long getSolveTimeMs() {
        return solveTimeMs;
    }
    public void setSolveTimeMs(long solveTimeMs) {
        this.solveTimeMs = solveTimeMs;
    }

    public int getTabSwitches() {
        return tabSwitches;
    }
    public void setTabSwitches(int tabSwitches) {
        this.tabSwitches = tabSwitches;
    }

    public int getCopyEvents() {
        return copyEvents;
    }
    public void setCopyEvents(int copyEvents) {
        this.copyEvents = copyEvents;
    }
}
