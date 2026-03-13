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

    /** Candidate: view own submissions */
    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public List<Submission> mySubmissions(Authentication auth) {
        return repository.findByCandidateEmail(auth.getName());
    }

    /** Candidate: view own submissions for a specific problem */
    @GetMapping("/problem/{problemId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public List<Submission> byProblem(@PathVariable String problemId, Authentication auth) {
        return repository.findByCandidateEmail(auth.getName())
                .stream()
                .filter(s -> problemId.equals(s.getProblemId()))
                .toList();
    }

    /** Recruiter: view ALL submissions across all candidates */
    @GetMapping
    @PreAuthorize("hasRole('RECRUITER')")
    public List<Submission> allSubmissions() {
        return repository.findAll();
    }
}
