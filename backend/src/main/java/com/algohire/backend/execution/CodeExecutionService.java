package com.algohire.backend.execution;

import com.algohire.backend.anticheat.AntiCheatService;
import com.algohire.backend.leaderboard.LeaderboardService;
import com.algohire.backend.submission.Submission;
import com.algohire.backend.submission.SubmissionRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.RedisTemplate;

import java.io.*;
import java.nio.file.*;
import java.util.Comparator;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class CodeExecutionService {

    private final SubmissionRepository submissionRepository;
    private final LeaderboardService leaderboardService;
    private final RedisTemplate<String, String> redisTemplate;
    private final AntiCheatService antiCheatService;

    public CodeExecutionService(
            SubmissionRepository submissionRepository,
            LeaderboardService leaderboardService,
            RedisTemplate<String, String> redisTemplate,
            AntiCheatService antiCheatService
    ) {
        this.submissionRepository = submissionRepository;
        this.leaderboardService = leaderboardService;
        this.redisTemplate = redisTemplate;
        this.antiCheatService = antiCheatService;
    }

    // -----------------------------------------------------------------------
    // Public: enqueue (called by ExecutionController)
    // Saves a PENDING submission immediately and pushes job to Redis queue.
    // -----------------------------------------------------------------------
    public String enqueue(ExecutionRequest request) {

        String jobId = UUID.randomUUID().toString();

        Submission submission = new Submission();
        submission.setId(jobId);
        submission.setProblemId(request.getProblemId());
        submission.setCandidateEmail(
            SecurityContextHolder.getContext().getAuthentication().getName()
        );
        submission.setLanguage(request.getLanguage());
        submission.setCode(request.getCode());
        submission.setVerdict("PENDING");

        // Persist anti-cheat signals so ExecutionWorker can use them
        // when deciding whether to update the leaderboard.
        submission.setSolveTimeMs(request.getSolveTimeMs());
        submission.setTabSwitches(request.getTabSwitches());
        submission.setCopyEvents(request.getCopyEvents());

        // Run anti-cheat analysis eagerly on enqueue
        var antiCheat = antiCheatService.analyze(request);
        submission.setSuspicious(antiCheat.suspicious());
        submission.setCheatReason(String.join(", ", antiCheat.reasons()));

        submissionRepository.save(submission);

        redisTemplate.opsForList().rightPush("execution-queue", jobId);

        return jobId;
    }

    // -----------------------------------------------------------------------
    // Called by ExecutionWorker — builds a request from the stored submission
    // and runs code WITHOUT creating a new Submission document.
    // The worker updates the existing PENDING record in-place.
    // -----------------------------------------------------------------------
    public ExecutionResult executeInternal(Submission submission) {

        ExecutionRequest request = new ExecutionRequest();
        request.setLanguage(submission.getLanguage());
        request.setCode(submission.getCode());
        request.setProblemId(submission.getProblemId());
        request.setTimeLimitMs(2000);
        request.setSolveTimeMs(submission.getSolveTimeMs());
        request.setTabSwitches(submission.getTabSwitches());
        request.setCopyEvents(submission.getCopyEvents());

        return executeOnly(request);
    }

    // -----------------------------------------------------------------------
    // Runs code against test cases and returns the result WITHOUT persisting
    // a new Submission document. Safe to call from the async worker.
    // -----------------------------------------------------------------------
    public ExecutionResult executeOnly(ExecutionRequest request) {

        ExecutionResult result = new ExecutionResult();
        Path tempDir = null;

        try {
            tempDir = Files.createTempDirectory("code-runner");

            Path javaFile = tempDir.resolve("Solution.java");
            Files.writeString(javaFile, request.getCode());

            Process compile = new ProcessBuilder(
                    "docker", "run", "--rm",
                    "-v", tempDir.toAbsolutePath() + ":/app",
                    "eclipse-temurin:21",
                    "javac", "/app/Solution.java"
            ).start();
            compile.waitFor();

            if (compile.exitValue() != 0) {
                result.setVerdict("COMPILATION_ERROR");
                result.setError(readStream(compile.getErrorStream()));
                return result;
            }

            long totalExecutionTime = 0;
            for (TestCaseDTO tc : request.getTestCases()) {

                long start = System.currentTimeMillis();

                Process run = new ProcessBuilder(
                        "docker", "run", "--rm", "-i",
                        "-v", tempDir.toAbsolutePath() + ":/app",
                        "eclipse-temurin:21",
                        "java", "-cp", "/app", "Solution"
                ).start();

                try (BufferedWriter writer =
                             new BufferedWriter(new OutputStreamWriter(run.getOutputStream()))) {
                    writer.write(tc.getInput());
                    writer.newLine();
                }

                boolean finished = run.waitFor(request.getTimeLimitMs(), TimeUnit.MILLISECONDS);
                long end = System.currentTimeMillis();
                totalExecutionTime += (end - start);

                if (!finished) {
                    run.destroy();
                    result.setVerdict("TLE");
                    result.setExecutionTimeMs(totalExecutionTime);
                    return result;
                }

                String output = readStream(run.getInputStream()).trim();
                if (!output.equals(tc.getExpectedOutput().trim())) {
                    result.setVerdict("WRONG_ANSWER");
                    result.setExecutionTimeMs(totalExecutionTime);
                    return result;
                }
            }

            result.setVerdict("ACCEPTED");
            result.setExecutionTimeMs(totalExecutionTime);
            return result;

        } catch (Exception e) {
            result.setVerdict("RUNTIME_ERROR");
            result.setError(e.getMessage());
            return result;

        } finally {
            if (tempDir != null) {
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                } catch (IOException ignored) {}
            }
        }
    }

    // -----------------------------------------------------------------------
    // Legacy: direct execute + save in one shot (kept for any direct callers)
    // -----------------------------------------------------------------------
    public ExecutionResult execute(ExecutionRequest request) {
        ExecutionResult result = executeOnly(request);
        saveSubmission(request, result);
        return result;
    }

    private void saveSubmission(ExecutionRequest request, ExecutionResult result) {

        Submission submission = new Submission();

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        submission.setCandidateEmail(email);
        submission.setProblemId(request.getProblemId());
        submission.setLanguage(request.getLanguage());
        submission.setCode(request.getCode());
        submission.setVerdict(result.getVerdict());
        submission.setExecutionTimeMs(result.getExecutionTimeMs());
        submission.setSolveTimeMs(request.getSolveTimeMs());
        submission.setTabSwitches(request.getTabSwitches());
        submission.setCopyEvents(request.getCopyEvents());

        var antiCheat = antiCheatService.analyze(request);
        submission.setSuspicious(antiCheat.suspicious());
        submission.setCheatReason(String.join(", ", antiCheat.reasons()));

        submissionRepository.save(submission);

        if ("ACCEPTED".equals(result.getVerdict()) &&
                (!submission.isSuspicious() || "APPROVED".equals(submission.getReviewStatus()))) {
            leaderboardService.updateScore(
                    submission.getProblemId(),
                    submission.getCandidateEmail(),
                    submission.getExecutionTimeMs()
            );
        }
    }

    private String readStream(InputStream stream) throws IOException {
        return new String(stream.readAllBytes());
    }
}
