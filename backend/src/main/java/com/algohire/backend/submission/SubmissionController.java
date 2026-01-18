package com.algohire.backend.submission;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/submissions")
public class SubmissionController {

    private final SubmissionRepository repository;

    public SubmissionController(SubmissionRepository repository) {
        this.repository = repository;
    }

    // Candidate submits code
//    @PostMapping
//    @PreAuthorize("hasRole('CANDIDATE')")
//    public Submission submit(
//            @RequestBody Submission submission,
//            Authentication auth
//    ) {
//        submission.setCandidateEmail(auth.getName());
//
//        // TEMP values — replaced by code execution later
//        submission.setVerdict("PENDING");
//        submission.setScore(0);
//
//        return repository.save(submission);
//    }

    // Candidate views own submissions
    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public List<Submission> mySubmissions(Authentication auth) {
        return repository.findByCandidateEmail(auth.getName());
    }
}
