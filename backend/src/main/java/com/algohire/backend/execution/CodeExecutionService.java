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
import java.util.List;
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
            AntiCheatService antiCheatService) {
        this.submissionRepository = submissionRepository;
        this.leaderboardService = leaderboardService;
        this.redisTemplate = redisTemplate;
        this.antiCheatService = antiCheatService;
    }

    // ─── Languages ────────────────────────────────────────────────────────────

    private record LangConfig(
            String dockerImage,
            String fileName,
            List<String> compileCmd,   // null if interpreted
            List<String> runCmd
    ) {}

    private LangConfig resolveLanguage(String language) {
        return switch (language.toUpperCase()) {
            case "JAVA" -> new LangConfig(
                    "eclipse-temurin:21",
                    "Solution.java",
                    List.of("javac", "/app/Solution.java"),
                    List.of("java", "-cp", "/app", "Solution")
            );
            case "PYTHON" -> new LangConfig(
                    "python:3.11-slim",
                    "solution.py",
                    null,
                    List.of("python3", "/app/solution.py")
            );
            case "CPP" -> new LangConfig(
                    "gcc:12",
                    "solution.cpp",
                    List.of("g++", "-O2", "-std=c++17", "-o", "/app/solution", "/app/solution.cpp"),
                    List.of("/app/solution")
            );
            case "JAVASCRIPT" -> new LangConfig(
                    "node:20-slim",
                    "solution.js",
                    null,
                    List.of("node", "/app/solution.js")
            );
            case "TYPESCRIPT" -> new LangConfig(
                    "node:20-slim",
                    "solution.ts",
                    List.of("sh", "-c", "npx tsc --target ES2020 --module commonjs --outDir /app /app/solution.ts 2>&1"),
                    List.of("node", "/app/solution.js")
            );
            case "GO" -> new LangConfig(
                    "golang:1.22-alpine",
                    "solution.go",
                    List.of("go", "build", "-o", "/app/solution", "/app/solution.go"),
                    List.of("/app/solution")
            );
            case "RUST" -> new LangConfig(
                    "rust:1.76-slim",
                    "solution.rs",
                    List.of("rustc", "-O", "-o", "/app/solution", "/app/solution.rs"),
                    List.of("/app/solution")
            );
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }

    // ─── Public: enqueue (async) ──────────────────────────────────────────────

    public String enqueue(ExecutionRequest request) {
        String jobId = UUID.randomUUID().toString();

        Submission submission = new Submission();
        submission.setId(jobId);
        submission.setProblemId(request.getProblemId());
        submission.setCandidateEmail(SecurityContextHolder.getContext().getAuthentication().getName());
        submission.setLanguage(request.getLanguage());
        submission.setCode(request.getCode());
        submission.setVerdict("PENDING");
        submission.setSolveTimeMs(request.getSolveTimeMs());
        submission.setTabSwitches(request.getTabSwitches());
        submission.setCopyEvents(request.getCopyEvents());

        var antiCheat = antiCheatService.analyze(request);
        submission.setSuspicious(antiCheat.suspicious());
        submission.setCheatReason(String.join(", ", antiCheat.reasons()));

        submissionRepository.save(submission);
        redisTemplate.opsForList().rightPush("execution-queue", jobId);
        return jobId;
    }

    // ─── Called by ExecutionWorker ────────────────────────────────────────────

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

    // ─── Core execution engine ────────────────────────────────────────────────

    public ExecutionResult executeOnly(ExecutionRequest request) {
        ExecutionResult result = new ExecutionResult();
        Path tempDir = null;

        try {
            LangConfig lang = resolveLanguage(request.getLanguage());
            tempDir = Files.createTempDirectory("code-runner-");
            Path sourceFile = tempDir.resolve(lang.fileName());
            Files.writeString(sourceFile, request.getCode());

            // ── Compile (if needed) ──────────────────────────────────────────
            if (lang.compileCmd() != null) {
                ProcessBuilder compileBuilder = buildDockerProcess(lang.dockerImage(), tempDir, lang.compileCmd());
                Process compile = compileBuilder.start();
                compile.waitFor(30, TimeUnit.SECONDS);
                if (compile.exitValue() != 0) {
                    result.setVerdict("COMPILATION_ERROR");
                    result.setError(readStream(compile.getErrorStream()));
                    return result;
                }
            }

            // ── Run each test case ───────────────────────────────────────────
            long totalTime = 0;
            int passed = 0;
            int total = request.getTestCases() != null ? request.getTestCases().size() : 0;

            for (TestCaseDTO tc : request.getTestCases()) {
                long start = System.currentTimeMillis();

                ProcessBuilder runBuilder = buildDockerProcess(lang.dockerImage(), tempDir, lang.runCmd());
                Process run = runBuilder.start();

                // Feed input
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(run.getOutputStream()))) {
                    writer.write(tc.getInput());
                    writer.newLine();
                    writer.flush();
                }

                boolean finished = run.waitFor(request.getTimeLimitMs(), TimeUnit.MILLISECONDS);
                long elapsed = System.currentTimeMillis() - start;
                totalTime += elapsed;

                if (!finished) {
                    run.destroyForcibly();
                    result.setVerdict("TIME_LIMIT_EXCEEDED");
                    result.setExecutionTimeMs(totalTime);
                    result.setTestsPassed(passed);
                    result.setTestsTotal(total);
                    return result;
                }

                if (run.exitValue() != 0) {
                    result.setVerdict("RUNTIME_ERROR");
                    result.setError(readStream(run.getErrorStream()));
                    result.setExecutionTimeMs(totalTime);
                    result.setTestsPassed(passed);
                    result.setTestsTotal(total);
                    return result;
                }

                String output = readStream(run.getInputStream()).trim();
                String expected = tc.getExpectedOutput().trim();

                if (!output.equals(expected)) {
                    result.setVerdict("WRONG_ANSWER");
                    result.setExecutionTimeMs(totalTime);
                    result.setTestsPassed(passed);
                    result.setTestsTotal(total);
                    return result;
                }
                passed++;
            }

            result.setVerdict("ACCEPTED");
            result.setExecutionTimeMs(totalTime);
            result.setTestsPassed(passed);
            result.setTestsTotal(total);
            return result;

        } catch (IllegalArgumentException e) {
            result.setVerdict("ERROR");
            result.setError(e.getMessage());
            return result;
        } catch (Exception e) {
            result.setVerdict("RUNTIME_ERROR");
            result.setError(e.getMessage());
            return result;
        } finally {
            cleanup(tempDir);
        }
    }

    // ─── Legacy: direct execute + save ───────────────────────────────────────

    public ExecutionResult execute(ExecutionRequest request) {
        ExecutionResult result = executeOnly(request);
        saveSubmission(request, result);
        return result;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private ProcessBuilder buildDockerProcess(String image, Path tempDir, List<String> cmd) {
        List<String> dockerCmd = new java.util.ArrayList<>(List.of(
                "docker", "run", "--rm", "-i",
                "--network", "none",               // no network access
                "--memory", "256m",
                "--cpus", "0.5",
                "-v", tempDir.toAbsolutePath() + ":/app",
                image
        ));
        dockerCmd.addAll(cmd);
        return new ProcessBuilder(dockerCmd);
    }

    private void saveSubmission(ExecutionRequest request, ExecutionResult result) {
        Submission submission = new Submission();
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
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
    }

    private void cleanup(Path tempDir) {
        if (tempDir == null) return;
        try {
            Files.walk(tempDir).sorted(Comparator.reverseOrder()).map(Path::toFile).forEach(File::delete);
        } catch (IOException ignored) {}
    }

    private String readStream(InputStream stream) throws IOException {
        return new String(stream.readAllBytes());
    }
}
