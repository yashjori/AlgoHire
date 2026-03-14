package com.algohire.backend.anticheat;

import com.algohire.backend.execution.ExecutionRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AntiCheatService {

    public AntiCheatResult analyze(ExecutionRequest request) {
        List<String> reasons = new ArrayList<>();

        long solveMs = request.getSolveTimeMs();

        // Solved impossibly fast (< 30 seconds) AND code is non-trivial
        if (solveMs < 30_000 && request.getCode() != null && request.getCode().length() > 50) {
            reasons.add("Solution submitted in under 30 seconds");
        }

        // Large solution (>500 chars) submitted very quickly (<60s)
        if (request.getCode() != null && request.getCode().length() > 500 && solveMs < 60_000) {
            reasons.add("Large solution submitted suspiciously fast");
        }

        // Excessive tab switches (may indicate looking up solutions)
        if (request.getTabSwitches() > 15) {
            reasons.add("Excessive tab switches: " + request.getTabSwitches());
        }

        // Multiple paste events (may indicate pasted code)
        if (request.getCopyEvents() > 5) {
            reasons.add("Multiple paste events detected: " + request.getCopyEvents());
        }

        return new AntiCheatResult(!reasons.isEmpty(), reasons);
    }
}
