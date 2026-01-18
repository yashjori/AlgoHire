package com.algohire.backend.execution;


import com.algohire.backend.execution.ExecutionResult;
import com.algohire.backend.leaderboard.LeaderboardService;
import com.algohire.backend.submission.Submission;
import com.algohire.backend.submission.SubmissionRepository;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ExecutionWorker {

    private final RedisTemplate<String, String> redisTemplate;
    private final CodeExecutionService codeExecutionService;
    private final SubmissionRepository submissionRepository;
    private final LeaderboardService leaderboardService;

    public ExecutionWorker(
            RedisTemplate<String, String> redisTemplate,
            CodeExecutionService codeExecutionService,
            SubmissionRepository submissionRepository,
            LeaderboardService leaderboardService
    ) {
        this.redisTemplate = redisTemplate;
        this.codeExecutionService = codeExecutionService;
        this.submissionRepository = submissionRepository;
        this.leaderboardService = leaderboardService;
    }

    @Scheduled(fixedDelay = 1000)
    public void consumeQueue() {

        String submissionId =
                redisTemplate.opsForList().leftPop("execution-queue");

        if (submissionId == null) return;

        Submission submission =
                submissionRepository.findById(submissionId).orElse(null);

        if (submission == null) return;

        ExecutionResult result =
                codeExecutionService.executeInternal(submission);

        submission.setVerdict(result.getVerdict());
        submission.setExecutionTimeMs(result.getExecutionTimeMs());

        submissionRepository.save(submission);

        if ("ACCEPTED".equals(result.getVerdict())) {
            leaderboardService.updateScore(
                    submission.getProblemId(),
                    submission.getCandidateEmail(),
                    submission.getExecutionTimeMs()
            );
        }
    }
}
