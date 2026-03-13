package com.algohire.backend.leaderboard;

import com.algohire.backend.submission.Submission;
import com.algohire.backend.submission.SubmissionRepository;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/leaderboard")
public class LeaderboardController {

    private final LeaderboardService service;
    private final SubmissionRepository submissionRepository;

    public LeaderboardController(LeaderboardService service, SubmissionRepository submissionRepository) {
        this.service = service;
        this.submissionRepository = submissionRepository;
    }

    @GetMapping("/{problemId}")
    public List<Map<String, Object>> leaderboard(@PathVariable String problemId) {

        Set<ZSetOperations.TypedTuple<String>> top = service.topN(problemId, 25);
        List<Map<String, Object>> response = new ArrayList<>();

        // Build a map of email → language for fastest submission per user
        Map<String, String> emailToLanguage = new HashMap<>();
        submissionRepository.findByProblemId(problemId).forEach(s -> {
            if ("ACCEPTED".equals(s.getVerdict())) {
                emailToLanguage.putIfAbsent(s.getCandidateEmail(), s.getLanguage());
            }
        });

        int rank = 1;
        for (var entry : top) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rank", rank++);
            row.put("email", entry.getValue());
            row.put("executionTimeMs", entry.getScore() != null ? entry.getScore().longValue() : 0);
            row.put("language", emailToLanguage.getOrDefault(entry.getValue(), "N/A"));
            response.add(row);
        }
        return response;
    }
}
