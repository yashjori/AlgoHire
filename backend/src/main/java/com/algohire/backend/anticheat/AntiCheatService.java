package com.algohire.backend.anticheat;

import com.algohire.backend.execution.ExecutionRequest;
import org.springframework.stereotype.Service;
import com.algohire.backend.anticheat.AntiCheatResult;

import java.util.ArrayList;
import java.util.List;

@Service
public class AntiCheatService {

    public AntiCheatResult analyze(ExecutionRequest request) {

        List<String> reasons = new ArrayList<>();

        // B️⃣ TIME-BASED CHECK
        if (request.getSolveTimeMs() < 10_000) { // <10 seconds
            reasons.add("Solved too fast");
        }

        if (request.getCode().length() > 300 && request.getSolveTimeMs() < 20_000) {
            reasons.add("Large code submitted too quickly");
        }

        // D️⃣ CLIENT SIGNALS
        if (request.getTabSwitches() > 5) {
            reasons.add("Too many tab switches");
        }

        if (request.getCopyEvents() > 2) {
            reasons.add("Multiple copy-paste events");
        }

        boolean suspicious = !reasons.isEmpty();

        return new AntiCheatResult(suspicious, reasons);
    }
}
