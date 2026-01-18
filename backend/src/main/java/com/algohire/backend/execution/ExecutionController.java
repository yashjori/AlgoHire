package com.algohire.backend.execution;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/execute")
public class ExecutionController {

    private final CodeExecutionService service;

    public ExecutionController(CodeExecutionService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public Map<String, String> submit(@RequestBody ExecutionRequest request) {

        String jobId = service.enqueue(request);

        return Map.of(
            "jobId", jobId,
            "status", "QUEUED"
        );
    }
}

