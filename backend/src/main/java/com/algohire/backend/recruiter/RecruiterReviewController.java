package com.algohire.backend.recruiter;

import com.algohire.backend.submission.Submission;
import com.algohire.backend.submission.SubmissionRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recruiter/reviews")
@PreAuthorize("hasRole('RECRUITER')")
public class RecruiterReviewController {

    private final SubmissionRepository repository;

    public RecruiterReviewController(SubmissionRepository repository) {
        this.repository = repository;
    }

    // 1️⃣ View all suspicious submissions
    @GetMapping("/suspicious")
    public List<Submission> suspicious() {
        return repository.findBySuspiciousTrue();
    }

    // 2️⃣ Approve submission
    @PostMapping("/{id}/approve")
    public Submission approve(@PathVariable String id) {
        Submission s = repository.findById(id).orElseThrow();
        s.setReviewStatus("APPROVED");
        return repository.save(s);
    }

    // 3️⃣ Reject submission
    @PostMapping("/{id}/reject")
    public Submission reject(@PathVariable String id) {
        Submission s = repository.findById(id).orElseThrow();
        s.setReviewStatus("REJECTED");
        s.setVerdict("DISQUALIFIED");
        return repository.save(s);
    }
}
