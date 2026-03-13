package com.algohire.backend.execution;

import com.algohire.backend.submission.Submission;
import com.algohire.backend.submission.SubmissionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/execute")
public class ExecutionController {

    private final CodeExecutionService service;
    private final SubmissionRepository submissionRepository;

    public ExecutionController(CodeExecutionService service, SubmissionRepository submissionRepository) {
        this.service = service;
        this.submissionRepository = submissionRepository;
    }

    /** Submit: saves a PENDING submission and queues for async execution */
    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public Map<String, String> submit(@RequestBody ExecutionRequest request) {
        String jobId = service.enqueue(request);
        return Map.of("jobId", jobId, "status", "QUEUED");
    }

    /** Run: run against sample test cases WITHOUT saving a submission */
    @PostMapping("/run")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ExecutionResult run(@RequestBody ExecutionRequest request) {
        return service.executeOnly(request);
    }

    /** Poll: check the result of an async submission by jobId */
    @GetMapping("/result/{jobId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ExecutionResult> getResult(@PathVariable String jobId) {
        Optional<Submission> opt = submissionRepository.findById(jobId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Submission s = opt.get();
        ExecutionResult result = new ExecutionResult();
        result.setVerdict(s.getVerdict());
        result.setExecutionTimeMs(s.getExecutionTimeMs());
        return ResponseEntity.ok(result);
    }
}
