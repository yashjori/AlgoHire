package com.algohire.backend.execution;

import com.algohire.backend.leaderboard.LeaderboardService;
import com.algohire.backend.problem.Problem;
import com.algohire.backend.problem.ProblemRepository;
import com.algohire.backend.problem.TestCase;
import com.algohire.backend.submission.Submission;
import com.algohire.backend.submission.SubmissionRepository;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ExecutionWorker {

    private final RedisTemplate<String, String> redisTemplate;
    private final CodeExecutionService codeExecutionService;
    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final LeaderboardService leaderboardService;

    public ExecutionWorker(
            RedisTemplate<String, String> redisTemplate,
            CodeExecutionService codeExecutionService,
            SubmissionRepository submissionRepository,
            ProblemRepository problemRepository,
            LeaderboardService leaderboardService) {
        this.redisTemplate = redisTemplate;
        this.codeExecutionService = codeExecutionService;
        this.submissionRepository = submissionRepository;
        this.problemRepository = problemRepository;
        this.leaderboardService = leaderboardService;
    }

    @Scheduled(fixedDelay = 1000)
    public void consumeQueue() {
        String submissionId = redisTemplate.opsForList().leftPop("execution-queue");
        if (submissionId == null) return;

        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) return;

        // Load the hidden test cases from the problem (not from the submission request)
        Problem problem = problemRepository.findById(submission.getProblemId()).orElse(null);
        if (problem == null || problem.getTestCases() == null || problem.getTestCases().isEmpty()) {
            submission.setVerdict("ERROR");
            submissionRepository.save(submission);
            return;
        }

        // Build request with the actual hidden test cases
        ExecutionRequest request = new ExecutionRequest();
        request.setLanguage(submission.getLanguage());
        request.setCode(submission.getCode());
        request.setProblemId(submission.getProblemId());
        request.setTimeLimitMs(problem.getTimeLimitMs());
        request.setSolveTimeMs(submission.getSolveTimeMs());
        request.setTabSwitches(submission.getTabSwitches());
        request.setCopyEvents(submission.getCopyEvents());

        List<TestCaseDTO> dtos = problem.getTestCases().stream().map(tc -> {
            TestCaseDTO dto = new TestCaseDTO();
            dto.setInput(tc.getInput());
            dto.setExpectedOutput(tc.getExpectedOutput());
            return dto;
        }).collect(Collectors.toList());
        request.setTestCases(dtos);

        ExecutionResult result = codeExecutionService.executeOnly(request);

        // Update submission in-place
        submission.setVerdict(result.getVerdict());
        submission.setExecutionTimeMs(result.getExecutionTimeMs());
        submissionRepository.save(submission);

        // Update leaderboard only for clean accepted results
        if ("ACCEPTED".equals(result.getVerdict()) && !submission.isSuspicious()) {
            leaderboardService.updateScore(
                    submission.getProblemId(),
                    submission.getCandidateEmail(),
                    submission.getExecutionTimeMs());
        }
    }
}
