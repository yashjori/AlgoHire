package com.algohire.backend.submission;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SubmissionRepository extends MongoRepository<Submission, String> {

    List<Submission> findByCandidateEmail(String email);

    List<Submission> findByProblemId(String problemId);
    List<Submission> findBySuspiciousTrue();
    List<Submission> findByReviewStatus(String status);

}
