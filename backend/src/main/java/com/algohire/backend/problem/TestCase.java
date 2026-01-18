package com.algohire.backend.problem;

import lombok.Data;

@Data
public class TestCase {
    public String getInput() {
		return input;
	}
	public void setInput(String input) {
		this.input = input;
	}
	public String getExpectedOutput() {
		return expectedOutput;
	}
	public void setExpectedOutput(String expectedOutput) {
		this.expectedOutput = expectedOutput;
	}
	private String input;
    private String expectedOutput;
}
